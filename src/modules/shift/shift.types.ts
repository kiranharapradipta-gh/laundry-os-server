import type { ShiftStatus } from "@prisma/client";

export interface ShiftListQuery {
  page: number;
  limit: number;
  branchId?: string;
  employeeId?: string;
  status?: ShiftStatus;
}

export interface OpenShiftInput {
  branchId: string;
  employeeId: string;
  openingCash: number | string;
  cashRegisterId: string;
  notes?: string;
  startedAt?: Date;
}

export interface CloseShiftInput {
  closingCash: number | string;
  notes?: string;
  endedAt?: Date;
}

export interface CashMovementInput {
  type:
    | "CASH_IN"
    | "CASH_OUT"
    | "ADJUSTMENT";

  amount: number | string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface ShiftSummary {
  openingCash: string;
  cashIn: string;
  cashOut: string;
  expectedCash: string;
  closingCash: string | null;
  variance: string | null;
}