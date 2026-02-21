import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getToken } from './auth';
import { LoginPage } from './pages/LoginPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { onAuthRequired } from './api';

export default function App() {
    const [token, setToken] = useState<string>(() => getToken());

    useEffect(() => {
        return onAuthRequired(() => setToken(''));
    }, []);

    return (
        <ErrorBoundary>
            {token ? (
                <DocumentsPage onLoggedOut={() => setToken('')} />
            ) : (
                <LoginPage onLoggedIn={() => setToken(getToken())} />
            )}
        </ErrorBoundary>
    );
}