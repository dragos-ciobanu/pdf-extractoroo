import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';

@Module({
    imports: [
        HealthModule,
        PrismaModule,
        StorageModule,
        QueueModule,
        AuthModule,
        DocumentsModule,
    ],
})
export class AppModule {}