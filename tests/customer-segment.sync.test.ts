import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const prismaMock = vi.hoisted(() => ({
  customer: {
    findFirst: vi.fn(),
  },

  customerSegment: {
    findMany: vi.fn(),
  },

  customerSegmentMember: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

import {
  syncDynamicSegmentsForCustomer,
} from "../src/modules/customer-segments/customer-segment.service.js";

const customer = {
  id: "customer-1",
  totalOrders: 10,
  totalSpent: 1500000,
  averageOrderValue: 150000,
  status: "ACTIVE" as const,
  firstOrderAt: new Date(
    "2026-01-01T00:00:00.000Z",
  ),
  lastOrderAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();

  prismaMock.customer.findFirst.mockResolvedValue(
    customer as never,
  );

  prismaMock.customerSegment.findMany.mockResolvedValue(
    [],
  );

  prismaMock.customerSegmentMember.findUnique.mockResolvedValue(
    null,
  );

  prismaMock.customerSegmentMember.create.mockResolvedValue(
    {} as never,
  );

  prismaMock.customerSegmentMember.delete.mockResolvedValue(
    {} as never,
  );
});

describe("syncDynamicSegmentsForCustomer", () => {
  it("does nothing when customer does not exist", async () => {
    prismaMock.customer.findFirst.mockResolvedValue(
      null,
    );

    await syncDynamicSegmentsForCustomer(
      "business-1",
      "customer-1",
    );

    expect(
      prismaMock.customerSegment.findMany,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.customerSegmentMember.create,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.customerSegmentMember.delete,
    ).not.toHaveBeenCalled();
  });

  it("adds customer when customer matches a segment", async () => {
    prismaMock.customerSegment.findMany.mockResolvedValue(
      [
        {
          id: "segment-1",
          rules: {
            all: [
              {
                field: "totalSpent",
                operator: "gte",
                value: 1000000,
              },
            ],
          },
        },
      ] as never,
    );

    prismaMock.customerSegmentMember.findUnique.mockResolvedValue(
      null,
    );

    await syncDynamicSegmentsForCustomer(
      "business-1",
      "customer-1",
    );

    expect(
      prismaMock.customerSegmentMember.create,
    ).toHaveBeenCalledWith({
      data: {
        segmentId: "segment-1",
        customerId: "customer-1",
      },
    });

    expect(
      prismaMock.customerSegmentMember.delete,
    ).not.toHaveBeenCalled();
  });

  it("does not create membership when customer is already a member", async () => {
    prismaMock.customerSegment.findMany.mockResolvedValue(
      [
        {
          id: "segment-1",
          rules: {
            all: [
              {
                field: "totalSpent",
                operator: "gte",
                value: 1000000,
              },
            ],
          },
        },
      ] as never,
    );

    prismaMock.customerSegmentMember.findUnique.mockResolvedValue(
      {
        segmentId: "segment-1",
        customerId: "customer-1",
      } as never,
    );

    await syncDynamicSegmentsForCustomer(
      "business-1",
      "customer-1",
    );

    expect(
      prismaMock.customerSegmentMember.create,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.customerSegmentMember.delete,
    ).not.toHaveBeenCalled();
  });

  it("removes customer when customer no longer matches", async () => {
    prismaMock.customerSegment.findMany.mockResolvedValue(
      [
        {
          id: "segment-1",
          rules: {
            all: [
              {
                field: "totalSpent",
                operator: "gte",
                value: 5000000,
              },
            ],
          },
        },
      ] as never,
    );

    prismaMock.customerSegmentMember.findUnique.mockResolvedValue(
      {
        segmentId: "segment-1",
        customerId: "customer-1",
      } as never,
    );

    await syncDynamicSegmentsForCustomer(
      "business-1",
      "customer-1",
    );

    expect(
      prismaMock.customerSegmentMember.delete,
    ).toHaveBeenCalledWith({
      where: {
        segmentId_customerId: {
          segmentId: "segment-1",
          customerId: "customer-1",
        },
      },
    });

    expect(
      prismaMock.customerSegmentMember.create,
    ).not.toHaveBeenCalled();
  });

  it("does nothing when customer does not match and is not a member", async () => {
    prismaMock.customerSegment.findMany.mockResolvedValue(
      [
        {
          id: "segment-1",
          rules: {
            all: [
              {
                field: "totalSpent",
                operator: "gte",
                value: 5000000,
              },
            ],
          },
        },
      ] as never,
    );

    prismaMock.customerSegmentMember.findUnique.mockResolvedValue(
      null,
    );

    await syncDynamicSegmentsForCustomer(
      "business-1",
      "customer-1",
    );

    expect(
      prismaMock.customerSegmentMember.create,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.customerSegmentMember.delete,
    ).not.toHaveBeenCalled();
  });

  it("handles multiple dynamic segments independently", async () => {
    prismaMock.customerSegment.findMany.mockResolvedValue(
      [
        {
          id: "segment-vip",
          rules: {
            all: [
              {
                field: "totalSpent",
                operator: "gte",
                value: 1000000,
              },
            ],
          },
        },
        {
          id: "segment-heavy-user",
          rules: {
            all: [
              {
                field: "totalOrders",
                operator: "gte",
                value: 20,
              },
            ],
          },
        },
      ] as never,
    );

    prismaMock.customerSegmentMember.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await syncDynamicSegmentsForCustomer(
      "business-1",
      "customer-1",
    );

    expect(
      prismaMock.customerSegmentMember.create,
    ).toHaveBeenCalledTimes(1);

    expect(
      prismaMock.customerSegmentMember.create,
    ).toHaveBeenCalledWith({
      data: {
        segmentId: "segment-vip",
        customerId: "customer-1",
      },
    });

    expect(
      prismaMock.customerSegmentMember.delete,
    ).not.toHaveBeenCalled();
  });

  it("skips segments with invalid rules", async () => {
    prismaMock.customerSegment.findMany.mockResolvedValue(
      [
        {
          id: "segment-invalid",
          rules: {
            invalid: true,
          },
        },
      ] as never,
    );

    await syncDynamicSegmentsForCustomer(
      "business-1",
      "customer-1",
    );

    expect(
      prismaMock.customerSegmentMember.findUnique,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.customerSegmentMember.create,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.customerSegmentMember.delete,
    ).not.toHaveBeenCalled();
  });
});