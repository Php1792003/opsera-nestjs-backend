import { Prisma } from '@prisma/client';

export const projectWithCounts = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: {
    _count: {
      select: {
        qrcodes: true,
        tasks: true,
      },
    },
  },
});
