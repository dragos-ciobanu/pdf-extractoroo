import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';

type TopBarProps = {
    title: string;
    onRefresh?: () => void;
    onLogout?: () => void;
    showRefresh?: boolean;
    showLogout?: boolean;
};

export function TopBar({
                           title,
                           onRefresh,
                           onLogout,
                           showRefresh = false,
                           showLogout = false,
                       }: TopBarProps) {
    return (
        <AppBar position="static" elevation={0}>
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>

                {showRefresh && (
                    <IconButton color="inherit" onClick={onRefresh} aria-label="refresh">
                        <RefreshIcon />
                    </IconButton>
                )}

                {showLogout && (
                    <IconButton color="inherit" onClick={onLogout} aria-label="logout">
                        <LogoutIcon />
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
    );
}