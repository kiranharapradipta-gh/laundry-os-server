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