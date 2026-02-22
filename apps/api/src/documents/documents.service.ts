import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { QueueService } from '../queue/queue.service';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly queue: QueueService,
    ) {}

    list(userId: string) {
        return this.prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                filename: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                extractedAt: true,
                failureReason: true,
            },
        });
    }

    async get(userId: string, id: string) {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        if (!doc || doc.userId !== userId) throw new ForbiddenException();
        return doc;
    }

    async upload(userId: string, filename: string, buffer: Buffer) {
        const id = randomUUID();
        const storageKey = `${userId}/${id}.pdf`;

        await this.storage.putPdf(storageKey, buffer);

        const doc = await this.prisma.document.create({
            data: {
                id,
                userId,
                filename,
                storageKey,
                status: 'QUEUED',
            },
        });

        await this.queue.publishExtractTextJob({ documentId: id });

        return doc;
    }
}