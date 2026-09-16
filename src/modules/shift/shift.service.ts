import {
  CashMovementType,
  EmployeeStatus,
  Prisma,
  ShiftStatus,
} from "@prisma/client";

import { prisma } from "../../config/database.js";
import {
  conflict,
  notFound,
} from "../../utils/app-error.js";

import {
  calculateExpectedCash,
  calculateVariance,
  ensureNonNegative,
  ensurePositive,
  toDecimal,
} from "./shift.rules.js";

import type {
  CashMovementInput,
  CloseShiftInput,
  OpenShiftInput,
  ShiftListQuery,
} from "./shift.types.js";

const shiftSelect = {
  id: true,
  branchId: true,
  employeeId: true,
  startedAt: true,
  endedAt: true,
  openingCash: true,
  closingCash: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,

  branch: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },

  employee: {
    select: {
      id: true,
      employeeCode: true,
      name: true,
      status: true,
    },
  },
} satisfies Prisma.ShiftSelect;

const ensureShift = async (
  businessId: string,
  shiftId: string,
) => {
  const shift =
    await prisma.shift.findFirst({
      where: {
        id: shiftId,

        branch: {
          businessId,
        },
      },

      select: shiftSelect,
    });

  if (!shift) {
    throw notFound(
      "Shift tidak ditemukan",
    );
  }

  return shift;
};

const ensureBranch = async (
  businessId: string,
  branchId: string,
) => {
  const branch =
    await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId,
      },

      select: {
        id: true,
        code: true,
        name: true,
        status: true,
      },
    });

  if (!branch) {
    throw notFound(
      "Branch tidak ditemukan",
    );
  }

  if (branch.status !== "ACTIVE") {
    throw conflict(
      "Branch tidak aktif",
    );
  }

  return branch;
};

const ensureEmployee = async (
  businessId: string,
  employeeId: string,
  branchId: string,
) => {
  const employee =
    await prisma.employee.findFirst({
      where: {
        id: employeeId,
        businessId,
      },

      select: {
        id: true,
        employeeCode: true,
        name: true,
        status: true,
        branchId: true,
      },
    });

  if (!employee) {
    throw notFound(
      "Employee tidak ditemukan",
    );
  }

  if (
    employee.status !==
    EmployeeStatus.ACTIVE
  ) {
    throw conflict(
      "Employee tidak aktif",
    );
  }

  if (
    employee.branchId !== branchId
  ) {
    throw conflict(
      "Employee bukan bagian dari branch tersebut",
    );
  }

  return employee;
};

const ensureCashRegister = async (
  businessId: string,
  branchId: string,
  cashRegisterId: string,
) => {
  const register =
    await prisma.cashRegister.findFirst({
      where: {
        id: cashRegisterId,

        branch: {
          id: branchId,
          businessId,
        },

        active: true,
      },

      select: {
        id: true,
        branchId: true,
        code: true,
        name: true,
      },
    });

  if (!register) {
    throw notFound(
      "Cash register tidak ditemukan",
    );
  }

  return register;
};

export const listShifts = async (
  businessId: string,
  query: ShiftListQuery,
) => {
  const where: Prisma.ShiftWhereInput = {
    branch: {
      businessId,
    },

    ...(query.branchId
      ? {
          branchId:
            query.branchId,
        }
      : {}),

    ...(query.employeeId
      ? {
          employeeId:
            query.employeeId,
        }
      : {}),

    ...(query.status
      ? {
          status:
            query.status,
        }
      : {}),
  };

  const [items, total] =
    await prisma.$transaction([
      prisma.shift.findMany({
        where,

        orderBy: {
          startedAt: "desc",
        },

        skip:
          (query.page - 1) *
          query.limit,

        take: query.limit,

        select: shiftSelect,
      }),

      prisma.shift.count({
        where,
      }),
    ]);

  return {
    items,

    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages:
        Math.ceil(
          total / query.limit,
        ),
    },
  };
};

export const getShiftById = async (
  businessId: string,
  shiftId: string,
) => {
  return ensureShift(
    businessId,
    shiftId,
  );
};

export const openShift = async (
  businessId: string,
  input: OpenShiftInput,
) => {
  const openingCash =
    toDecimal(
      input.openingCash,
    );

  ensureNonNegative(
    openingCash,
    "Opening cash tidak boleh negatif",
  );

  await ensureBranch(
    businessId,
    input.branchId,
  );

  await ensureEmployee(
    businessId,
    input.employeeId,
    input.branchId,
  );

  await ensureCashRegister(
    businessId,
    input.branchId,
    input.cashRegisterId,
  );

  const existingEmployeeShift =
    await prisma.shift.findFirst({
      where: {
        employeeId:
          input.employeeId,

        status:
          ShiftStatus.OPEN,
      },

      select: {
        id: true,
      },
    });

  if (existingEmployeeShift) {
    throw conflict(
      "Employee masih memiliki shift yang terbuka",
    );
  }

  const existingCashSession =
    await prisma.cashSession.findFirst({
      where: {
        cashRegisterId:
          input.cashRegisterId,

        status:
          ShiftStatus.OPEN,
      },

      select: {
        id: true,
      },
    });

  if (existingCashSession) {
    throw conflict(
      "Cash register masih memiliki session yang terbuka",
    );
  }

  return prisma.$transaction(
    async (tx) => {
      /*
       * Re-check inside transaction.
       *
       * Ini penting untuk race condition:
       * dua request OPEN SHIFT bersamaan.
       */
      const existingShift =
        await tx.shift.findFirst({
          where: {
            employeeId:
              input.employeeId,

            status:
              ShiftStatus.OPEN,
          },

          select: {
            id: true,
          },
        });

      if (existingShift) {
        throw conflict(
          "Employee masih memiliki shift yang terbuka",
        );
      }

      const existingSession =
        await tx.cashSession.findFirst({
          where: {
            cashRegisterId:
              input.cashRegisterId,

            status:
              ShiftStatus.OPEN,
          },

          select: {
            id: true,
          },
        });

      if (existingSession) {
        throw conflict(
          "Cash register masih memiliki session yang terbuka",
        );
      }

      const startedAt =
        input.startedAt ??
        new Date();

      const shift =
        await tx.shift.create({
          data: {
            branchId:
              input.branchId,

            employeeId:
              input.employeeId,

            startedAt,

            openingCash,

            status:
              ShiftStatus.OPEN,

            notes:
              input.notes ?? null,
          },

          select: shiftSelect,
        });

      const session =
        await tx.cashSession.create({
          data: {
            cashRegisterId:
              input.cashRegisterId,

            shiftId:
              shift.id,

            employeeId:
              input.employeeId,

            openedAt:
              startedAt,

            openingBalance:
              openingCash,

            status:
              ShiftStatus.OPEN,
          },

          select: {
            id: true,
            cashRegisterId: true,
            shiftId: true,
            employeeId: true,
            openingBalance: true,
            status: true,
          },
        });

      await tx.cashMovement.create({
        data: {
          cashSessionId:
            session.id,

          employeeId:
            input.employeeId,

          type:
            CashMovementType.OPENING_BALANCE,

          amount:
            openingCash,

          description:
            "Opening cash",
        },
      });

      return {
        shift,
        cashSession: session,
      };
    },
  );
};

export const closeShift = async (
  businessId: string,
  shiftId: string,
  input: CloseShiftInput,
) => {
  const closingCash =
    toDecimal(
      input.closingCash,
    );

  ensureNonNegative(
    closingCash,
    "Closing cash tidak boleh negatif",
  );

  return prisma.$transaction(
    async (tx) => {
      const shift =
        await tx.shift.findFirst({
          where: {
            id: shiftId,

            branch: {
              businessId,
            },
          },

          select: {
            id: true,
            branchId: true,
            employeeId: true,
            openingCash: true,
            status: true,
            startedAt: true,
          },
        });

      if (!shift) {
        throw notFound(
          "Shift tidak ditemukan",
        );
      }

      if (
        shift.status !==
        ShiftStatus.OPEN
      ) {
        throw conflict(
          "Shift sudah ditutup",
        );
      }

      const session =
        await tx.cashSession.findFirst({
          where: {
            shiftId,

            status:
              ShiftStatus.OPEN,
          },

          select: {
            id: true,
            openingBalance: true,
          },
        });

      if (!session) {
        throw conflict(
          "Cash session aktif tidak ditemukan",
        );
      }

      const movements =
        await tx.cashMovement.findMany({
          where: {
            cashSessionId:
              session.id,
          },

          select: {
            type: true,
            amount: true,
          },
        });

      let cashIn =
        new Prisma.Decimal(0);

      let cashOut =
        new Prisma.Decimal(0);

      for (const movement of movements) {
        if (
          movement.type ===
            CashMovementType.OPENING_BALANCE ||
          movement.type ===
            CashMovementType.CASH_IN ||
          movement.type ===
            CashMovementType.SALE ||
          movement.type ===
            CashMovementType.ADJUSTMENT
        ) {
          cashIn =
            cashIn.plus(
              movement.amount,
            );
        }

        if (
          movement.type ===
            CashMovementType.CASH_OUT ||
          movement.type ===
            CashMovementType.EXPENSE ||
          movement.type ===
            CashMovementType.REFUND
        ) {
          cashOut =
            cashOut.plus(
              movement.amount,
            );
        }
      }

      /*
       * opening balance sudah
       * dihitung dalam cashIn.
       *
       * Jadi jangan tambah openingCash
       * kedua kalinya.
       */
      const expectedCash =
        cashIn.minus(cashOut);

      const variance =
        calculateVariance(
          closingCash,
          expectedCash,
        );

      const endedAt =
        input.endedAt ??
        new Date();

      const updatedShift =
        await tx.shift.update({
          where: {
            id: shiftId,
          },

          data: {
            endedAt,

            closingCash,

            status:
              ShiftStatus.CLOSED,

            notes:
              input.notes ??
              null,
          },

          select: shiftSelect,
        });

      await tx.cashSession.update({
        where: {
          id: session.id,
        },

        data: {
          closedAt: endedAt,

          expectedBalance:
            expectedCash,

          actualBalance:
            closingCash,

          status:
            ShiftStatus.CLOSED,
        },
      });

      await tx.cashMovement.create({
        data: {
          cashSessionId:
            session.id,

          employeeId:
            shift.employeeId,

          type:
            CashMovementType.CLOSING_BALANCE,

          amount:
            closingCash,

          description:
            "Closing cash",
        },
      });

      return {
        shift: updatedShift,

        summary: {
          openingCash:
            shift.openingCash.toString(),

          cashIn:
            cashIn.toString(),

          cashOut:
            cashOut.toString(),

          expectedCash:
            expectedCash.toString(),

          closingCash:
            closingCash.toString(),

          variance:
            variance.toString(),
        },
      };
    },
  );
};

export const addCashMovement =
  async (
    businessId: string,
    shiftId: string,
    input: CashMovementInput,
  ) => {
    const amount =
      toDecimal(input.amount);

    ensurePositive(
      amount,
      "Amount harus lebih besar dari 0",
    );

    if (
      input.type ===
        CashMovementType.CASH_IN ||
      input.type ===
        CashMovementType.CASH_OUT ||
      input.type ===
        CashMovementType.ADJUSTMENT
    ) {
      // valid
    }

    return prisma.$transaction(
      async (tx) => {
        const shift =
          await tx.shift.findFirst({
            where: {
              id: shiftId,

              branch: {
                businessId,
              },
            },

            select: {
              id: true,
              employeeId: true,
              status: true,
            },
          });

        if (!shift) {
          throw notFound(
            "Shift tidak ditemukan",
          );
        }

        if (
          shift.status !==
          ShiftStatus.OPEN
        ) {
          throw conflict(
            "Shift sudah ditutup",
          );
        }

        const session =
          await tx.cashSession.findFirst({
            where: {
              shiftId,

              status:
                ShiftStatus.OPEN,
            },

            select: {
              id: true,
            },
          });

        if (!session) {
          throw conflict(
            "Cash session aktif tidak ditemukan",
          );
        }

        return tx.cashMovement.create({
          data: {
            cashSessionId:
              session.id,

            employeeId: shift.employeeId,

            type: input.type,

            amount,

            description:
              input.description ??
              null,

            referenceType:
              input.referenceType ??
              null,

            referenceId:
              input.referenceId ??
              null,
          },
        });
      },
    );
  };

export const listCashMovements =
  async (
    businessId: string,
    shiftId: string,
  ) => {
    await ensureShift(
      businessId,
      shiftId,
    );

    const session =
      await prisma.cashSession.findFirst({
        where: {
          shiftId,
        },

        select: {
          id: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    if (!session) {
      return [];
    }

    return prisma.cashMovement.findMany({
      where: {
        cashSessionId:
          session.id,
      },

      orderBy: {
        createdAt: "asc",
      },
    });
  };