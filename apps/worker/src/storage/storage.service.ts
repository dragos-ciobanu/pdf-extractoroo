import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
    private readonly s3: S3Client;
    private readonly bucket: string;

    constructor() {
        this.bucket = process.env.S3_BUCKET!;
        this.s3 = new S3Client({
            region: process.env.S3_REGION || 'us-east-1',
            endpoint: process.env.S3_ENDPOINT,
            forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
        });
    }

    async putPdf(key: string, buffer: Buffer, contentType = 'application/pdf') {
        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            }),
        );
    }

    async getPdfStream(key: string) {
        const res = await this.s3.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );
        return res.Body;
    }
}