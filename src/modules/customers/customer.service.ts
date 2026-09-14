import { randomUUID } from "node:crypto";

import { prisma } from "../../config/database.js";
import { conflict, notFound } from "../../errors/index.js";

import type {
  CreateCustomerInput,
  CustomerListInput,
  UpdateCustomerInput,
} from "./customer.types.js";
import { syncDynamicSegmentsForCustomer } from "../customer-segments/customer-segment.service.js";

const generateCustomerCode = (): string => {
  return `CUS-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`;
};

export const listCustomers = async (
  businessId: string,
  input: CustomerListInput,
) => {
  const { page, limit, search } = input;

  const skip = (page - 1) * limit;

  const where = {
    businessId,
    deletedAt: null,

    ...(search
      ? {
          OR: [
            {
              customerCode: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
              },
            },
            {
              whatsapp: {
                contains: search,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        addresses: {
          where: {
            isDefault: true,
          },
        },
      },
    }),

    prisma.customer.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: customers,

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export const getCustomerById = async (
  businessId: string,
  customerId: string,
) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
      deletedAt: null,
    },

    include: {
      addresses: {
        orderBy: {
          isDefault: "desc",
        },
      },

      tags: true,

      loyaltyAccount: true,
    },
  });

  if (!customer) {
    throw notFound("Customer tidak ditemukan");
  }

  return customer;
};

export const createCustomer = async (
  businessId: string,
  input: CreateCustomerInput,
) => {
  if (input.phone) {
    const existing = await prisma.customer.findFirst({
      where: {
        businessId,
        phone: input.phone,
        deletedAt: null,
      },
    });

    if (existing) {
      throw conflict(
        "Nomor telepon sudah digunakan customer lain",
      );
    }
  }

  if (input.whatsapp) {
    const existing = await prisma.customer.findFirst({
      where: {
        businessId,
        whatsapp: input.whatsapp,
        deletedAt: null,
      },
    });

    if (existing) {
      throw conflict(
        "Nomor WhatsApp sudah digunakan customer lain",
      );
    }
  }

  return prisma.customer.create({
    data: {
      businessId,

      customerCode: generateCustomerCode(),

      name: input.name,

      ...(input.phone !== undefined
        ? {
            phone: input.phone,
          }
        : {}),

      ...(input.whatsapp !== undefined
        ? {
            whatsapp: input.whatsapp,
          }
        : {}),

      ...(input.email !== undefined
        ? {
            email: input.email,
          }
        : {}),

      ...(input.notes !== undefined
        ? {
            notes: input.notes,
          }
        : {}),
    },
  });
};

export const updateCustomer = async (
  businessId: string,
  customerId: string,
  input: UpdateCustomerInput,
) => {
  await getCustomerById(
    businessId,
    customerId,
  );

  if (input.phone !== undefined) {
    const existing = await prisma.customer.findFirst({
      where: {
        businessId,
        phone: input.phone,
        id: {
          not: customerId,
        },
        deletedAt: null,
      },
    });

    if (existing) {
      throw conflict(
        "Nomor telepon sudah digunakan customer lain",
      );
    }
  }

  if (input.whatsapp !== undefined) {
    const existing = await prisma.customer.findFirst({
      where: {
        businessId,
        whatsapp: input.whatsapp,
        id: {
          not: customerId,
        },
        deletedAt: null,
      },
    });

    if (existing) {
      throw conflict(
        "Nomor WhatsApp sudah digunakan customer lain",
      );
    }
  }

  const customer = prisma.customer.update({
    where: {
      id: customerId,
    },

    data: {
      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.phone !== undefined
        ? {
            phone: input.phone,
          }
        : {}),

      ...(input.whatsapp !== undefined
        ? {
            whatsapp: input.whatsapp,
          }
        : {}),

      ...(input.email !== undefined
        ? {
            email: input.email,
          }
        : {}),

      ...(input.notes !== undefined
        ? {
            notes: input.notes,
          }
        : {}),
    },
  });

  await syncDynamicSegmentsForCustomer(
    businessId,
    customerId,
  );

  return customer
};

export const deleteCustomer = async (
  businessId: string,
  customerId: string,
) => {
  await getCustomerById(
    businessId,
    customerId,
  );

  return prisma.customer.update({
    where: {
      id: customerId,
    },

    data: {
      deletedAt: new Date(),
      status: "INACTIVE",
    },
  });
};