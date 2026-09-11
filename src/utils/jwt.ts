import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: string;
  businessId: string;
  role: string;
}

export const signAccessToken = (
  payload: JwtPayload,
): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "15m",
  });
};

export const verifyAccessToken = (
  token: string,
): JwtPayload => {
  return jwt.verify(
    token,
    env.jwtSecret,
  ) as JwtPayload;
};

// import jwt from "jsonwebtoken";
// import { env } from "../config/env.js";

// export interface JwtPayload {
//   userId: string;
//   businessId: string;
//   role: string;
// }

// export const signAccessToken = (
//   payload: JwtPayload,
// ): string => {
//   return jwt.sign(payload, env.jwtSecret, {
//     expiresIn: env.jwtExpiresIn,
//   });
// };

// export const verifyAccessToken = (
//   token: string,
// ): JwtPayload => {
//   const decoded = jwt.verify(
//     token,
//     env.jwtSecret,
//   ) as JwtPayload;

//   return decoded;
// };