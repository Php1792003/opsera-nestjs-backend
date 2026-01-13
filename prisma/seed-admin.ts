import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Bắt đầu tạo dữ liệu Admin...');

    // 1. Tạo Tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Opsera Corp (Local)',
            subscriptionPlan: 'ENTERPRISE',
            isActive: true,
            maxUsers: 9999,
            maxProjects: 9999,
            maxQRCodes: 9999,
            subscriptions: {
                create: {
                    plan: 'ENTERPRISE',
                    price: 0,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: new Date('2099-12-31'),
                    autoRenew: true,
                },
            },
        },
    });

    // 2. Tạo Role
    const role = await prisma.role.create({
        data: {
            name: 'Tenant Admin',
            permissions: '["ALL"]',
            tenantId: tenant.id,
        },
    });

    // 3. Tạo User
    const password = await bcrypt.hash('Admin123@', 10);
    const user = await prisma.user.create({
        data: {
            email: 'admin@opsera.com',
            password: password,
            fullName: 'Super Administrator',
            isTenantAdmin: true,
            isSuperAdmin: true,
            tenantId: tenant.id,
            roleId: role.id,
        },
    });

    console.log(`🎉 TẠO THÀNH CÔNG!`);
    console.log(`Email: admin@opsera.com`);
    console.log(`Pass:  Admin123@`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());