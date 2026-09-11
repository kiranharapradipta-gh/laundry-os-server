import { prisma } from "../../config/database.js";
import { notFound } from "../../errors/index.js";

import type {
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput,
} from "./customer-address.validation.js";

const ensureCustomerExists = async (
  businessId: string,
  customerId: string,
) => {
  const customer = await prisma.customer.findFirst({
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

const ensureAddressExists = async (
  businessId: string,
  customerId: string,
  addressId: string,
) => {
  await ensureCustomerExists(
    businessId,
    customerId,
  );

  const address =
    await prisma.customerAddress.findFirst({
      where: {
        id: addressId,
        customerId,
      },
    });

  if (!address) {
    throw notFound("Alamat customer tidak ditemukan");
  }

  return address;
};

export const listCustomerAddresses = async (
  businessId: string,
  customerId: string,
) => {
  await ensureCustomerExists(
    businessId,
    customerId,
  );

  return prisma.customerAddress.findMany({
    where: {
      customerId,
    },
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
};

export const getCustomerAddressById = async (
  businessId: string,
  customerId: string,
  addressId: string,
) => {
  return ensureAddressExists(
    businessId,
    customerId,
    addressId,
  );
};

export const createCustomerAddress = async (
  businessId: string,
  customerId: string,
  input: CreateCustomerAddressInput,
) => {
  await ensureCustomerExists(
    businessId,
    customerId,
  );

  const addressCount =
    await prisma.customerAddress.count({
      where: {
        customerId,
      },
    });

  const shouldBeDefault =
    input.isDefault || addressCount === 0;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.customerAddress.updateMany({
        where: {
          customerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return tx.customerAddress.create({
      data: {
        customerId,

        label: input.label,

        recipientName:
          input.recipientName,

        ...(input.phone !== undefined
          ? {
              phone: input.phone,
            }
          : {}),

        address: input.address,

        ...(input.city !== undefined
          ? {
              city: input.city,
            }
          : {}),

        ...(input.province !== undefined
          ? {
              province: input.province,
            }
          : {}),

        ...(input.postalCode !== undefined
          ? {
              postalCode: input.postalCode,
            }
          : {}),

        ...(input.latitude !== undefined
          ? {
              latitude: input.latitude,
            }
          : {}),

        ...(input.longitude !== undefined
          ? {
              longitude: input.longitude,
            }
          : {}),

        ...(input.deliveryNotes !== undefined
          ? {
              deliveryNotes:
                input.deliveryNotes,
            }
          : {}),

        isDefault: shouldBeDefault,
      },
    });
  });
};

export const updateCustomerAddress = async (
  businessId: string,
  customerId: string,
  addressId: string,
  input: UpdateCustomerAddressInput,
) => {
  await ensureAddressExists(
    businessId,
    customerId,
    addressId,
  );

  return prisma.$transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.customerAddress.updateMany({
        where: {
          customerId,
          id: {
            not: addressId,
          },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return tx.customerAddress.update({
      where: {
        id: addressId,
      },

      data: {
        ...(input.label !== undefined
          ? {
              label: input.label,
            }
          : {}),

        ...(input.recipientName !== undefined
          ? {
              recipientName:
                input.recipientName,
            }
          : {}),

        ...(input.phone !== undefined
          ? {
              phone: input.phone,
            }
          : {}),

        ...(input.address !== undefined
          ? {
              address: input.address,
            }
          : {}),

        ...(input.city !== undefined
          ? {
              city: input.city,
            }
          : {}),

        ...(input.province !== undefined
          ? {
              province: input.province,
            }
          : {}),

        ...(input.postalCode !== undefined
          ? {
              postalCode: input.postalCode,
            }
          : {}),

        ...(input.latitude !== undefined
          ? {
              latitude: input.latitude,
            }
          : {}),

        ...(input.longitude !== undefined
          ? {
              longitude: input.longitude,
            }
          : {}),

        ...(input.deliveryNotes !== undefined
          ? {
              deliveryNotes:
                input.deliveryNotes,
            }
          : {}),

        ...(input.isDefault !== undefined
          ? {
              isDefault: input.isDefault,
            }
          : {}),
      },
    });
  });
};

export const deleteCustomerAddress = async (
  businessId: string,
  customerId: string,
  addressId: string,
) => {
  await ensureAddressExists(
    businessId,
    customerId,
    addressId,
  );

  await prisma.customerAddress.delete({
    where: {
      id: addressId,
    },
  });
};