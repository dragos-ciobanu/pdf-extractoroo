import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import type { Channel, Connection, ConsumeMessage } from 'amqplib';
import { PrismaService } from './prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { PDFParse, TextResult} from 'pdf-parse';
import {DocumentStatus} from "@prisma/client";

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  private exchange = process.env.RABBITMQ_EXCHANGE || 'pdftext';
  private queue = process.env.RABBITMQ_QUEUE || 'pdftext.extract';
  private routingKey = process.env.RABBITMQ_ROUTING_KEY || 'extract_text';
  private url = process.env.RABBITMQ_URL!;

  private concurrency = Number(process.env.WORKER_CONCURRENCY || 2);

  private conn?: Connection;
  private channel?: Channel;

  constructor(
      private readonly prisma: PrismaService,
      private readonly storage: StorageService,
  ) {}

  async start() {
    if (!this.url) throw new Error('Missing env var RABBITMQ_URL');
    this.conn = await amqp.connect(this.url);
    this.channel = await this.conn.createChannel();

    await this.channel.assertExchange(this.exchange, 'direct', { durable: true });
    await this.channel.assertQueue(this.queue, { durable: true });
    await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

    await this.channel.prefetch(this.concurrency);

    this.logger.log(`Worker consuming queue=${this.queue} concurrency=${this.concurrency}`);

    await this.channel.consume(this.queue, (msg) => this.onMessage(msg), { noAck: false });
  }

  private async onMessage(msg: ConsumeMessage | null) {
    if (!msg) return;
    const raw = msg.content.toString('utf-8');

    let documentId: string | undefined;
    try {
      const payload = JSON.parse(raw);
      documentId = payload.documentId;
      if (!documentId) throw new Error('Missing documentId');

      await this.processDocument(documentId);

      this.channel!.ack(msg);
    } catch (err: any) {
      this.logger.error(`Job failed documentId=${documentId ?? 'unknown'} err=${err?.message ?? err}`);

      if (documentId) {
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: 'FAILED',
            failureReason: truncate(String(err?.message ?? err), 500),
          },
        }).catch(() => undefined);
      }

      this.channel!.nack(msg, false, false);
    }
  }

  private async processDocument(documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new Error(`Document not found: ${documentId}`);

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESSING, failureReason: null },
    });

    const bodyStream = await this.storage.getPdfStream(doc.storageKey);
    const buffer = await streamToBuffer(bodyStream as any);

    const parser = new PDFParse({ data: buffer});

    try {
      const parsed: TextResult = await parser.getText();
      const text: string = (parsed.text || '').trim();

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.DONE,
          extractedText: text,
          extractedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        await this.prisma.document.update({
          where: {id: documentId},
          data: {status: DocumentStatus.FAILED, failureReason: error.message},
        });
      }

      throw error;
    } finally {
      await parser.destroy();
    }
  }
}

function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}