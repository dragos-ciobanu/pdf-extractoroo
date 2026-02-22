import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { WorkerService } from './worker.service';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [WorkerService],
})
export class WorkerModule {}