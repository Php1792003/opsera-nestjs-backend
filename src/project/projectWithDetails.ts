import { Prisma } from '@prisma/client';

export const projectWithDetails = Prisma.validator<Prisma.ProjectDefaultArgs>()(
  {
    include: {
      qrcodes: {
        select: {
          id: true,
          name: true,
          location: true,
          data: true,
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
      _count: { select: { qrcodes: true, tasks: true } },
    },
  },
);
