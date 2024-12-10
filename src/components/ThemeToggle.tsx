'use client';

import { IconButton } from '@/once-ui/components';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <IconButton
            icon={theme === 'dark' ? 'sun' : 'moon'}
            variant="tertiary"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        />
    );
} 