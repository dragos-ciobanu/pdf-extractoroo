import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { Channel, Connection } from 'amqplib';

@Injectable()
export class QueueService implements OnModuleDestroy {
    private readonly logger = new Logger(QueueService.name);
    private conn?: Connection;
    private channel?: Channel;

    private exchange = process.env.RABBITMQ_EXCHANGE || 'pdftext';
    private queue = process.env.RABBITMQ_QUEUE || 'pdftext.extract';
    private routingKey = process.env.RABBITMQ_ROUTING_KEY || 'extract_text';
    private url = process.env.RABBITMQ_URL!;

    private async ensure() {
        if (this.channel) return;

        this.conn = await amqp.connect(this.url);
        this.channel = await this.conn.createChannel();

        await this.channel.assertExchange(this.exchange, 'direct', { durable: true });
        await this.channel.assertQueue(this.queue, { durable: true });
        await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

        this.logger.log(`RabbitMQ ready exchange=${this.exchange} queue=${this.queue}`);
    }

    async publishExtractTextJob(payload: { documentId: string }) {
        await this.ensure();
        const body = Buffer.from(JSON.stringify(payload));
        const ok = this.channel!.publish(this.exchange, this.routingKey, body, {
            contentType: 'application/json',
            persistent: true,
            messageId: payload.documentId,
        });

        if (!ok) this.logger.warn('RabbitMQ publish returned false (backpressure)');
    }

    async onModuleDestroy() {
        try {
            await this.channel?.close();
            await this.conn?.close();
        } catch {}
    }
}