export interface LoginInput {
  username?: string;
  email?: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  status: string;
  businessId: string;
  businessName: string;
  role: string;
}

export interface AuthRequestUser {
  userId: string;
  businessId: string;
  role: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}