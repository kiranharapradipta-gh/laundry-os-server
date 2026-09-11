import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
};

export const env: {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: NonNullable<SignOptions["expiresIn"]>;
  port: number;
} = {
  databaseUrl: requiredEnv("DATABASE_URL"),
  jwtSecret: requiredEnv("JWT_SECRET"),
  jwtExpiresIn: (
    process.env.JWT_EXPIRES_IN ?? "7d"
  ) as NonNullable<SignOptions["expiresIn"]>,
  port: Number(process.env.PORT ?? 3000),
};