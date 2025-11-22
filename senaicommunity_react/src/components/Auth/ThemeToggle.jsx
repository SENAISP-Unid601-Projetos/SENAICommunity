import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="theme-toggle" onClick={toggleTheme}>
            <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
        </div>
    );
};

export default ThemeToggle;