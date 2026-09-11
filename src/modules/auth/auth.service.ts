import { prisma } from "../../config/database.js";
import {
  comparePassword,
  hashPassword,
} from "../../utils/password.js";
import { signAccessToken } from "../../utils/jwt.js";
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
} from "./auth.types.js";
import { generateRefreshToken, hashRefreshToken } from "../../utils/refresh-token.js";

export const login = async (
  input: LoginInput,
) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        input.username
          ? { username: input.username }
          : undefined,
        input.email
          ? { email: input.email }
          : undefined,
      ].filter(Boolean) as object[],
    },
    include: {
      memberships: {
        where: {
          status: "ACTIVE",
        },
        include: {
          business: true,
          role: true,
        },
        orderBy: {
          joinedAt: "asc",
        },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new Error("Username/email atau password salah");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Akun tidak aktif");
  }

  const passwordValid = await comparePassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    throw new Error("Username/email atau password salah");
  }

  const membership = user.memberships[0];

  if (!membership) {
    throw new Error("User belum memiliki akses ke business");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  // const token = signAccessToken({
  //   userId: user.id,
  //   businessId: membership.businessId,
  //   role: membership.role.code,
  // });

  const accessToken = signAccessToken({
    userId: user.id,
    businessId: membership.businessId,
    role: membership.role.code,
  });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(
    refreshToken,
  );

  const refreshTokenExpiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  );

  await prisma.userSession.create({
    data: {
      userId: user.id,
      businessId: membership.businessId,
      refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    status: user.status,
    businessId: membership.businessId,
    businessName: membership.business.name,
    role: membership.role.code,
  };

  return {
    accessToken,
    refreshToken,
    user: authUser,
  };
};

export const refreshSession = async (
  refreshToken: string,
) => {
  const refreshTokenHash =
    hashRefreshToken(refreshToken);

  const session = await prisma.userSession.findUnique({
    where: {
      refreshTokenHash,
    },
  });

  if (!session) {
    throw new Error("Refresh token tidak valid");
  }

  // Token pernah dicabut = kemungkinan replay/theft
  if (session.revokedAt) {
    throw new Error("Refresh token sudah tidak valid");
  }

  if (session.expiresAt <= new Date()) {
    throw new Error("Refresh token sudah expired");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("Akun tidak aktif");
  }

  const membership =
    await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId: session.businessId,
          userId: session.userId,
        },
      },
      include: {
        role: true,
      },
    });

  if (!membership || membership.status !== "ACTIVE") {
    throw new Error(
      "Business membership tidak aktif",
    );
  }

  const newAccessToken = signAccessToken({
    userId: session.userId,
    businessId: session.businessId,
    role: membership.role.code,
  });

  const newRefreshToken =
    generateRefreshToken();

  const newRefreshTokenHash =
    hashRefreshToken(newRefreshToken);

  const newRefreshTokenExpiresAt =
    new Date(
      Date.now() +
        30 * 24 * 60 * 60 * 1000,
    );

  /*
   * Atomic rotation:
   *
   * 1. Revoke old session
   * 2. Create new session
   */
  await prisma.$transaction([
    prisma.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    }),

    prisma.userSession.create({
      data: {
        userId: session.userId,
        businessId: session.businessId,
        refreshTokenHash:
          newRefreshTokenHash,
        expiresAt:
          newRefreshTokenExpiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      },
    }),
  ]);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const getMe = async (
  userId: string,
  businessId: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      memberships: {
        where: {
          businessId,
          status: "ACTIVE",
        },
        include: {
          business: true,
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  const membership = user.memberships[0];

  if (!membership) {
    throw new Error("Business membership tidak ditemukan");
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    status: user.status,
    businessId: membership.businessId,
    businessName: membership.business.name,
    role: membership.role.code,
    lastLoginAt: user.lastLoginAt,
  };
};

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  const currentPasswordValid = await comparePassword(
    input.currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordValid) {
    throw new Error("Password saat ini salah");
  }

  const passwordHash = await hashPassword(
    input.newPassword,
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
  });

  return {
    message: "Password berhasil diubah",
  };
};

export const logoutSession = async (
  userId: string,
  refreshToken: string,
) => {
  const refreshTokenHash =
    hashRefreshToken(refreshToken);

  const session =
    await prisma.userSession.findFirst({
      where: {
        userId,
        refreshTokenHash,
        revokedAt: null,
      },
    });

  if (!session) {
    return {
      message: "Session sudah tidak aktif",
    };
  }

  await prisma.userSession.update({
    where: {
      id: session.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return {
    message: "Logout berhasil",
  };
};