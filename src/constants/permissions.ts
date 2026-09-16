export const PERMISSIONS = {
  // Business
  BUSINESS_READ: "business.read",
  BUSINESS_UPDATE: "business.update",

  // Employees
  EMPLOYEE_READ: "employee.read",
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",

  // Customers
  CUSTOMER_READ: "customer.read",
  CUSTOMER_CREATE: "customer.create",
  CUSTOMER_UPDATE: "customer.update",
  CUSTOMER_DELETE: "customer.delete",

  // Orders
  ORDER_READ: "order.read",
  ORDER_CREATE: "order.create",
  ORDER_UPDATE: "order.update",
  ORDER_CANCEL: "order.cancel",

  // Inventory
  INVENTORY_READ: "inventory.read",
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_UPDATE: "inventory.update",
  INVENTORY_DELETE: "inventory.delete",
  INVENTORY_ADJUST: "inventory.adjust",

  // Shifts
  SHIFT_READ: "shift.read",
  SHIFT_OPEN: "shift.open",
  SHIFT_CLOSE: "shift.close",
  SHIFT_CASH_READ: "shift.cash.read",
  SHIFT_CASH_ADJUST: "shift.cash.adjust",

  // Finance
  FINANCE_READ: "finance.read",
  FINANCE_CREATE: "finance.create",
  FINANCE_UPDATE: "finance.update",

  // Delivery
  DELIVERY_READ: "delivery.read",
  DELIVERY_CREATE: "delivery.create",
  DELIVERY_UPDATE: "delivery.update",

  // Complaints
  COMPLAINT_READ: "complaint.read",
  COMPLAINT_CREATE: "complaint.create",
  COMPLAINT_UPDATE: "complaint.update",
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];