import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  Prisma,
  UserStatus,
  BusinessStatus,
  MembershipStatus,
  SubscriptionStatus,
  BillingInterval,
  BranchStatus,
  EmployeeStatus,
  ServiceUnit,
  PricingType,
  PaymentMethodType,
  PaymentStatus,
  PaymentType,
  OrderStatus,
  OrderPriority,
  ShiftStatus,
  CashMovementType,
  ProductionStatus,
  ProductionTaskType,
  MachineStatus,
  InventoryTransactionType,
  DeliveryStatus,
  DeliveryType,
  DriverStatus,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintResolutionType,
  ExpenseStatus,
  AccountType,
  JournalEntryStatus,
  NotificationChannel,
  NotificationStatus,
  MessageDirection,
  MessageStatus,
  IntegrationType,
  WebhookStatus,
  ApiKeyStatus,
  AuditAction,
  CustomerStatus,
  CustomerActivityType,
  LoyaltyTransactionType,
  DiscountType,
  TaxType,
  VoucherStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { randomUUID } from "node:crypto";

// const prisma = new PrismaClient();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const money = (value: number) => new Prisma.Decimal(value);

async function main() {
  console.log("🌱 Starting LaundryOS seed...");

  /*
   * --------------------------------------------------------------------------
   * 1. PERMISSIONS
   * --------------------------------------------------------------------------
   */

  const permissionCodes = [
    /*
    * Dashboard
    */
    "dashboard.read",

    /*
    * Orders
    */
    "order.read",
    "order.create",
    "order.update",
    "order.delete",
    "order.cancel",

    /*
    * Customers
    */
    "customer.read",
    "customer.create",
    "customer.update",
    "customer.delete",

    /*
    * Services
    */
    "service.read",
    "service.create",
    "service.update",
    "service.delete",
    "service.manage",

    /*
    * Employees
    */
    "employee.read",
    "employee.create",
    "employee.update",
    "employee.delete",
    "employee.manage",

    /*
    * Inventory
    */
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "inventory.delete",
    "inventory.adjust",
    "inventory.manage",

    /*
    * Shifts
    */
    "shift.read",
    "shift.open",
    "shift.close",
    "shift.cash.read",
    "shift.cash.adjust",

    /*
    * Delivery
    */
    "delivery.read",
    "delivery.create",
    "delivery.update",
    "delivery.delete",
    "delivery.manage",

    /*
    * Complaints
    */
    "complaint.read",
    "complaint.create",
    "complaint.update",
    "complaint.delete",
    "complaint.manage",

    /*
    * Finance
    */
    "finance.read",
    "finance.create",
    "finance.update",
    "finance.delete",
    "finance.manage",

    /*
    * Reports
    */
    "reports.read",
    "reports.create",
    "reports.export",

    /*
    * Settings
    */
    "settings.read",
    "settings.manage",
  ] as const;

  const permissions = new Map<string, string>();

  for (const code of permissionCodes) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code
          .split(".")
          .map(
            (part) =>
              part.charAt(0).toUpperCase() + part.slice(1),
          )
          .join(" "),
      },
    });

    permissions.set(code, permission.id);
  }

  /*
   * --------------------------------------------------------------------------
   * 2. SUBSCRIPTION PLAN
   * --------------------------------------------------------------------------
   */

  const plan = await prisma.subscriptionPlan.upsert({
    where: { slug: "professional" },
    update: {},
    create: {
      name: "Professional",
      slug: "professional",
      description: "LaundryOS professional plan",
      monthlyPrice: money(299000),
      yearlyPrice: money(2990000),
      maxBranches: 5,
      maxEmployees: 50,
      maxCustomers: 10000,
      maxOrdersPerMonth: 100000,
      features: {
        inventory: true,
        delivery: true,
        complaints: true,
        loyalty: true,
        whatsapp: true,
        reports: true,
      },
      active: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 3. BUSINESS
   * --------------------------------------------------------------------------
   */

  const business = await prisma.business.upsert({
    where: {
      slug: "laundry-ran",
    },
    update: {},
    create: {
      name: "Laundry Ran",
      slug: "laundry-ran",
      legalName: "Laundry Ran Indonesia",
      email: "owner@laundryran.test",
      phone: "081234567890",
      whatsapp: "6281234567890",
      address: "Jl. Contoh No. 123",
      city: "Medan",
      province: "Sumatera Utara",
      postalCode: "20151",
      country: "ID",
      timezone: "Asia/Jakarta",
      currency: "IDR",
      status: BusinessStatus.ACTIVE,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 4. BUSINESS SETTINGS
   * --------------------------------------------------------------------------
   */

  await prisma.businessSetting.upsert({
    where: {
      businessId: business.id,
    },
    update: {},
    create: {
      businessId: business.id,
      receiptHeader: "Laundry Ran",
      receiptFooter: "Terima kasih telah menggunakan Laundry Ran.",
      invoicePrefix: "INV",
      orderPrefix: "ORD",
      complaintPrefix: "CMP",
      purchasePrefix: "PO",
      taxEnabled: true,
      defaultTaxRate: money(11),
      defaultDueHours: 48,
      whatsappEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      autoSendOrderConfirmation: true,
      autoSendReadyNotification: true,
      autoSendPaymentReceipt: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 5. ROLES
   * --------------------------------------------------------------------------
   */

  const ownerRole = await prisma.role.upsert({
    where: {
      businessId_code: {
        businessId: business.id,
        code: "OWNER",
      },
    },
    update: {},
    create: {
      businessId: business.id,
      name: "Owner",
      code: "OWNER",
      description: "Business owner",
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: {
      businessId_code: {
        businessId: business.id,
        code: "ADMIN",
      },
    },
    update: {},
    create: {
      businessId: business.id,
      name: "Administrator",
      code: "ADMIN",
      description: "Business administrator",
      isSystem: true,
    },
  });

  const staffRole = await prisma.role.upsert({
    where: {
      businessId_code: {
        businessId: business.id,
        code: "STAFF",
      },
    },
    update: {},
    create: {
      businessId: business.id,
      name: "Staff",
      code: "STAFF",
      description: "Laundry staff",
      isSystem: true,
    },
  });

  const rolePermissions = [
    {
      roleId: ownerRole.id,
      codes: [...permissionCodes],
    },

    {
      roleId: adminRole.id,
      codes: permissionCodes.filter(
        (code) =>
          ![
            "settings.manage",
          ].includes(code),
      ),
    },

    {
      roleId: staffRole.id,
      codes: [
        "dashboard.read",

        "order.read",
        "order.create",
        "order.update",

        "customer.read",
        "customer.create",
        "customer.update",

        "service.read",

        "inventory.read",

        "delivery.read",

        "complaint.read",
        "complaint.create",
        "complaint.update",

        "shift.read",
        "shift.open",
        "shift.close",
        "shift.cash.read",
        "shift.cash.adjust",
      ],
    },
  ];

  for (const item of rolePermissions) {
    for (const code of item.codes) {
      const permissionId = permissions.get(code);

      if (!permissionId) {
        throw new Error(
          `Permission tidak ditemukan: ${code}`,
        );
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: item.roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: item.roleId,
          permissionId,
        },
      });
    }
  }

  /*
   * --------------------------------------------------------------------------
   * 6. USERS
   *
   * passwordHash sementara.
   * Nanti kita ganti ketika auth/password hashing sudah dibuat.
   * --------------------------------------------------------------------------
   */

  const passwordHash = await bcrypt.hash(
    "rahasia",
    12,
  );

  const owner = await prisma.user.upsert({
    where: {
      username: "owner",
    },
    update: {},
    create: {
      username: "owner",
      email: "owner@laundryran.test",
      passwordHash, // : "DEV_PASSWORD_CHANGE_ME",
      name: "Ran Owner",
      phone: "081234567890",
      status: UserStatus.ACTIVE,
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      username: "admin",
      email: "admin@laundryran.test",
      passwordHash, // : "DEV_PASSWORD_CHANGE_ME",
      name: "Laundry Administrator",
      phone: "081234567891",
      status: UserStatus.ACTIVE,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: {
      username: "staff",
    },
    update: {},
    create: {
      username: "staff",
      email: "staff@laundryran.test",
      passwordHash, // : "DEV_PASSWORD_CHANGE_ME",
      name: "Laundry Staff",
      phone: "081234567892",
      status: UserStatus.ACTIVE,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 7. BUSINESS MEMBERS
   * --------------------------------------------------------------------------
   */

  await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: owner.id,
      },
    },
    update: {},
    create: {
      businessId: business.id,
      userId: owner.id,
      roleId: ownerRole.id,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    },
  });

  await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      businessId: business.id,
      userId: admin.id,
      roleId: adminRole.id,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    },
  });

  await prisma.businessMember.upsert({
    where: {
      businessId_userId: {
        businessId: business.id,
        userId: staffUser.id,
      },
    },
    update: {},
    create: {
      businessId: business.id,
      userId: staffUser.id,
      roleId: staffRole.id,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 8. SUBSCRIPTION
   * --------------------------------------------------------------------------
   */

  const subscription = await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      interval: BillingInterval.MONTHLY,
      startedAt: new Date(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ),
    },
  });

  await prisma.billingInvoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNumber: "INV-SUB-0001",
      subtotal: money(299000),
      discount: money(0),
      tax: money(0),
      total: money(299000),
      status: "PAID",
      issuedAt: new Date(),
      paidAt: new Date(),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 9. BRANCHES
   * --------------------------------------------------------------------------
   */

  const branch1 = await prisma.branch.upsert({
    where: {
      businessId_code: {
        businessId: business.id,
        code: "MDN01",
      },
    },
    update: {},
    create: {
      businessId: business.id,
      code: "MDN01",
      name: "Laundry Ran Medan Kota",
      phone: "081234567800",
      address: "Jl. Medan Kota No. 1",
      city: "Medan",
      province: "Sumatera Utara",
      postalCode: "20212",
      latitude: money(3.5897),
      longitude: money(98.6738),
      status: BranchStatus.ACTIVE,
      openingTime: "08:00",
      closingTime: "21:00",
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: {
      businessId_code: {
        businessId: business.id,
        code: "MDN02",
      },
    },
    update: {},
    create: {
      businessId: business.id,
      code: "MDN02",
      name: "Laundry Ran Setia Budi",
      phone: "081234567801",
      address: "Jl. Setia Budi No. 20",
      city: "Medan",
      province: "Sumatera Utara",
      postalCode: "20132",
      latitude: money(3.5615),
      longitude: money(98.6500),
      status: BranchStatus.ACTIVE,
      openingTime: "08:00",
      closingTime: "21:00",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 10. DEPARTMENTS
   * --------------------------------------------------------------------------
   */

  const frontOffice = await prisma.department.create({
    data: {
      businessId: business.id,
      name: "Front Office",
      description: "Customer service and order handling",
    },
  });

  const production = await prisma.department.create({
    data: {
      businessId: business.id,
      name: "Production",
      description: "Washing, drying, ironing and packing",
    },
  });

  const logistics = await prisma.department.create({
    data: {
      businessId: business.id,
      name: "Logistics",
      description: "Delivery and inventory",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 11. EMPLOYEES
   * --------------------------------------------------------------------------
   */

  const ownerEmployee = await prisma.employee.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      departmentId: frontOffice.id,
      userId: owner.id,
      employeeCode: "EMP-0001",
      name: "Ran Owner",
      phone: "081234567890",
      email: "owner@laundryran.test",
      position: "Owner",
      status: EmployeeStatus.ACTIVE,
      hiredAt: new Date("2025-01-01"),
      baseSalary: money(10000000),
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      departmentId: frontOffice.id,
      userId: admin.id,
      employeeCode: "EMP-0002",
      name: "Laundry Administrator",
      phone: "081234567891",
      email: "admin@laundryran.test",
      position: "Administrator",
      status: EmployeeStatus.ACTIVE,
      hiredAt: new Date("2025-02-01"),
      baseSalary: money(6000000),
    },
  });

  const staffEmployee = await prisma.employee.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      departmentId: production.id,
      userId: staffUser.id,
      employeeCode: "EMP-0003",
      name: "Laundry Staff",
      phone: "081234567892",
      email: "staff@laundryran.test",
      position: "Laundry Staff",
      status: EmployeeStatus.ACTIVE,
      hiredAt: new Date("2025-03-01"),
      baseSalary: money(4500000),
    },
  });

  const driverEmployee = await prisma.employee.create({
    data: {
      businessId: business.id,
      branchId: branch2.id,
      departmentId: logistics.id,
      employeeCode: "EMP-0004",
      name: "Budi Driver",
      phone: "081234567893",
      position: "Delivery Driver",
      status: EmployeeStatus.ACTIVE,
      hiredAt: new Date("2025-03-15"),
      baseSalary: money(4000000),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 12. SHIFTS + CASH REGISTER
   * --------------------------------------------------------------------------
   */

  const register = await prisma.cashRegister.create({
    data: {
      branchId: branch1.id,
      code: "REG-01",
      name: "Kasir Utama",
      active: true,
    },
  });

  const shift = await prisma.shift.create({
    data: {
      branchId: branch1.id,
      employeeId: adminEmployee.id,
      startedAt: new Date(),
      openingCash: money(500000),
      status: ShiftStatus.OPEN,
      notes: "Opening shift seed",
    },
  });

  const cashSession = await prisma.cashSession.create({
    data: {
      cashRegisterId: register.id,
      shiftId: shift.id,
      employeeId: adminEmployee.id,
      openedAt: new Date(),
      openingBalance: money(500000),
      status: ShiftStatus.OPEN,
    },
  });

  await prisma.cashMovement.create({
    data: {
      cashSessionId: cashSession.id,
      employeeId: adminEmployee.id,
      type: CashMovementType.OPENING_BALANCE,
      amount: money(500000),
      description: "Opening cash",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 13. CUSTOMER TAGS + SEGMENTS
   * --------------------------------------------------------------------------
   */

  const vipTag = await prisma.customerTag.create({
    data: {
      businessId: business.id,
      name: "VIP",
      color: "#7c3aed",
    },
  });

  const regularTag = await prisma.customerTag.create({
    data: {
      businessId: business.id,
      name: "Regular",
      color: "#2563eb",
    },
  });

  const vipSegment = await prisma.customerSegment.create({
    data: {
      businessId: business.id,
      name: "VIP Customer",
      description: "High value customers",
      color: "#7c3aed",
      isDynamic: false,
      rules: {
        minSpent: 1000000,
      },
    },
  });

  const regularSegment = await prisma.customerSegment.create({
    data: {
      businessId: business.id,
      name: "Regular Customer",
      description: "Regular laundry customers",
      color: "#2563eb",
      isDynamic: false,
      rules: {
        minOrders: 3,
      },
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 14. CUSTOMERS
   * --------------------------------------------------------------------------
   */

  const customer1 = await prisma.customer.create({
    data: {
      businessId: business.id,
      customerCode: "CUS-0001",
      name: "Andi Pratama",
      phone: "081300000001",
      whatsapp: "6281300000001",
      email: "andi@example.test",
      status: CustomerStatus.ACTIVE,
      notes: "Customer VIP",
      totalOrders: 12,
      totalSpent: money(1750000),
      averageOrderValue: money(145833),
      firstOrderAt: new Date("2026-01-10"),
      lastOrderAt: new Date(),
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      businessId: business.id,
      customerCode: "CUS-0002",
      name: "Siti Rahma",
      phone: "081300000002",
      whatsapp: "6281300000002",
      email: "siti@example.test",
      status: CustomerStatus.ACTIVE,
      totalOrders: 6,
      totalSpent: money(720000),
      averageOrderValue: money(120000),
      firstOrderAt: new Date("2026-02-01"),
      lastOrderAt: new Date(),
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      businessId: business.id,
      customerCode: "CUS-0003",
      name: "Dimas Saputra",
      phone: "081300000003",
      whatsapp: "6281300000003",
      email: "dimas@example.test",
      status: CustomerStatus.ACTIVE,
      totalOrders: 3,
      totalSpent: money(360000),
      averageOrderValue: money(120000),
      firstOrderAt: new Date("2026-05-01"),
      lastOrderAt: new Date(),
    },
  });

  await prisma.customerCustomerTag.createMany({
    data: [
      {
        customerId: customer1.id,
        tagId: vipTag.id,
      },
      {
        customerId: customer2.id,
        tagId: regularTag.id,
      },
      {
        customerId: customer3.id,
        tagId: regularTag.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.customerSegmentMember.createMany({
    data: [
      {
        customerId: customer1.id,
        segmentId: vipSegment.id,
      },
      {
        customerId: customer2.id,
        segmentId: regularSegment.id,
      },
      {
        customerId: customer3.id,
        segmentId: regularSegment.id,
      },
    ],
    skipDuplicates: true,
  });

  /*
   * --------------------------------------------------------------------------
   * 15. CUSTOMER ADDRESSES
   * --------------------------------------------------------------------------
   */

  const address1 = await prisma.customerAddress.create({
    data: {
      customerId: customer1.id,
      label: "Rumah",
      recipientName: "Andi Pratama",
      phone: customer1.phone,
      address: "Jl. Setia Budi No. 10",
      city: "Medan",
      province: "Sumatera Utara",
      postalCode: "20132",
      latitude: money(3.561),
      longitude: money(98.650),
      deliveryNotes: "Rumah pagar hitam",
      isDefault: true,
    },
  });

  const address2 = await prisma.customerAddress.create({
    data: {
      customerId: customer2.id,
      label: "Rumah",
      recipientName: "Siti Rahma",
      phone: customer2.phone,
      address: "Jl. Medan Baru No. 15",
      city: "Medan",
      province: "Sumatera Utara",
      postalCode: "20154",
      isDefault: true,
    },
  });

  await prisma.customerAddress.create({
    data: {
      customerId: customer3.id,
      label: "Kantor",
      recipientName: "Dimas Saputra",
      phone: customer3.phone,
      address: "Jl. Gatot Subroto No. 20",
      city: "Medan",
      province: "Sumatera Utara",
      postalCode: "20118",
      isDefault: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 16. CUSTOMER NOTES / ACTIVITY / LOYALTY
   * --------------------------------------------------------------------------
   */

  await prisma.customerNote.create({
    data: {
      customerId: customer1.id,
      employeeId: adminEmployee.id,
      content: "Customer sering menggunakan layanan express.",
      internal: true,
    },
  });

  await prisma.customerActivity.create({
    data: {
      customerId: customer1.id,
      type: CustomerActivityType.CREATED,
      title: "Customer registered",
      description: "Customer dibuat melalui seed.",
    },
  });

  await prisma.customerActivity.create({
    data: {
      customerId: customer1.id,
      type: CustomerActivityType.ORDER_CREATED,
      title: "Order created",
      description: "Customer memiliki order aktif.",
    },
  });

  await prisma.loyaltyAccount.create({
    data: {
      customerId: customer1.id,
      points: 850,
      lifetimeEarned: 1200,
      lifetimeRedeemed: 350,
    },
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customer1.id,
      type: LoyaltyTransactionType.EARN,
      points: 850,
      balanceAfter: 850,
      description: "Initial loyalty points",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 17. SERVICE CATALOG
   * --------------------------------------------------------------------------
   */

  const washCategory = await prisma.serviceCategory.create({
    data: {
      businessId: business.id,
      name: "Laundry Kiloan",
      description: "Laundry berdasarkan berat",
      sortOrder: 1,
    },
  });

  const dryCategory = await prisma.serviceCategory.create({
    data: {
      businessId: business.id,
      name: "Dry Cleaning",
      description: "Perawatan pakaian khusus",
      sortOrder: 2,
    },
  });

  const shoeCategory = await prisma.serviceCategory.create({
    data: {
      businessId: business.id,
      name: "Shoes",
      description: "Laundry sepatu",
      sortOrder: 3,
    },
  });

  const regularWash = await prisma.service.create({
    data: {
      businessId: business.id,
      categoryId: washCategory.id,
      code: "WASH-REG",
      name: "Cuci Kering Lipat",
      description: "Layanan laundry reguler",
      unit: ServiceUnit.KG,
      pricingType: PricingType.PER_UNIT,
      basePrice: money(7000),
      minimumQuantity: money(3),
      durationHours: 48,
      express: false,
    },
  });

  const expressWash = await prisma.service.create({
    data: {
      businessId: business.id,
      categoryId: washCategory.id,
      code: "WASH-EXP",
      name: "Cuci Express",
      description: "Laundry express",
      unit: ServiceUnit.KG,
      pricingType: PricingType.PER_UNIT,
      basePrice: money(12000),
      minimumQuantity: money(3),
      durationHours: 12,
      express: true,
    },
  });

  const dryClean = await prisma.service.create({
    data: {
      businessId: business.id,
      categoryId: dryCategory.id,
      code: "DRY-CLEAN",
      name: "Dry Cleaning",
      description: "Dry cleaning pakaian",
      unit: ServiceUnit.PCS,
      pricingType: PricingType.PER_UNIT,
      basePrice: money(35000),
      minimumQuantity: money(1),
      durationHours: 72,
      express: false,
    },
  });

  const shoeWash = await prisma.service.create({
    data: {
      businessId: business.id,
      categoryId: shoeCategory.id,
      code: "SHOE-WASH",
      name: "Cuci Sepatu",
      description: "Deep cleaning sepatu",
      unit: ServiceUnit.PCS,
      pricingType: PricingType.FIXED,
      basePrice: money(50000),
      minimumQuantity: money(1),
      durationHours: 48,
      express: false,
    },
  });

  for (const branch of [branch1, branch2]) {
    for (const service of [
      regularWash,
      expressWash,
      dryClean,
      shoeWash,
    ]) {
      await prisma.servicePrice.create({
        data: {
          businessId: business.id,
          serviceId: service.id,
          branchId: branch.id,
          price: service.basePrice,
          active: true,
        },
      });
    }
  }

  const softener = await prisma.addOn.create({
    data: {
      businessId: business.id,
      code: "ADD-SOFTENER",
      name: "Premium Softener",
      description: "Premium fragrance",
      price: money(5000),
      active: true,
    },
  });

  await prisma.addOn.create({
    data: {
      businessId: business.id,
      code: "ADD-PACK",
      name: "Premium Packaging",
      description: "Premium laundry packaging",
      price: money(3000),
      active: true,
    },
  });

  const tax = await prisma.tax.create({
    data: {
      businessId: business.id,
      name: "PPN",
      rate: money(11),
      type: TaxType.PERCENTAGE,
      active: true,
    },
  });

  const discount = await prisma.discount.create({
    data: {
      businessId: business.id,
      name: "Member Discount",
      type: DiscountType.PERCENTAGE,
      value: money(10),
      minimumOrder: money(100000),
      maximumDiscount: money(30000),
      active: true,
    },
  });

  const voucher = await prisma.voucher.create({
    data: {
      businessId: business.id,
      code: "WELCOME20",
      name: "Welcome 20%",
      description: "Voucher customer baru",
      status: VoucherStatus.ACTIVE,
      discountType: DiscountType.PERCENTAGE,
      discountValue: money(20),
      minimumOrder: money(50000),
      maximumDiscount: money(25000),
      usageLimit: 100,
      usagePerCustomer: 1,
      startsAt: new Date("2026-01-01"),
      expiresAt: new Date("2027-01-01"),
      active: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 18. PAYMENT METHODS
   * --------------------------------------------------------------------------
   */

  const cash = await prisma.paymentMethod.create({
    data: {
      businessId: business.id,
      name: "Cash",
      type: PaymentMethodType.CASH,
    },
  });

  const qris = await prisma.paymentMethod.create({
    data: {
      businessId: business.id,
      name: "QRIS",
      type: PaymentMethodType.QRIS,
    },
  });

  const transfer = await prisma.paymentMethod.create({
    data: {
      businessId: business.id,
      name: "Bank Transfer",
      type: PaymentMethodType.BANK_TRANSFER,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 19. STORAGE
   * --------------------------------------------------------------------------
   */

  const lockerA1 = await prisma.storageLocation.create({
    data: {
      branchId: branch1.id,
      code: "A-01-01",
      zone: "A",
      rack: "01",
      shelf: "01",
      slot: "01",
      qrCode: "LAUNDRY-RAN-A010101",
      capacity: 20,
      active: true,
    },
  });

  const lockerA2 = await prisma.storageLocation.create({
    data: {
      branchId: branch1.id,
      code: "A-01-02",
      zone: "A",
      rack: "01",
      shelf: "01",
      slot: "02",
      qrCode: "LAUNDRY-RAN-A010102",
      capacity: 20,
      active: true,
    },
  });

  const lockerB1 = await prisma.storageLocation.create({
    data: {
      branchId: branch2.id,
      code: "B-01-01",
      zone: "B",
      rack: "01",
      shelf: "01",
      slot: "01",
      qrCode: "LAUNDRY-RAN-B010101",
      capacity: 20,
      active: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 20. INVENTORY
   * --------------------------------------------------------------------------
   */

  const detergent = await prisma.inventoryItem.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      sku: "INV-DETERGENT-001",
      name: "Detergent Liquid",
      description: "Liquid detergent",
      unit: "LITER",
      currentStock: money(48),
      minimumStock: money(10),
      maximumStock: money(100),
      costPrice: money(25000),
    },
  });

  const softenerInventory = await prisma.inventoryItem.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      sku: "INV-SOFTENER-001",
      name: "Softener Premium",
      description: "Premium softener",
      unit: "LITER",
      currentStock: money(30),
      minimumStock: money(8),
      maximumStock: money(80),
      costPrice: money(30000),
    },
  });

  const plastic = await prisma.inventoryItem.create({
    data: {
      businessId: business.id,
      branchId: branch2.id,
      sku: "INV-PACK-001",
      name: "Laundry Plastic",
      description: "Laundry packaging",
      unit: "PCS",
      currentStock: money(850),
      minimumStock: money(200),
      maximumStock: money(2000),
      costPrice: money(700),
    },
  });

  await prisma.inventoryTransaction.createMany({
    data: [
      {
        inventoryItemId: detergent.id,
        type: InventoryTransactionType.INITIAL_STOCK,
        quantity: money(50),
        beforeStock: money(0),
        afterStock: money(50),
        unitCost: money(25000),
        notes: "Initial stock",
      },
      {
        inventoryItemId: softenerInventory.id,
        type: InventoryTransactionType.INITIAL_STOCK,
        quantity: money(30),
        beforeStock: money(0),
        afterStock: money(30),
        unitCost: money(30000),
        notes: "Initial stock",
      },
      {
        inventoryItemId: plastic.id,
        type: InventoryTransactionType.INITIAL_STOCK,
        quantity: money(850),
        beforeStock: money(0),
        afterStock: money(850),
        unitCost: money(700),
        notes: "Initial stock",
      },
    ],
  });

  /*
   * --------------------------------------------------------------------------
   * 21. SUPPLIER + PURCHASE ORDER
   * --------------------------------------------------------------------------
   */

  const supplier = await prisma.supplier.create({
    data: {
      businessId: business.id,
      code: "SUP-001",
      name: "PT Laundry Supply Indonesia",
      phone: "0215550001",
      email: "sales@supply.test",
      address: "Jakarta",
      city: "Jakarta",
      province: "DKI Jakarta",
      active: true,
    },
  });

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      businessId: business.id,
      supplierId: supplier.id,
      branchId: branch1.id,
      orderNumber: "PO-0001",
      status: "RECEIVED",
      subtotal: money(500000),
      tax: money(55000),
      total: money(555000),
      orderedAt: new Date(Date.now() - 5 * 86400000),
      receivedAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  await prisma.purchaseOrderItem.create({
    data: {
      purchaseOrderId: purchaseOrder.id,
      inventoryItemId: detergent.id,
      itemNameSnapshot: detergent.name,
      quantity: money(20),
      unitCost: money(25000),
      subtotal: money(500000),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 22. MACHINES
   * --------------------------------------------------------------------------
   */

  const washingMachine = await prisma.machine.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      code: "WM-001",
      name: "Washing Machine 20KG",
      type: "WASHING_MACHINE",
      status: MachineStatus.AVAILABLE,
      purchaseDate: new Date("2025-01-15"),
      warrantyEnds: new Date("2027-01-15"),
      nextMaintenanceAt: new Date(
        Date.now() + 30 * 86400000,
      ),
    },
  });

  const dryer = await prisma.machine.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      code: "DR-001",
      name: "Industrial Dryer",
      type: "DRYER",
      status: MachineStatus.AVAILABLE,
      purchaseDate: new Date("2025-02-10"),
      warrantyEnds: new Date("2027-02-10"),
      nextMaintenanceAt: new Date(
        Date.now() + 45 * 86400000,
      ),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 23. DELIVERY
   * --------------------------------------------------------------------------
   */

  const deliveryArea = await prisma.deliveryArea.create({
    data: {
      businessId: business.id,
      name: "Medan Kota",
      fee: money(10000),
      minimumOrder: money(50000),
      active: true,
    },
  });

  const externalDriver = await prisma.deliveryDriver.create({
    data: {
      businessId: business.id,
      name: "Budi Express",
      phone: "081299999999",
      vehicleType: "Motor",
      vehicleNumber: "BK 1234 XYZ",
      status: DriverStatus.AVAILABLE,
      active: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 24. ORDERS
   * --------------------------------------------------------------------------
   */

  const order1 = await prisma.order.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      customerId: customer1.id,
      createdById: adminEmployee.id,
      handledById: staffEmployee.id,
      discountId: discount.id,
      orderNumber: "ORD-2026-0001",
      status: OrderStatus.READY,
      priority: OrderPriority.HIGH,
      paymentStatus: PaymentStatus.PAID,
      customerNameSnapshot: customer1.name,
      customerPhoneSnapshot: customer1.phone,
      subtotal: money(140000),
      discount: money(10000),
      tax: money(14300),
      deliveryFee: money(10000),
      total: money(154300),
      paidAmount: money(154300),
      dueAmount: money(0),
      notes: "Customer VIP",
      receivedAt: new Date(Date.now() - 2 * 86400000),
      processingAt: new Date(Date.now() - 1 * 86400000),
      readyAt: new Date(),
      dueAt: new Date(Date.now() + 86400000),
      pickupCode: "482931",
    },
  });

  const order2 = await prisma.order.create({
    data: {
      businessId: business.id,
      branchId: branch2.id,
      customerId: customer2.id,
      createdById: adminEmployee.id,
      handledById: staffEmployee.id,
      orderNumber: "ORD-2026-0002",
      status: OrderStatus.PROCESSING,
      priority: OrderPriority.NORMAL,
      paymentStatus: PaymentStatus.PARTIAL,
      customerNameSnapshot: customer2.name,
      customerPhoneSnapshot: customer2.phone,
      subtotal: money(84000),
      discount: money(0),
      tax: money(9240),
      deliveryFee: money(0),
      total: money(93240),
      paidAmount: money(50000),
      dueAmount: money(43240),
      notes: "Regular customer",
      receivedAt: new Date(),
      processingAt: new Date(),
      dueAt: new Date(Date.now() + 2 * 86400000),
      pickupCode: "593812",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 25. ORDER ITEMS
   * --------------------------------------------------------------------------
   */

  const orderItem1 = await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      serviceId: regularWash.id,
      serviceNameSnapshot: regularWash.name,
      serviceUnitSnapshot: regularWash.unit,
      description: "Pakaian harian",
      quantity: money(10),
      unitPrice: money(7000),
      discount: money(0),
      subtotal: money(70000),
      weight: money(10),
      itemCount: 12,
    },
  });

  const orderItem2 = await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      serviceId: dryClean.id,
      serviceNameSnapshot: dryClean.name,
      serviceUnitSnapshot: dryClean.unit,
      description: "Jas formal",
      quantity: money(2),
      unitPrice: money(35000),
      discount: money(0),
      subtotal: money(70000),
      itemCount: 2,
    },
  });

  await prisma.orderItemAddOn.create({
    data: {
      orderItemId: orderItem1.id,
      addOnId: softener.id,
      addOnNameSnapshot: softener.name,
      quantity: money(1),
      price: money(5000),
      subtotal: money(5000),
    },
  });

  const order2Item = await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      serviceId: expressWash.id,
      serviceNameSnapshot: expressWash.name,
      serviceUnitSnapshot: expressWash.unit,
      description: "Pakaian kerja",
      quantity: money(7),
      unitPrice: money(12000),
      discount: money(0),
      subtotal: money(84000),
      weight: money(7),
      itemCount: 8,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 26. ORDER TAX
   * --------------------------------------------------------------------------
   */

  await prisma.orderTax.create({
    data: {
      orderId: order1.id,
      taxId: tax.id,
      taxNameSnapshot: tax.name,
      rate: money(11),
      amount: money(14300),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 27. ORDER TAGS
   * --------------------------------------------------------------------------
   */

  const urgentTag = await prisma.orderTag.create({
    data: {
      businessId: business.id,
      name: "VIP",
      color: "#7c3aed",
    },
  });

  await prisma.orderOrderTag.create({
    data: {
      orderId: order1.id,
      tagId: urgentTag.id,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 28. ORDER STATUS HISTORY
   * --------------------------------------------------------------------------
   */

  const history = [
    [null, OrderStatus.RECEIVED],
    [OrderStatus.RECEIVED, OrderStatus.CONFIRMED],
    [OrderStatus.CONFIRMED, OrderStatus.PROCESSING],
    [OrderStatus.PROCESSING, OrderStatus.WASHING],
    [OrderStatus.WASHING, OrderStatus.DRYING],
    [OrderStatus.DRYING, OrderStatus.IRONING],
    [OrderStatus.IRONING, OrderStatus.FOLDING],
    [OrderStatus.FOLDING, OrderStatus.PACKING],
    [OrderStatus.PACKING, OrderStatus.READY],
  ] as const;

  for (const [fromStatus, toStatus] of history) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order1.id,
        employeeId: staffEmployee.id,
        fromStatus,
        toStatus,
        notes: `Status changed to ${toStatus}`,
      },
    });
  }

  await prisma.orderNote.create({
    data: {
      orderId: order1.id,
      employeeId: staffEmployee.id,
      content: "Laundry selesai dan sudah masuk storage.",
      internal: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 29. STORAGE ASSIGNMENT
   * --------------------------------------------------------------------------
   */

  await prisma.orderStorage.create({
    data: {
      orderId: order1.id,
      storageLocationId: lockerA1.id,
      notes: "Ready for pickup",
    },
  });

  await prisma.orderStorage.create({
    data: {
      orderId: order2.id,
      storageLocationId: lockerB1.id,
      notes: "Currently processing",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 30. PAYMENTS
   * --------------------------------------------------------------------------
   */

  await prisma.payment.create({
    data: {
      businessId: business.id,
      orderId: order1.id,
      paymentMethodId: qris.id,
      amount: money(154300),
      type: PaymentType.PAYMENT,
      status: PaymentStatus.PAID,
      referenceNumber: "QRIS-20260911-0001",
      receivedById: adminEmployee.id,
      paidAt: new Date(),
      notes: "Paid via QRIS",
    },
  });

  await prisma.payment.create({
    data: {
      businessId: business.id,
      orderId: order2.id,
      paymentMethodId: cash.id,
      amount: money(50000),
      type: PaymentType.DEPOSIT,
      status: PaymentStatus.PAID,
      referenceNumber: "CASH-20260911-0001",
      receivedById: adminEmployee.id,
      paidAt: new Date(),
      notes: "Deposit",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 31. RECEIPT + INVOICE
   * --------------------------------------------------------------------------
   */

  await prisma.receipt.create({
    data: {
      orderId: order1.id,
      receiptNumber: "RCT-2026-0001",
      printedAt: new Date(),
      printedCount: 1,
    },
  });

  await prisma.salesInvoice.create({
    data: {
      orderId: order1.id,
      invoiceNumber: "INV-2026-0001",
      issuedAt: new Date(),
      subtotal: money(140000),
      tax: money(14300),
      total: money(154300),
      status: PaymentStatus.PAID,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 32. PRODUCTION
   * --------------------------------------------------------------------------
   */

  const batch = await prisma.productionBatch.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      orderId: order1.id,
      batchNumber: "BATCH-2026-0001",
      status: ProductionStatus.COMPLETED,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(),
      notes: "Completed successfully",
    },
  });

  await prisma.productionTask.createMany({
    data: [
      {
        productionBatchId: batch.id,
        serviceId: regularWash.id,
        employeeId: staffEmployee.id,
        machineId: washingMachine.id,
        type: ProductionTaskType.WASHING,
        status: ProductionStatus.COMPLETED,
        startedAt: new Date(Date.now() - 86400000),
        completedAt: new Date(Date.now() - 20 * 3600000),
      },
      {
        productionBatchId: batch.id,
        serviceId: regularWash.id,
        employeeId: staffEmployee.id,
        machineId: dryer.id,
        type: ProductionTaskType.DRYING,
        status: ProductionStatus.COMPLETED,
        startedAt: new Date(Date.now() - 20 * 3600000),
        completedAt: new Date(Date.now() - 18 * 3600000),
      },
      {
        productionBatchId: batch.id,
        serviceId: regularWash.id,
        employeeId: staffEmployee.id,
        type: ProductionTaskType.IRONING,
        status: ProductionStatus.COMPLETED,
        startedAt: new Date(Date.now() - 18 * 3600000),
        completedAt: new Date(Date.now() - 16 * 3600000),
      },
      {
        productionBatchId: batch.id,
        serviceId: regularWash.id,
        employeeId: staffEmployee.id,
        type: ProductionTaskType.PACKING,
        status: ProductionStatus.COMPLETED,
        startedAt: new Date(Date.now() - 16 * 3600000),
        completedAt: new Date(Date.now() - 15 * 3600000),
      },
    ],
  });

  await prisma.machineUsage.create({
    data: {
      machineId: washingMachine.id,
      employeeId: staffEmployee.id,
      startedAt: new Date(Date.now() - 86400000),
      endedAt: new Date(Date.now() - 20 * 3600000),
      status: "COMPLETED",
      notes: "Normal operation",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 33. DELIVERY
   * --------------------------------------------------------------------------
   */

  const route = await prisma.deliveryRoute.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      routeNumber: "ROUTE-2026-0001",
      date: new Date(),
      status: "PLANNED",
      notes: "Medan Kota route",
    },
  });

  const delivery = await prisma.deliveryOrder.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      orderId: order1.id,
      customerAddressId: address1.id,
      areaId: deliveryArea.id,
      employeeDriverId: driverEmployee.id,
      externalDriverId: externalDriver.id,
      routeId: route.id,
      type: DeliveryType.DELIVERY,
      status: DeliveryStatus.ASSIGNED,
      deliveryFee: money(10000),
      scheduledAt: new Date(Date.now() + 2 * 3600000),
      assignedAt: new Date(),
      recipientName: customer1.name,
      recipientPhone: customer1.phone,
      notes: "Call customer before arrival",
    },
  });

  await prisma.deliveryStatusHistory.createMany({
    data: [
      {
        deliveryOrderId: delivery.id,
        status: DeliveryStatus.PENDING,
        notes: "Delivery created",
      },
      {
        deliveryOrderId: delivery.id,
        status: DeliveryStatus.ASSIGNED,
        notes: "Driver assigned",
      },
    ],
  });

  /*
   * --------------------------------------------------------------------------
   * 34. COMPLAINT
   * --------------------------------------------------------------------------
   */

  const complaint = await prisma.complaint.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      orderId: order1.id,
      assignedToId: adminEmployee.id,
      ticketNumber: "CMP-2026-0001",
      subject: "Kemasan kurang rapi",
      description:
        "Customer melaporkan kemasan laundry kurang rapi.",
      priority: ComplaintPriority.MEDIUM,
      status: ComplaintStatus.RESOLVED,
      resolutionType: ComplaintResolutionType.APOLOGY,
      resolution: "Customer diberikan permintaan maaf dan voucher.",
      compensationAmount: money(0),
      resolvedAt: new Date(),
    },
  });

  await prisma.complaintMessage.create({
    data: {
      complaintId: complaint.id,
      senderType: "CUSTOMER",
      senderId: customer1.id,
      message: "Kemasan laundry saya kurang rapi.",
    },
  });

  await prisma.complaintMessage.create({
    data: {
      complaintId: complaint.id,
      senderType: "EMPLOYEE",
      senderId: adminEmployee.id,
      message:
        "Mohon maaf. Kami akan memperbaiki proses packing.",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 35. EXPENSE
   * --------------------------------------------------------------------------
   */

  const expenseCategory = await prisma.expenseCategory.create({
    data: {
      businessId: business.id,
      name: "Operasional",
      description: "Biaya operasional laundry",
    },
  });

  await prisma.expense.create({
    data: {
      businessId: business.id,
      branchId: branch1.id,
      categoryId: expenseCategory.id,
      createdById: adminEmployee.id,
      expenseNumber: "EXP-2026-0001",
      description: "Pembelian perlengkapan operasional",
      amount: money(175000),
      status: ExpenseStatus.PAID,
      expenseDate: new Date(),
      paymentMethod: "CASH",
      referenceNumber: "EXP-REF-001",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 36. ACCOUNTING
   * --------------------------------------------------------------------------
   */

  const cashAccount = await prisma.account.create({
    data: {
      businessId: business.id,
      code: "1100",
      name: "Cash",
      type: AccountType.ASSET,
      description: "Kas",
    },
  });

  const bankAccount = await prisma.account.create({
    data: {
      businessId: business.id,
      code: "1200",
      name: "Bank",
      type: AccountType.ASSET,
      description: "Bank",
    },
  });

  const revenueAccount = await prisma.account.create({
    data: {
      businessId: business.id,
      code: "4000",
      name: "Laundry Revenue",
      type: AccountType.REVENUE,
      description: "Pendapatan laundry",
    },
  });

  const journal = await prisma.journalEntry.create({
    data: {
      businessId: business.id,
      entryNumber: "JE-2026-0001",
      description: "Laundry payment",
      status: JournalEntryStatus.POSTED,
      entryDate: new Date(),
      referenceType: "ORDER",
      referenceId: order1.id,
    },
  });

  await prisma.journalLine.createMany({
    data: [
      {
        journalEntryId: journal.id,
        accountId: cashAccount.id,
        debit: money(154300),
        credit: money(0),
        description: "Payment received",
      },
      {
        journalEntryId: journal.id,
        accountId: revenueAccount.id,
        debit: money(0),
        credit: money(154300),
        description: "Laundry revenue",
      },
    ],
  });

  /*
   * --------------------------------------------------------------------------
   * 37. NOTIFICATIONS
   * --------------------------------------------------------------------------
   */

  await prisma.notificationTemplate.create({
    data: {
      businessId: business.id,
      name: "Order Ready WhatsApp",
      event: "ORDER_READY",
      channel: NotificationChannel.WHATSAPP,
      body:
        "Halo {{customerName}}, order {{orderNumber}} sudah siap diambil.",
      variables: {
        customerName: "Customer name",
        orderNumber: "Order number",
      },
    },
  });

  await prisma.notification.create({
    data: {
      businessId: business.id,
      userId: owner.id,
      channel: NotificationChannel.IN_APP,
      title: "Order siap diambil",
      message: `${order1.orderNumber} milik ${customer1.name} sudah READY.`,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 38. WHATSAPP / EMAIL / SMS
   * --------------------------------------------------------------------------
   */

  await prisma.whatsAppMessage.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      orderId: order1.id,
      direction: MessageDirection.OUTBOUND,
      status: MessageStatus.DELIVERED,
      phoneNumber: customer1.whatsapp!,
      messageType: "text",
      message: `Order ${order1.orderNumber} sudah siap diambil.`,
      sentAt: new Date(),
      deliveredAt: new Date(),
    },
  });

  await prisma.emailMessage.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      orderId: order1.id,
      direction: MessageDirection.OUTBOUND,
      status: MessageStatus.DELIVERED,
      email: customer1.email!,
      subject: `Order ${order1.orderNumber} siap diambil`,
      body: `Laundry Anda sudah selesai dan siap diambil.`,
      sentAt: new Date(),
      deliveredAt: new Date(),
    },
  });

  await prisma.sMSMessage.create({
    data: {
      businessId: business.id,
      customerId: customer2.id,
      orderId: order2.id,
      direction: MessageDirection.OUTBOUND,
      status: MessageStatus.SENT,
      phoneNumber: customer2.phone!,
      message: `Order ${order2.orderNumber} sedang diproses.`,
      sentAt: new Date(),
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 39. INTEGRATION
   * --------------------------------------------------------------------------
   */

  await prisma.integration.create({
    data: {
      businessId: business.id,
      type: IntegrationType.WHATSAPP,
      name: "WhatsApp Gateway",
      provider: "WhatsApp Gateway",
      credentials: {
        configured: false,
      },
      settings: {
        enabled: true,
      },
      active: true,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 40. WEBHOOK
   * --------------------------------------------------------------------------
   */

  const webhook = await prisma.webhook.create({
    data: {
      businessId: business.id,
      name: "Order Webhook",
      url: "https://example.test/webhooks/laundry",
      secret: "dev-secret",
      events: [
        "order.created",
        "order.ready",
        "order.completed",
      ],
      status: WebhookStatus.ACTIVE,
    },
  });

  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event: "order.ready",
      payload: {
        orderId: order1.id,
        orderNumber: order1.orderNumber,
      },
      statusCode: 200,
      response: "OK",
      success: true,
      attempt: 1,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 41. API KEY
   * --------------------------------------------------------------------------
   */

  await prisma.apiKey.create({
    data: {
      businessId: business.id,
      userId: owner.id,
      name: "Development API Key",
      keyHash: `dev-${randomUUID()}`,
      prefix: "los_dev",
      status: ApiKeyStatus.ACTIVE,
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 42. FEATURE FLAGS
   * --------------------------------------------------------------------------
   */

  await prisma.featureFlag.createMany({
    data: [
      {
        businessId: business.id,
        key: "inventory",
        enabled: true,
        config: {
          lowStockAlerts: true,
        },
      },
      {
        businessId: business.id,
        key: "delivery",
        enabled: true,
        config: {
          enabled: true,
        },
      },
      {
        businessId: business.id,
        key: "loyalty",
        enabled: true,
        config: {
          pointsPer1000: 1,
        },
      },
      {
        businessId: business.id,
        key: "whatsapp",
        enabled: true,
        config: {
          enabled: true,
        },
      },
    ],
    skipDuplicates: true,
  });

  /*
   * --------------------------------------------------------------------------
   * 43. SYSTEM SETTING
   * --------------------------------------------------------------------------
   */

  await prisma.systemSetting.upsert({
    where: {
      key: "system.name",
    },
    update: {
      value: "LaundryOS",
    },
    create: {
      key: "system.name",
      value: "LaundryOS",
      description: "Application name",
    },
  });

  await prisma.systemSetting.upsert({
    where: {
      key: "system.environment",
    },
    update: {
      value: "development",
    },
    create: {
      key: "system.environment",
      value: "development",
      description: "Current application environment",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * 44. AUDIT LOG
   * --------------------------------------------------------------------------
   */

  await prisma.auditLog.create({
    data: {
      businessId: business.id,
      userId: owner.id,
      employeeId: ownerEmployee.id,
      action: AuditAction.CREATE,
      entityType: "Business",
      entityId: business.id,
      newData: {
        name: business.name,
        slug: business.slug,
      },
      ipAddress: "127.0.0.1",
      userAgent: "LaundryOS Seed",
    },
  });

  /*
   * --------------------------------------------------------------------------
   * SUMMARY
   * --------------------------------------------------------------------------
   */

  console.log("");
  console.log("✅ LaundryOS seed completed.");
  console.log("");
  console.log("Business:");
  console.log(`  ${business.name}`);
  console.log("");
  console.log("Users:");
  console.log("  owner / DEV_PASSWORD_CHANGE_ME");
  console.log("  admin / DEV_PASSWORD_CHANGE_ME");
  console.log("  staff / DEV_PASSWORD_CHANGE_ME");
  console.log("");
  console.log("Branches:");
  console.log("  MDN01 - Laundry Ran Medan Kota");
  console.log("  MDN02 - Laundry Ran Setia Budi");
  console.log("");
  console.log("Orders:");
  console.log(`  ${order1.orderNumber} - READY`);
  console.log(`  ${order2.orderNumber} - PROCESSING`);
  console.log("");
  console.log("Seed data includes:");
  console.log("  ✓ RBAC");
  console.log("  ✓ Business");
  console.log("  ✓ Subscription");
  console.log("  ✓ Branches");
  console.log("  ✓ Employees");
  console.log("  ✓ Shifts");
  console.log("  ✓ Cash Register");
  console.log("  ✓ Customers");
  console.log("  ✓ Segmentation");
  console.log("  ✓ Loyalty");
  console.log("  ✓ Services");
  console.log("  ✓ Pricing");
  console.log("  ✓ Orders");
  console.log("  ✓ Payments");
  console.log("  ✓ Storage");
  console.log("  ✓ Inventory");
  console.log("  ✓ Suppliers");
  console.log("  ✓ Production");
  console.log("  ✓ Delivery");
  console.log("  ✓ Complaints");
  console.log("  ✓ Expenses");
  console.log("  ✓ Accounting");
  console.log("  ✓ Notifications");
  console.log("  ✓ Messaging");
  console.log("  ✓ Integration");
  console.log("  ✓ Webhooks");
  console.log("  ✓ API Keys");
  console.log("  ✓ Feature Flags");
  console.log("  ✓ Audit Logs");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });