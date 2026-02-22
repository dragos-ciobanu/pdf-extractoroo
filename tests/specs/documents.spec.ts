import { test, expect, type APIRequestContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type LoginResponse = { accessToken: string };
type DocumentListItem = { id: string; filename: string; status: string; createdAt: string };
type DocumentDetail = DocumentListItem & { extractedText?: string | null; failureReason?: string | null };

async function login(request: APIRequestContext): Promise<string> {
    const res = await request.post('/auth/login', {
        data: { username: 'demo', password: 'demo1234' },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as LoginResponse;
    expect(body.accessToken).toBeTruthy();
    return body.accessToken;
}

async function listDocs(request: APIRequestContext, token: string): Promise<DocumentListItem[]> {
    const res = await request.get('/documents', {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()) as DocumentListItem[];
}

async function getDetail(request: APIRequestContext, token: string, id: string): Promise<DocumentDetail> {
    const res = await request.get(`/documents/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    return (await res.json()) as DocumentDetail;
}

async function uploadPdf(
    request: APIRequestContext,
    token: string,
    filename: string,
    buffer: Buffer,
): Promise<string> {
    const res = await request.post('/documents', {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
            file: { name: filename, mimeType: 'application/pdf', buffer },
        },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { id: string };
    expect(body.id).toBeTruthy();
    return body.id;
}

async function waitForTerminal(
    request: APIRequestContext,
    token: string,
    id: string,
    timeoutMs = 60_000,
): Promise<DocumentDetail> {
    const deadline = Date.now() + timeoutMs;
    let last: DocumentDetail | null = null;

    while (Date.now() < deadline) {
        last = await getDetail(request, token, id);
        if (last.status === 'DONE' || last.status === 'FAILED') return last;
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error(`Timeout waiting for terminal status (last=${last?.status ?? 'unknown'})`);
}

test.describe('Documents API', () => {
    test('requires auth', async ({ request }) => {
        const res = await request.get('/documents');
        expect(res.status()).toBe(401);
    });

    test('rejects non-PDF upload', async ({ request }) => {
        const token = await login(request);
        const res = await request.post('/documents', {
            headers: { Authorization: `Bearer ${token}` },
            multipart: {
                file: { name: 'nope.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
            },
        });
        expect(res.status()).toBe(400);
    });

    test('uploads PDF and processes successfully', async ({ request }) => {
        const token = await login(request);
        const pdfPath = path.join(process.cwd(), 'tests', 'fixtures', 'hello.pdf');
        const pdfBuf = await readFile(pdfPath);

        const id = await uploadPdf(request, token, 'hello.pdf', pdfBuf);

        const list = await listDocs(request, token);
        expect(list.some((d) => d.id === id)).toBeTruthy();

        const final = await waitForTerminal(request, token, id, 60_000);
        expect(final.status).toBe('DONE');
        expect((final.extractedText ?? '').trim().length).toBeGreaterThan(0);
    });

    test('corrupt PDF ends in failed state', async ({ request }) => {
        const token = await login(request);
        const corruptBuf = Buffer.from(
            '%PDF-1.4\n% Corrupt\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size 1 >>\nstartxref\n9\n%%EOF\n',
            'utf8',
        );

        const id = await uploadPdf(request, token, 'corrupt.pdf', corruptBuf);

        const final = await waitForTerminal(request, token, id, 60_000);
        expect(final.status).toBe('FAILED');
        expect((final.failureReason ?? '').length).toBeGreaterThan(0);
    });
});