import { Prisma } from "@prisma/client";

import { prisma } from "../../config/database.js";

import {
  conflict,
  notFound,
} from "../../utils/app-error.js";

import type {
  CreateCustomerSegmentInput,
  CustomerSegmentListInput,
  UpdateCustomerSegmentInput,
} from "./customer-segment.validation.js";
import { AppError } from "../../errors/app-error.js";
import { evaluateSegmentRules, isValidSegmentRules, type SegmentRules } from "./customer-segment.rules.js";

export const listCustomerSegments = async (
  businessId: string,
  input: CustomerSegmentListInput,
) => {
  const {
    page,
    limit,
    search,
    active,
  } = input;

  const skip = (page - 1) * limit;

  const where: Prisma.CustomerSegmentWhereInput = {
    businessId,

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),

    ...(active !== undefined
      ? {
          active,
        }
      : {}),
  };

  const [items, total] =
    await prisma.$transaction([
      prisma.customerSegment.findMany({
        where,
        orderBy: {
          name: "asc",
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),

      prisma.customerSegment.count({
        where,
      }),
    ]);

  return {
    items: items.map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      color: segment.color,
      isDynamic: segment.isDynamic,
      rules: segment.rules,
      active: segment.active,
      customerCount:
        segment._count.members,
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
    })),

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

export const getCustomerSegmentById =
  async (
    businessId: string,
    segmentId: string,
  ) => {
    const segment =
      await prisma.customerSegment.findFirst({
        where: {
          id: segmentId,
          businessId,
        },

        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

    if (!segment) {
      throw notFound(
        "Customer segment tidak ditemukan",
      );
    }

    return {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      color: segment.color,
      isDynamic: segment.isDynamic,
      rules: segment.rules,
      active: segment.active,
      customerCount:
        segment._count.members,
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
    };
  };

export const createCustomerSegment =
  async (
    businessId: string,
    input: CreateCustomerSegmentInput,
  ) => {
    const existing =
      await prisma.customerSegment.findFirst({
        where: {
          businessId,
          name: input.name,
        },

        select: {
          id: true,
        },
      });

    if (existing) {
      throw conflict(
        "Customer segment dengan nama tersebut sudah ada",
      );
    }

    try {
      return await prisma.customerSegment.create({
        data: {
          businessId,
          name: input.name,

          ...(input.description !== undefined
            ? {
                description:
                  input.description,
              }
            : {}),

          ...(input.color !== undefined
            ? {
                color: input.color,
              }
            : {}),

          isDynamic: input.isDynamic,

          ...(input.rules !== undefined
            ? {
                rules: input.rules as Prisma.InputJsonValue,
              }
            : {}),

          active: input.active,
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflict(
          "Customer segment dengan nama tersebut sudah ada",
        );
      }

      throw error;
    }
  };

export const updateCustomerSegment =
  async (
    businessId: string,
    segmentId: string,
    input: UpdateCustomerSegmentInput,
  ) => {
    const segment =
      await prisma.customerSegment.findFirst({
        where: {
          id: segmentId,
          businessId,
        },

        select: {
          id: true,
        },
      });

    if (!segment) {
      throw notFound(
        "Customer segment tidak ditemukan",
      );
    }

    if (input.name !== undefined) {
      const duplicate =
        await prisma.customerSegment.findFirst({
          where: {
            businessId,
            name: input.name,
            id: {
              not: segmentId,
            },
          },

          select: {
            id: true,
          },
        });

      if (duplicate) {
        throw conflict(
          "Customer segment dengan nama tersebut sudah ada",
        );
      }
    }

    try {
      return await prisma.customerSegment.update({
        where: {
          id: segmentId,
        },

        data: {
          ...(input.name !== undefined
            ? {
                name: input.name,
              }
            : {}),

          ...(input.description !== undefined
            ? {
                description:
                  input.description,
              }
            : {}),

          ...(input.color !== undefined
            ? {
                color: input.color,
              }
            : {}),

          ...(input.isDynamic !== undefined
            ? {
                isDynamic:
                  input.isDynamic,
              }
            : {}),

          ...(input.rules !== undefined
            ? {
                rules: input.rules as Prisma.InputJsonValue,
              }
            : {}),
            
          ...(input.active !== undefined
            ? {
                active: input.active,
              }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflict(
          "Customer segment dengan nama tersebut sudah ada",
        );
      }

      throw error;
    }
  };

export const deleteCustomerSegment =
  async (
    businessId: string,
    segmentId: string,
  ) => {
    const segment =
      await prisma.customerSegment.findFirst({
        where: {
          id: segmentId,
          businessId,
        },

        select: {
          id: true,
        },
      });

    if (!segment) {
      throw notFound(
        "Customer segment tidak ditemukan",
      );
    }

    await prisma.customerSegment.delete({
      where: {
        id: segmentId,
      },
    });
  };

const ensureSegment = async (
  businessId: string,
  segmentId: string,
) => {
  const segment =
    await prisma.customerSegment.findFirst({
      where: {
        id: segmentId,
        businessId,
      },

      select: {
        id: true,
        active: true,
      },
    });

  if (!segment) {
    throw notFound(
      "Customer segment tidak ditemukan",
    );
  }

  return segment;
};

const ensureCustomer = async (
  businessId: string,
  customerId: string,
) => {
  const customer =
    await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
        customerCode: true,
      },
    });

  if (!customer) {
    throw notFound(
      "Customer tidak ditemukan",
    );
  }

  return customer;
};

export const listSegmentCustomers =
  async (
    businessId: string,
    segmentId: string,
  ) => {
    await ensureSegment(
      businessId,
      segmentId,
    );

    const members =
      await prisma.customerSegmentMember.findMany({
        where: {
          segmentId,

          customer: {
            businessId,
            deletedAt: null,
          },
        },

        orderBy: {
          joinedAt: "asc",
        },

        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              name: true,
              phone: true,
              whatsapp: true,
              email: true,
              status: true,
              totalOrders: true,
              totalSpent: true,
              lastOrderAt: true,
            },
          },
        },
      });

    return members.map((member) => ({
      joinedAt: member.joinedAt,
      customer: member.customer,
    }));
  };

export const assignCustomerToSegment =
  async (
    businessId: string,
    segmentId: string,
    customerId: string,
  ) => {
    const segment =
      await ensureSegment(
        businessId,
        segmentId,
      );

    if (!segment.active) {
      throw conflict(
        "Customer segment sedang tidak aktif",
      );
    }

    await ensureCustomer(
      businessId,
      customerId,
    );

    const existing =
      await prisma.customerSegmentMember.findUnique({
        where: {
          segmentId_customerId: {
            segmentId,
            customerId,
          },
        },
      });

    if (existing) {
      throw conflict(
        "Customer sudah berada di segment tersebut",
      );
    }

    try {
      await prisma.customerSegmentMember.create({
        data: {
          segmentId,
          customerId,
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflict(
          "Customer sudah berada di segment tersebut",
        );
      }

      throw error;
    }

    return getCustomerSegmentById(
      businessId,
      segmentId,
    );
  };

export const removeCustomerFromSegment =
  async (
    businessId: string,
    segmentId: string,
    customerId: string,
  ) => {
    await ensureSegment(
      businessId,
      segmentId,
    );

    await ensureCustomer(
      businessId,
      customerId,
    );

    const member =
      await prisma.customerSegmentMember.findUnique({
        where: {
          segmentId_customerId: {
            segmentId,
            customerId,
          },
        },
      });

    if (!member) {
      throw notFound(
        "Customer belum berada di segment tersebut",
      );
    }

    await prisma.customerSegmentMember.delete({
      where: {
        segmentId_customerId: {
          segmentId,
          customerId,
        },
      },
    });
  };

export const refreshCustomerSegment = async (
  businessId: string,
  segmentId: string,
) => {
  const segment = await prisma.customerSegment.findFirst({
    where: {
      id: segmentId,
      businessId,
      active: true,
    },
  });

  if (!segment) {
    throw new AppError(
      "Segment tidak ditemukan atau tidak aktif",
      404,
    );
  }

  if (!segment.isDynamic) {
    throw new AppError(
      "Hanya dynamic segment yang dapat di-refresh",
      400,
    );
  }

  if (!isValidSegmentRules(segment.rules)) {
    throw new AppError(
      "Rules segment tidak valid",
      400,
    );
  }

  const rules =
    segment.rules as SegmentRules;

  const customers =
    await prisma.customer.findMany({
      where: {
        businessId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        totalOrders: true,
        totalSpent: true,
        averageOrderValue: true,
        status: true,
        firstOrderAt: true,
        lastOrderAt: true,
      },
    });

  const matchingCustomerIds = new Set(
    customers
      .filter((customer) =>
        evaluateSegmentRules(
          customer,
          rules,
        ),
      )
      .map((customer) => customer.id),
  );

  const existingMembers =
    await prisma.customerSegmentMember.findMany({
      where: {
        segmentId,
      },
      select: {
        customerId: true,
      },
    });

  const existingCustomerIds = new Set(
    existingMembers.map(
      (member) => member.customerId,
    ),
  );

  const customerIdsToAdd =
    customers
      .filter(
        (customer) =>
          matchingCustomerIds.has(customer.id) &&
          !existingCustomerIds.has(customer.id),
      )
      .map((customer) => customer.id);

  const customerIdsToRemove =
    existingMembers
      .filter(
        (member) =>
          !matchingCustomerIds.has(
            member.customerId,
          ),
      )
      .map((member) => member.customerId);

  await prisma.$transaction(async (tx) => {
    if (customerIdsToAdd.length > 0) {
      await tx.customerSegmentMember.createMany({
        data: customerIdsToAdd.map(
          (customerId) => ({
            segmentId,
            customerId,
          }),
        ),
        skipDuplicates: true,
      });
    }

    if (customerIdsToRemove.length > 0) {
      await tx.customerSegmentMember.deleteMany({
        where: {
          segmentId,
          customerId: {
            in: customerIdsToRemove,
          },
        },
      });
    }
  });

  return {
    segmentId,
    matched: matchingCustomerIds.size,
    added: customerIdsToAdd.length,
    removed: customerIdsToRemove.length,
    unchanged:
      matchingCustomerIds.size -
      customerIdsToAdd.length,
  };
};

export const previewCustomerSegment = async (
  businessId: string,
  segmentId: string,
) => {
  const segment =
    await prisma.customerSegment.findFirst({
      where: {
        id: segmentId,
        businessId,
        active: true,
      },
    });

  if (!segment) {
    throw new AppError(
      "Segment tidak ditemukan atau tidak aktif",
      404,
    );
  }

  if (!segment.isDynamic) {
    throw new AppError(
      "Hanya dynamic segment yang dapat di-preview",
      400,
    );
  }

  if (!isValidSegmentRules(segment.rules)) {
    throw new AppError(
      "Rules segment tidak valid",
      400,
    );
  }

  const rules =
    segment.rules as SegmentRules;

  const customers =
    await prisma.customer.findMany({
      where: {
        businessId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: {
        id: true,
        customerCode: true,
        name: true,
        phone: true,
        totalOrders: true,
        totalSpent: true,
        averageOrderValue: true,
        status: true,
        firstOrderAt: true,
        lastOrderAt: true,
      },
      orderBy: {
        lastOrderAt: "desc",
      },
    });

  const matchedCustomers =
    customers.filter((customer) =>
      evaluateSegmentRules(
        customer,
        rules,
      ),
    );

  return {
    segmentId: segment.id,
    segmentName: segment.name,
    totalCustomers: customers.length,
    matchedCustomers: matchedCustomers.length,
    customers: matchedCustomers,
  };
};

export const syncDynamicSegmentsForCustomer =
  async (
    businessId: string,
    customerId: string,
  ) => {
    const customer =
      await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessId,
          deletedAt: null,
        },
        select: {
          id: true,
          totalOrders: true,
          totalSpent: true,
          averageOrderValue: true,
          status: true,
          firstOrderAt: true,
          lastOrderAt: true,
        },
      });

    if (!customer) {
      return;
    }

    const segments =
      await prisma.customerSegment.findMany({
        where: {
          businessId,
          active: true,
          isDynamic: true,
        },
        select: {
          id: true,
          rules: true,
        },
      });

    for (const segment of segments) {
      if (
        !isValidSegmentRules(
          segment.rules,
        )
      ) {
        continue;
      }

      const matches =
        evaluateSegmentRules(
          customer,
          segment.rules as SegmentRules,
        );

      const existing =
        await prisma.customerSegmentMember.findUnique({
          where: {
            segmentId_customerId: {
              segmentId: segment.id,
              customerId,
            },
          },
        });

      if (matches && !existing) {
        await prisma.customerSegmentMember.create({
          data: {
            segmentId: segment.id,
            customerId,
          },
        });

        continue;
      }

      if (!matches && existing) {
        await prisma.customerSegmentMember.delete({
          where: {
            segmentId_customerId: {
              segmentId: segment.id,
              customerId,
            },
          },
        });
      }
    }
  };