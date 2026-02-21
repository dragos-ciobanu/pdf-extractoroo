import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';

import { api } from '../api';
import type { DocumentDetail, DocumentListItem } from '../api';
import { clearToken } from '../auth';
import { EmptyState } from '../components/EmptyState';
import { TopBar } from '../components/TopBar';
import { useInterval } from '../hooks/useInterval';

function fmtDate(iso?: string | null): string {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function StatusChip({ status }: { status: string }) {
    const s = status.toUpperCase();
    const color =
        s === 'DONE' ? 'success' : s === 'FAILED' ? 'error' : s === 'PROCESSING' ? 'warning' : 'default';

    return (
        <Chip
            size="small"
            label={s}
            color={color as 'default' | 'success' | 'error' | 'warning'}
            variant={s === 'QUEUED' ? 'outlined' : 'filled'}
        />
    );
}

type DocumentsPageProps = {
    onLoggedOut: () => void;
};

export function DocumentsPage({ onLoggedOut }: DocumentsPageProps) {
    const [docs, setDocs] = useState<DocumentListItem[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [detail, setDetail] = useState<DocumentDetail | null>(null);

    const [loadingList, setLoadingList] = useState<boolean>(false);
    const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);

    const [listErr, setListErr] = useState<string>('');
    const [detailErr, setDetailErr] = useState<string>('');
    const [uploadErr, setUploadErr] = useState<string>('');

    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const needsPolling = useMemo<boolean>(
        () => docs.some((d) => d.status === 'QUEUED' || d.status === 'PROCESSING'),
        [docs],
    );

    const refreshList = useCallback(async (): Promise<void> => {
        setListErr('');
        setLoadingList(true);
        try {
            const list = await api.listDocuments();
            setDocs(list);

            setSelectedId((prev) => {
                if (prev && list.some((d) => d.id === prev)) return prev;
                return list[0]?.id ?? '';
            });
        } catch (e: unknown) {
            setListErr(e instanceof Error ? e.message : 'Failed to load documents');
        } finally {
            setLoadingList(false);
        }
    }, []);

    const refreshDetail = useCallback(async (id: string): Promise<void> => {
        if (!id) return;
        setDetailErr('');
        setLoadingDetail(true);
        try {
            const d = await api.getDocument(id);
            setDetail(d);
        } catch (e: unknown) {
            setDetailErr(e instanceof Error ? e.message : 'Failed to load document');
            setDetail(null);
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0] ?? null;
        setUploadErr('');

        if (!file) {
            setPickedFile(null);
            return;
        }

        const looksPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!looksPdf) {
            setPickedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setUploadErr('Only PDF files are allowed.');
            return;
        }

        setPickedFile(file);
    }, []);

    const upload = useCallback(async (): Promise<void> => {
        setUploadErr('');
        const file = pickedFile;
        if (!file) {
            setUploadErr('Pick a PDF first.');
            return;
        }

        setUploading(true);
        try {
            await api.uploadDocument(file);

            setPickedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            await refreshList();
        } catch (e: unknown) {
            setUploadErr(e instanceof Error ? e.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [pickedFile, refreshList]);

    const logout = useCallback((): void => {
        clearToken();
        onLoggedOut();
    }, [onLoggedOut]);

    useEffect(() => {
        void refreshList();
    }, [refreshList]);

    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            return;
        }
        void refreshDetail(selectedId);
    }, [refreshDetail, selectedId]);

    useInterval(
        useCallback(() => {
            void refreshList();
            if (selectedId) void refreshDetail(selectedId);
        }, [refreshDetail, refreshList, selectedId]),
        needsPolling ? 2500 : null,
    );

    const showEmpty = docs.length === 0 && !loadingList && !listErr;

    return (
        <>
            <TopBar title="PDF → Text Extractor" showRefresh showLogout onRefresh={refreshList} onLogout={logout} />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" fontWeight={800}>
                                    Upload a PDF
                                </Typography>

                                {uploadErr ? <Alert severity="error">{uploadErr}</Alert> : null}

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        onChange={onPickFile}
                                        style={{ display: 'none' }}
                                        id="pdf-file-input"
                                    />

                                    <Button
                                        variant="outlined"
                                        component="label"
                                        htmlFor="pdf-file-input"
                                        startIcon={<UploadFileIcon />}
                                        sx={{ minWidth: 220 }}
                                    >
                                        Choose PDF
                                    </Button>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight={650} noWrap>
                                            {pickedFile ? pickedFile.name : 'No file selected'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {pickedFile ? `${Math.round(pickedFile.size / 1024)} KB` : 'PDF only'}
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        onClick={upload}
                                        disabled={uploading || !pickedFile}
                                        sx={{ minWidth: 160 }}
                                        startIcon={uploading ? <CircularProgress size={18} /> : undefined}
                                    >
                                        {uploading ? 'Uploading…' : 'Upload'}
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        onClick={refreshList}
                                        startIcon={<RefreshIcon />}
                                        disabled={loadingList}
                                        sx={{ minWidth: 140 }}
                                    >
                                        Refresh
                                    </Button>
                                </Stack>

                                {(loadingList || uploading) ? <LinearProgress /> : null}
                            </Stack>
                        </CardContent>
                    </Card>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '420px 1fr' }, gap: 3 }}>
                        <Card elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6" fontWeight={800}>
                                        Documents
                                    </Typography>

                                    {listErr ? <Alert severity="error">{listErr}</Alert> : null}

                                    {showEmpty ? (
                                        <EmptyState
                                            title="No documents yet"
                                            subtitle="Upload a PDF above to extract its text. Processing is asynchronous."
                                            actionLabel="Refresh"
                                            onAction={refreshList}
                                        />
                                    ) : (
                                        <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>File</TableCell>
                                                        <TableCell width={120}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {docs.map((d) => (
                                                        <TableRow
                                                            key={d.id}
                                                            hover
                                                            selected={d.id === selectedId}
                                                            sx={{ cursor: 'pointer' }}
                                                            onClick={() => setSelectedId(d.id)}
                                                        >
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight={650} noWrap>
                                                                    {d.filename}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                    {fmtDate(d.createdAt)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <StatusChip status={d.status} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card elevation={1} sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6" fontWeight={800}>
                                        Extracted text
                                    </Typography>

                                    {!selectedId ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Select a document from the list to view its content.
                                        </Typography>
                                    ) : null}

                                    {detailErr ? <Alert severity="error">{detailErr}</Alert> : null}

                                    {selectedId && loadingDetail ? (
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <CircularProgress size={18} />
                                            <Typography variant="body2" color="text.secondary">
                                                Loading…
                                            </Typography>
                                        </Stack>
                                    ) : null}

                                    {selectedId && detail ? (
                                        <>
                                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                                <Typography variant="subtitle1" fontWeight={800}>
                                                    {detail.filename}
                                                </Typography>
                                                <StatusChip status={detail.status} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Created: {fmtDate(detail.createdAt)}
                                                </Typography>
                                            </Stack>

                                            {detail.status === 'FAILED' && detail.failureReason ? (
                                                <Alert severity="error">Processing failed: {detail.failureReason}</Alert>
                                            ) : null}

                                            {(detail.status === 'QUEUED' || detail.status === 'PROCESSING') ? (
                                                <Alert severity="info">
                                                    Processing… this view auto-refreshes while the job runs.
                                                </Alert>
                                            ) : null}

                                            <Divider />

                                            <Box
                                                sx={{
                                                    bgcolor: 'background.default',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    p: 2,
                                                    minHeight: 240,
                                                    maxHeight: 520,
                                                    overflow: 'auto',
                                                    fontFamily:
                                                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                            >
                                                {detail.extractedText?.trim()
                                                    ? detail.extractedText
                                                    : detail.status === 'DONE'
                                                        ? 'No text was extracted (likely a scanned / image-only PDF).'
                                                        : '—'}
                                            </Box>
                                        </>
                                    ) : null}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Stack>
            </Container>
        </>
    );
}