import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

type EmptyStateProps = {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
    return (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
            <CardContent>
                <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ py: 2 }}>
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'action.hover',
                        }}
                    >
                        <UploadFileIcon />
                    </Box>

                    <Typography variant="h6" fontWeight={800}>
                        {title}
                    </Typography>

                    {subtitle ? (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    ) : null}

                    {actionLabel && onAction ? (
                        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
                            {actionLabel}
                        </Button>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
}