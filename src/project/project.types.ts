// src/project/project.types.ts

import { Prisma } from '@prisma/client';

export const projectWithDetailsArgs =
  Prisma.validator<Prisma.ProjectDefaultArgs>()({
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
      _count: {
        select: {
          qrcodes: true,
          tasks: true,
          members: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

export const projectWithCountsArgs =
  Prisma.validator<Prisma.ProjectDefaultArgs>()({
    include: {
      _count: {
        select: {
          qrcodes: true,
          tasks: true,
          members: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
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

export type DeleteResult = {
  message: string;
  id: string;
};

export interface ProjectMemberWithRole {
  id: string;
  email: string;
  fullName: string;
  roleId: string | null;
  role?: {
    id: string;
    name: string;
    permissions?: any[];
  } | null;
  assignedAt: Date;
}

export interface ProjectRole {
  id: string;
  name: string;
  permissions: any[];
  memberCount: number;
}

export interface ProjectRolesAndMembers {
  roles: ProjectRole[];
  members: ProjectMemberWithRole[];
}
