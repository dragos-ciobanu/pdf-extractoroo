import React from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';

type Props = {
    children: React.ReactNode;
};

type State = {
    error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = {};

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('UI ErrorBoundary caught:', error, info);
    }

    private reset = () => {
        this.setState({ error: undefined });
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
                <Card elevation={1} sx={{ borderRadius: 3, maxWidth: 720, width: '100%' }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <Typography variant="h5" fontWeight={800}>
                                Something went wrong
                            </Typography>

                            <Alert severity="error">
                                {this.state.error.message || 'Unexpected UI error.'}
                            </Alert>

                            <Typography variant="body2" color="text.secondary">
                                You can try resetting the page state. If it keeps happening, check the console logs.
                            </Typography>

                            <Stack direction="row" spacing={2}>
                                <Button variant="contained" onClick={this.reset}>
                                    Reset view
                                </Button>
                                <Button variant="outlined" onClick={() => window.location.reload()}>
                                    Reload page
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        );
    }
}