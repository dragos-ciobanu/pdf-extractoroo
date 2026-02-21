import { useCallback, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { api } from '../api';
import { setToken } from '../auth';
import { TopBar } from '../components/TopBar';

type LoginPageProps = {
    onLoggedIn: () => void;
};

export function LoginPage({ onLoggedIn }: LoginPageProps) {
    const [username, setUsername] = useState<string>('demo');
    const [password, setPassword] = useState<string>('demo1234');
    const [loading, setLoading] = useState<boolean>(false);
    const [err, setErr] = useState<string>('');

    const submit = useCallback(async (): Promise<void> => {
        setErr('');
        setLoading(true);
        try {
            const res = await api.login(username, password);
            setToken(res.accessToken);
            onLoggedIn();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Login failed';
            setErr(msg);
        } finally {
            setLoading(false);
        }
    }, [onLoggedIn, password, username]);

    return (
        <>
            <TopBar title="PDF → Text Extractor" />

            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Card elevation={1} sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <Typography variant="h5" fontWeight={800}>
                                Sign in
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Use the seeded account (e.g. <b>demo / demo1234</b>).
                            </Typography>

                            {err ? <Alert severity="error">{err}</Alert> : null}

                            <TextField
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                fullWidth
                            />

                            <TextField
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                fullWidth
                            />

                            <Button
                                variant="contained"
                                size="large"
                                onClick={submit}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={18} /> : undefined}
                            >
                                {loading ? 'Signing in…' : 'Sign in'}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </>
    );
}