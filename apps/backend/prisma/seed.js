"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    await prisma.ticketTimeline.deleteMany();
    await prisma.ticketAttachment.deleteMany();
    await prisma.ticketComment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.ticketCategory.deleteMany();
    await prisma.sLAPolicy.deleteMany();
    await prisma.knowledgeArticle.deleteMany();
    await prisma.knowledgeCategory.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.softwareLicense.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.user.deleteMany();
    console.log('Cleaned existing data');
    const passwordHash = await bcrypt.hash('password123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@itsm.local' },
        update: {},
        create: {
            email: 'admin@itsm.local',
            username: 'superadmin',
            passwordHash,
            role: 'SUPER_ADMIN',
            department: 'IT Management',
        },
    });
    const manager = await prisma.user.upsert({
        where: { email: 'manager@itsm.local' },
        update: {},
        create: {
            email: 'manager@itsm.local',
            username: 'itmanager',
            passwordHash,
            role: 'IT_MANAGER',
            department: 'IT Management',
        },
    });
    const support1 = await prisma.user.upsert({
        where: { email: 'support1@itsm.local' },
        update: {},
        create: {
            email: 'support1@itsm.local',
            username: 'itsupport1',
            passwordHash,
            role: 'IT_SUPPORT',
            department: 'IT Support',
        },
    });
    const support2 = await prisma.user.upsert({
        where: { email: 'support2@itsm.local' },
        update: {},
        create: {
            email: 'support2@itsm.local',
            username: 'itsupport2',
            passwordHash,
            role: 'IT_SUPPORT',
            department: 'IT Support',
        },
    });
    const user1 = await prisma.user.upsert({
        where: { email: 'user1@itsm.local' },
        update: {},
        create: {
            email: 'user1@itsm.local',
            username: 'regularuser',
            passwordHash,
            role: 'USER',
            department: 'Finance',
        },
    });
    console.log('Users seeded:', admin.email, manager.email, support1.email, support2.email, user1.email);
    const slaCritical = await prisma.sLAPolicy.create({
        data: {
            name: 'Critical SLA',
            priority: 'CRITICAL',
            responseTimeMinutes: 15,
            resolutionTimeMinutes: 120,
            isDefault: true,
        },
    });
    const slaHigh = await prisma.sLAPolicy.create({
        data: {
            name: 'High SLA',
            priority: 'HIGH',
            responseTimeMinutes: 30,
            resolutionTimeMinutes: 240,
        },
    });
    await prisma.sLAPolicy.create({
        data: {
            name: 'Medium SLA',
            priority: 'MEDIUM',
            responseTimeMinutes: 60,
            resolutionTimeMinutes: 480,
        },
    });
    await prisma.sLAPolicy.create({
        data: {
            name: 'Low SLA',
            priority: 'LOW',
            responseTimeMinutes: 120,
            resolutionTimeMinutes: 1440,
        },
    });
    console.log('SLA policies seeded');
    const networking = await prisma.ticketCategory.create({
        data: {
            name: 'Networking',
            slug: 'networking',
            description: 'Network-related issues (WiFi, LAN, VPN)',
            slaPolicyId: slaHigh.id,
        },
    });
    const hardware = await prisma.ticketCategory.create({
        data: {
            name: 'Hardware',
            slug: 'hardware',
            description: 'Hardware issues (laptop, printer, peripherals)',
            slaPolicyId: slaHigh.id,
        },
    });
    const software = await prisma.ticketCategory.create({
        data: {
            name: 'Software',
            slug: 'software',
            description: 'Software issues (OS, apps, licensing)',
            slaPolicyId: slaCritical.id,
        },
    });
    const email = await prisma.ticketCategory.create({
        data: {
            name: 'Email',
            slug: 'email',
            description: 'Email-related issues (Outlook, configuration)',
        },
    });
    await prisma.ticketCategory.create({
        data: {
            name: 'Account Access',
            slug: 'account-access',
            description: 'Account creation, password reset, permissions',
            slaPolicyId: slaCritical.id,
        },
    });
    console.log('Categories seeded');
    const tickets = [
        { title: 'Cannot connect to VPN', description: 'Getting error 800 when trying to connect to VPN from home.', priority: 'HIGH', status: 'OPEN', categoryId: networking.id, requesterId: user1.id, assigneeId: support1.id },
        { title: 'Laptop screen flickering', description: 'Dell Latitude screen flickers intermittently.', priority: 'MEDIUM', status: 'IN_PROGRESS', categoryId: hardware.id, requesterId: user1.id, assigneeId: support1.id },
        { title: 'Microsoft Office license expired', description: 'Excel and Word showing license expired message.', priority: 'HIGH', status: 'OPEN', categoryId: software.id, requesterId: user1.id, assigneeId: support2.id },
        { title: 'Cannot send emails', description: 'Outlook stuck in offline mode, cannot send or receive.', priority: 'CRITICAL', status: 'RESOLVED', categoryId: email.id, requesterId: user1.id, assigneeId: support2.id },
        { title: 'New hire account setup', description: 'Need to create account for new employee John Doe.', priority: 'MEDIUM', status: 'CLOSED', categoryId: hardware.id, requesterId: manager.id, assigneeId: support1.id },
    ];
    for (const ticketData of tickets) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await prisma.ticket.count({
            where: { createdAt: { gte: new Date(`${year}-${month}-01`) } },
        });
        const ticketNumber = `TICK-${year}${month}-${String(count + 1).padStart(4, '0')}`;
        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber,
                title: ticketData.title,
                description: ticketData.description,
                status: ticketData.status,
                priority: ticketData.priority,
                categoryId: ticketData.categoryId,
                requesterId: ticketData.requesterId,
                assigneeId: ticketData.assigneeId,
                dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
                ...(ticketData.status === 'RESOLVED' ? { resolvedAt: new Date(), firstResponseAt: new Date(Date.now() - 2 * 60 * 60 * 1000) } : {}),
                ...(ticketData.status === 'CLOSED' ? { resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), closedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), firstResponseAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } : {}),
            },
        });
        await prisma.ticketTimeline.create({
            data: { ticketId: ticket.id, actorId: ticketData.requesterId, action: 'CREATE', toValue: ticketData.status },
        });
        if (ticketData.assigneeId) {
            await prisma.ticketTimeline.create({
                data: { ticketId: ticket.id, actorId: ticketData.assigneeId, action: 'ASSIGN', toValue: ticketData.assigneeId },
            });
        }
    }
    console.log('Tickets seeded');
    console.log('Seed completed!');
    console.log('---');
    console.log('Login credentials (all users): password123');
    console.log('Admin: admin@itsm.local');
    console.log('Manager: manager@itsm.local');
    console.log('Support 1: support1@itsm.local');
    console.log('Support 2: support2@itsm.local');
    console.log('User: user1@itsm.local');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map