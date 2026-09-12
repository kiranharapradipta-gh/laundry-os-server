import { Prisma } from "@prisma/client";

import { prisma } from "../../config/database.js";
import {
  conflict,
  notFound,
} from "../../utils/app-error.js";

import type {
  CreateCustomerTagInput,
  CustomerTagListInput,
  UpdateCustomerTagInput,
} from "./customer-tag.validation.js";

/**
 * List customer tags
 */
export const listCustomerTags = async (
  businessId: string,
  input: CustomerTagListInput,
) => {
  const {
    page,
    limit,
    search,
  } = input;

  const skip = (page - 1) * limit;

  const where: Prisma.CustomerTagWhereInput = {
    businessId,

    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const [
    items,
    total,
  ] = await prisma.$transaction([
    prisma.customerTag.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    }),

    prisma.customerTag.count({
      where,
    }),
  ]);

  return {
    items: items.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      customerCount: tag._count.customers,
      createdAt: tag.createdAt,
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get customer tag by ID
 */
export const getCustomerTagById = async (
  businessId: string,
  tagId: string,
) => {
  const tag = await prisma.customerTag.findFirst({
    where: {
      id: tagId,
      businessId,
    },

    include: {
      _count: {
        select: {
          customers: true,
        },
      },
    },
  });

  if (!tag) {
    throw notFound("Customer tag tidak ditemukan");
  }

  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    customerCount: tag._count.customers,
    createdAt: tag.createdAt,
  };
};

/**
 * Create customer tag
 */
export const createCustomerTag = async (
  businessId: string,
  input: CreateCustomerTagInput,
) => {
  const existingTag =
    await prisma.customerTag.findFirst({
      where: {
        businessId,
        name: input.name,
      },
      select: {
        id: true,
      },
    });

  if (existingTag) {
    throw conflict(
      "Customer tag dengan nama tersebut sudah ada",
    );
  }

  try {
    return await prisma.customerTag.create({
      data: {
        businessId,
        name: input.name,
        ...(input.color !== undefined
          ? {
              color: input.color,
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
        "Customer tag dengan nama tersebut sudah ada",
      );
    }

    throw error;
  }
};

/**
 * Update customer tag
 */
export const updateCustomerTag = async (
  businessId: string,
  tagId: string,
  input: UpdateCustomerTagInput,
) => {
  const tag =
    await prisma.customerTag.findFirst({
      where: {
        id: tagId,
        businessId,
      },
      select: {
        id: true,
      },
    });

  if (!tag) {
    throw notFound("Customer tag tidak ditemukan");
  }

  if (input.name !== undefined) {
    const duplicate =
      await prisma.customerTag.findFirst({
        where: {
          businessId,
          name: input.name,
          id: {
            not: tagId,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicate) {
      throw conflict(
        "Customer tag dengan nama tersebut sudah ada",
      );
    }
  }

  try {
    return await prisma.customerTag.update({
      where: {
        id: tagId,
      },

      data: {
        ...(input.name !== undefined
          ? {
              name: input.name,
            }
          : {}),

        ...(input.color !== undefined
          ? {
              color: input.color,
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
        "Customer tag dengan nama tersebut sudah ada",
      );
    }

    throw error;
  }
};

/**
 * Delete customer tag
 *
 * CustomerCustomerTag akan ikut terhapus
 * karena relation menggunakan onDelete: Cascade.
 */
export const deleteCustomerTag = async (
  businessId: string,
  tagId: string,
) => {
  const tag =
    await prisma.customerTag.findFirst({
      where: {
        id: tagId,
        businessId,
      },
      select: {
        id: true,
      },
    });

  if (!tag) {
    throw notFound("Customer tag tidak ditemukan");
  }

  await prisma.customerTag.delete({
    where: {
      id: tagId,
    },
  });
};

/**
 * Ensure customer belongs to business
 * and is not soft-deleted.
 */
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
      },
    });

  if (!customer) {
    throw notFound("Customer tidak ditemukan");
  }

  return customer;
};

/**
 * Ensure tag belongs to business
 */
const ensureTag = async (
  businessId: string,
  tagId: string,
) => {
  const tag =
    await prisma.customerTag.findFirst({
      where: {
        id: tagId,
        businessId,
      },
      select: {
        id: true,
      },
    });

  if (!tag) {
    throw notFound("Customer tag tidak ditemukan");
  }

  return tag;
};

/**
 * Get tags assigned to customer
 */
export const getCustomerTags = async (
  businessId: string,
  customerId: string,
) => {
  await ensureCustomer(
    businessId,
    customerId,
  );

  const assignments =
    await prisma.customerCustomerTag.findMany({
      where: {
        customerId,
        tag: {
          businessId,
        },
      },

      orderBy: {
        tag: {
          name: "asc",
        },
      },

      include: {
        tag: true,
      },
    });

  return assignments.map(
    (assignment) => assignment.tag,
  );
};

/**
 * Assign tag to customer
 */
export const assignCustomerTag = async (
  businessId: string,
  customerId: string,
  tagId: string,
) => {
  await ensureCustomer(
    businessId,
    customerId,
  );

  await ensureTag(
    businessId,
    tagId,
  );

  const existing =
    await prisma.customerCustomerTag.findUnique({
      where: {
        customerId_tagId: {
          customerId,
          tagId,
        },
      },
    });

  if (existing) {
    throw conflict(
      "Tag sudah diberikan kepada customer",
    );
  }

  try {
    await prisma.customerCustomerTag.create({
      data: {
        customerId,
        tagId,
      },
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict(
        "Tag sudah diberikan kepada customer",
      );
    }

    throw error;
  }

  return getCustomerTags(
    businessId,
    customerId,
  );
};

/**
 * Remove tag from customer
 */
export const removeCustomerTag = async (
  businessId: string,
  customerId: string,
  tagId: string,
) => {
  await ensureCustomer(
    businessId,
    customerId,
  );

  await ensureTag(
    businessId,
    tagId,
  );

  const assignment =
    await prisma.customerCustomerTag.findUnique({
      where: {
        customerId_tagId: {
          customerId,
          tagId,
        },
      },
    });

  if (!assignment) {
    throw notFound(
      "Tag belum diberikan kepada customer",
    );
  }

  await prisma.customerCustomerTag.delete({
    where: {
      customerId_tagId: {
        customerId,
        tagId,
      },
    },
  });
};