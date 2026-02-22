import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';

type AuthenticatedRequest = {
    user: { id: string; username?: string };
};

type UploadedPdfFile = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB

@Controller('/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
    constructor(private readonly docs: DocumentsService) {}

    @Get()
    list(@Req() req: AuthenticatedRequest) {
        return this.docs.list(req.user.id);
    }

    @Get('/:id')
    get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.docs.get(req.user.id, id);
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_PDF_BYTES },
            fileFilter: (_req, file, cb) => {
                const isPdf =
                    file.mimetype === 'application/pdf' ||
                    file.originalname.toLowerCase().endsWith('.pdf');
                cb(isPdf ? null : new BadRequestException('Only PDF files are allowed'), isPdf);
            },
        }),
    )
    async upload(
        @Req() req: AuthenticatedRequest,
        @UploadedFile() file?: UploadedPdfFile,
    ) {
        if (!file) throw new BadRequestException('Missing file');
        if (!file.buffer?.length) throw new BadRequestException('Empty upload');
        if (file.size > MAX_PDF_BYTES) throw new BadRequestException('File too large');

        return this.docs.upload(req.user.id, file.originalname, file.buffer);
    }
}