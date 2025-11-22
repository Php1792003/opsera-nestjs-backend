import { Prisma } from '@prisma/client';

export const projectSelect = {
  id: true,
  name: true,
  description: true,
  address: true,
  status: true,
  image: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
};

export const projectWithDetailsArgs = Prisma.validator<Prisma.ProjectFindFirstArgs>()({
  select: {
    ...projectSelect,
    qrcodes: {
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    tasks: {
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    _count: {
      select: {
        qrcodes: true,
        tasks: true,
        members: true,
      },
    },
  },
});

export const projectWithCountsArgs = Prisma.validator<Prisma.ProjectFindManyArgs>()({
  select: {
    ...projectSelect,
    _count: {
      select: {
        qrcodes: true,
        tasks: true,
        members: true,
      },
    },
  },
});

export type ProjectWithDetails = Prisma.ProjectGetPayload<
  typeof projectWithDetailsArgs
>;
export type ProjectWithCounts = Prisma.ProjectGetPayload<
  typeof projectWithCountsArgs
>;

export type ProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  status: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  qrCount: number;      // Frontend dùng biến này
  taskCount: number;
  staffCount: number;   // Frontend dùng biến này (tương ứng members)
  qrcodes?: any[];
  tasks?: any[];
};

export type DeleteResult = {
  message: string;
  id: string;
};

