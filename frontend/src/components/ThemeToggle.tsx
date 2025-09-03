import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';

export default function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const initial = savedTheme || systemPref;
        setTheme(initial);
        document.documentElement.setAttribute('data-bs-theme', initial);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.setAttribute('data-bs-theme', next);
        localStorage.setItem('theme', next);
    };

    return (
        <Button
            variant={theme === 'light' ? 'outline-dark' : 'outline-secondary'}
            size="sm"
            className="d-flex align-items-center justify-content-center"
            style={{ height: '38px', width: '38px'}}
            onClick={toggleTheme}
            aria-label="Toggle theme"
        >
            <i className={`bi ${theme === 'light' ? 'bi-moon' : 'bi-sun'}`} />
        </Button>
    );
}
