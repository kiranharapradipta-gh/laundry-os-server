// export interface CustomerListInput {
//   page: number;
//   limit: number;
//   search?: string;
// }

// export interface CreateCustomerInput {
//   name: string;
//   phone?: string;
//   whatsapp?: string;
//   email?: string;
//   notes?: string;
// }

// export interface UpdateCustomerInput {
//   name?: string;
//   phone?: string;
//   whatsapp?: string;
//   email?: string;
//   notes?: string;
// }

export type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerListInput,
} from "./customer.validation.js";