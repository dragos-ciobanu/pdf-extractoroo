import { getToken, clearToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type LoginResponse = { accessToken: string };

export type DocumentStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED' | string;

export type DocumentListItem = {
    id: string;
    filename: string;
    status: DocumentStatus;
    createdAt: string;
    updatedAt?: string;
    extractedAt?: string | null;
    failureReason?: string | null;
};

export type DocumentDetail = DocumentListItem & {
    storageKey?: string;
    extractedText?: string | null;
};

export class ApiError extends Error {
    status: number;
    body?: string;

    constructor(message: string, status: number, body?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

export type AuthErrorListener = () => void;

const authListeners = new Set<AuthErrorListener>();

export function onAuthRequired(listener: AuthErrorListener): () => void {
    authListeners.add(listener);
    return () => authListeners.delete(listener);
}

function notifyAuthRequired() {
    for (const l of authListeners) l();
}

function buildUrl(path: string) {
    return `${API_BASE_URL}${path}`;
}

async function readBodySafe(res: Response): Promise<string> {
    try {
        return await res.text();
    } catch {
        return '';
    }
}

async function request<T>(path: string, init: RequestInit = {}, opts?: { auth?: boolean }): Promise<T> {
    const headers = new Headers(init.headers || {});
    headers.set('Accept', 'application/json');

    const auth = opts?.auth ?? true;
    if (auth) {
        const token = getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(buildUrl(path), { ...init, headers });

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            clearToken();
            notifyAuthRequired();
        }

        const body = await readBodySafe(res);
        const shortBody = body && body.length < 400 ? body : '';
        const msg = `HTTP ${res.status}${shortBody ? `: ${shortBody}` : ''}`;
        throw new ApiError(msg, res.status, body);
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return undefined as unknown as T;
    return (await res.json()) as T;
}

export const api = {
    login(username: string, password: string) {
        return request<LoginResponse>(
            '/auth/login',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            },
            { auth: false },
        );
    },

    listDocuments() {
        return request<DocumentListItem[]>('/documents');
    },

    getDocument(id: string) {
        return request<DocumentDetail>(`/documents/${encodeURIComponent(id)}`);
    },

    uploadDocument(file: File) {
        const form = new FormData();
        form.append('file', file);
        return request<DocumentDetail>('/documents', {
            method: 'POST',
            body: form,
        });
    },
};