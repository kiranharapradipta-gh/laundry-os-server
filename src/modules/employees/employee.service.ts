import { Prisma } from "@prisma/client";

import { prisma } from "../../config/database.js";
import {
  conflict,
  notFound,
} from "../../utils/app-error.js";

import type {
  CreateEmployeeInput,
  EmployeeListInput,
  EmployeeShiftListInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from "./employee.validation.js";

const employeeSelect = {
  id: true,
  businessId: true,
  employeeCode: true,
  name: true,
  phone: true,
  email: true,
  position: true,
  status: true,
  hiredAt: true,
  terminatedAt: true,
  baseSalary: true,
  branch: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
    },
  },
  department: {
    select: {
      id: true,
      name: true,
      active: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      status: true,
    },
  },
  _count: {
    select: {
      shifts: true,
      machineUsages: true,
      productionTasks: true,
      cashSessions: true,
      cashMovements: true,
      complaints: true,
      auditLogs: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EmployeeSelect;

const ensureEmployee = async (
  businessId: string,
  employeeId: string,
) => {
  const employee =
    await prisma.employee.findFirst({
      where: {
        id: employeeId,
        businessId,
      },
      select: {
        id: true,
        businessId: true,
        employeeCode: true,
        name: true,
        status: true,
      },
    });

  if (!employee) {
    throw notFound(
      "Employee tidak ditemukan",
    );
  }

  return employee;
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

  return branch;
};

const ensureDepartment = async (
  businessId: string,
  departmentId: string,
) => {
  const department =
    await prisma.department.findFirst({
      where: {
        id: departmentId,
        businessId,
      },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

  if (!department) {
    throw notFound(
      "Department tidak ditemukan",
    );
  }

  return department;
};

const ensureEmployeeCodeAvailable = async (
  businessId: string,
  employeeCode: string,
  excludeEmployeeId?: string,
) => {
  const existing =
    await prisma.employee.findFirst({
      where: {
        businessId,
        employeeCode,
        ...(excludeEmployeeId
          ? {
              id: {
                not: excludeEmployeeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    throw conflict(
      "Kode employee sudah digunakan",
    );
  }
};

const normalizeNullableString = (
  value: string | null | undefined,
) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
};

export const listEmployees = async (
  businessId: string,
  input: EmployeeListInput,
) => {
  const {
    page,
    limit,
    search,
    status,
    branchId,
    departmentId,
  } = input;

  const skip = (page - 1) * limit;

  const where: Prisma.EmployeeWhereInput = {
    businessId,

    ...(search
      ? {
          OR: [
            {
              employeeCode: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              position: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),

    ...(status
      ? {
          status,
        }
      : {}),

    ...(branchId
      ? {
          branchId,
        }
      : {}),

    ...(departmentId
      ? {
          departmentId,
        }
      : {}),
  };

  const [items, total] =
    await prisma.$transaction([
      prisma.employee.findMany({
        where,
        select: employeeSelect,
        orderBy: [
          {
            name: "asc",
          },
          {
            employeeCode: "asc",
          },
        ],
        skip,
        take: limit,
      }),

      prisma.employee.count({
        where,
      }),
    ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit,
      ),
    },
  };
};

export const getEmployeeById = async (
  businessId: string,
  employeeId: string,
) => {
  await ensureEmployee(
    businessId,
    employeeId,
  );

  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      businessId,
    },
    select: employeeSelect,
  });
};

export const createEmployee = async (
  businessId: string,
  input: CreateEmployeeInput,
) => {
  await ensureEmployeeCodeAvailable(
    businessId,
    input.employeeCode,
  );

  if (input.branchId) {
    const branch =
      await ensureBranch(
        businessId,
        input.branchId,
      );

    if (branch.status !== "ACTIVE") {
      throw conflict(
        "Employee hanya dapat ditempatkan pada branch aktif",
      );
    }
  }

  if (input.departmentId) {
    const department =
      await ensureDepartment(
        businessId,
        input.departmentId,
      );

    if (!department.active) {
      throw conflict(
        "Department sedang tidak aktif",
      );
    }
  }

  try {
    return await prisma.employee.create({
      data: {
        employeeCode: input.employeeCode,
        name: input.name,

        ...(input.phone !== undefined && {
          phone: input.phone,
        }),

        ...(input.email !== undefined && {
          email: input.email,
        }),

        ...(input.position !== undefined && {
          position: input.position,
        }),

        ...(input.hiredAt !== undefined && {
          hiredAt: input.hiredAt,
        }),

        ...(input.baseSalary !== undefined && {
          baseSalary:
            input.baseSalary === null
              ? null
              : new Prisma.Decimal(input.baseSalary),
        }),

        business: {
          connect: {
            id: businessId,
          },
        },

        ...(input.branchId !== undefined && {
          branch:
            input.branchId === null
              ? { disconnect: true }
              : {
                  connect: {
                    id: input.branchId,
                  },
                },
        }),

        ...(input.departmentId !== undefined && {
          department:
            input.departmentId === null
              ? { disconnect: true }
              : {
                  connect: {
                    id: input.departmentId,
                  },
                },
        }),
      },
      select: employeeSelect,
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict(
        "Kode employee sudah digunakan",
      );
    }

    throw error;
  }
};

export const updateEmployee = async (
  businessId: string,
  employeeId: string,
  input: UpdateEmployeeInput,
) => {
  await ensureEmployee(
    businessId,
    employeeId,
  );

  if (input.employeeCode !== undefined) {
    await ensureEmployeeCodeAvailable(
      businessId,
      input.employeeCode,
      employeeId,
    );
  }

  if (
    input.branchId !== undefined &&
    input.branchId !== null
  ) {
    const branch =
      await ensureBranch(
        businessId,
        input.branchId,
      );

    if (branch.status !== "ACTIVE") {
      throw conflict(
        "Employee hanya dapat ditempatkan pada branch aktif",
      );
    }
  }

  if (
    input.departmentId !== undefined &&
    input.departmentId !== null
  ) {
    const department =
      await ensureDepartment(
        businessId,
        input.departmentId,
      );

    if (!department.active) {
      throw conflict(
        "Department sedang tidak aktif",
      );
    }
  }

  const data: Prisma.EmployeeUpdateInput = {
    ...(input.phone !== undefined && {
      phone: input.phone,
    }),

    ...(input.email !== undefined && {
      email: input.email,
    }),

    ...(input.position !== undefined && {
      position: input.position,
    }),

    ...(input.hiredAt !== undefined && {
      hiredAt: input.hiredAt,
    }),

    ...(input.baseSalary !== undefined && {
      baseSalary:
        input.baseSalary === null
          ? null
          : new Prisma.Decimal(input.baseSalary),
    }),

    ...(input.branchId !== undefined && {
      branch:
        input.branchId === null
          ? { disconnect: true }
          : {
              connect: {
                id: input.branchId,
              },
            },
    }),

    ...(input.departmentId !== undefined && {
      department:
        input.departmentId === null
          ? { disconnect: true }
          : {
              connect: {
                id: input.departmentId,
              },
            },
    }),
  };

  try {
    return await prisma.employee.update({
      where: {
        id: employeeId,
      },
      data,
      select: employeeSelect,
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict(
        "Kode employee sudah digunakan",
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw notFound(
        "Employee tidak ditemukan",
      );
    }

    throw error;
  }
};

export const updateEmployeeStatus =
  async (
    businessId: string,
    employeeId: string,
    input: UpdateEmployeeStatusInput,
  ) => {
    const employee =
      await ensureEmployee(
        businessId,
        employeeId,
      );

    if (
      employee.status ===
      input.status
    ) {
      throw conflict(
        `Employee sudah berstatus ${input.status}`,
      );
    }

    const isTerminated =
      input.status === "TERMINATED";

    const data: Prisma.EmployeeUpdateInput =
      {
        status: input.status,
        ...(isTerminated
          ? {
              terminatedAt:
                new Date(),
            }
          : employee.status ===
              "TERMINATED"
            ? {
                terminatedAt: null,
              }
            : {}),
      };

        return prisma.employee.update({
      where: {
        id: employeeId,
      },
      data,
      select: employeeSelect,
    });
  };

export const deleteEmployee = async (
  businessId: string,
  employeeId: string,
) => {
  const employee =
    await ensureEmployee(
      businessId,
      employeeId,
    );

  if (
    employee.status ===
    "TERMINATED"
  ) {
    throw conflict(
      "Employee sudah berstatus TERMINATED",
    );
  }

  return prisma.employee.update({
    where: {
      id: employeeId,
    },
    data: {
      status: "TERMINATED",
      terminatedAt: new Date(),
    },
    select: employeeSelect,
  });
};

export const listEmployeeShifts =
  async (
    businessId: string,
    employeeId: string,
    input: EmployeeShiftListInput,
  ) => {
    await ensureEmployee(
      businessId,
      employeeId,
    );

    const skip =
      (input.page - 1) *
      input.limit;

    const where: Prisma.ShiftWhereInput =
      {
        employeeId,
        branch: {
          businessId,
        },
      };

    const [items, total] =
      await prisma.$transaction([
        prisma.shift.findMany({
          where,
          orderBy: {
            startedAt: "desc",
          },
          skip,
          take: input.limit,
          select: {
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
          },
        }),

        prisma.shift.count({
          where,
        }),
      ]);

    return {
      items,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(
          total / input.limit,
        ),
      },
    };
  };