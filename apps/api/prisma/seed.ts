import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: requireEnv('DATABASE_URL'),
    }),
});

async function main() {
    const users = [
        { username: 'demo', password: 'demo1234' },
        { username: 'admin', password: 'admin1234' },
    ];

    for (const u of users) {
        const passwordHash = await argon2.hash(u.password, { type: argon2.argon2id });

        await prisma.user.upsert({
            where: { username: u.username },
            update: { passwordHash },
            create: { username: u.username, passwordHash },
        });
    }
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