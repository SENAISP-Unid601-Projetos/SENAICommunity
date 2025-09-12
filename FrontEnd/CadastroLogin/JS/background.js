// @ts-nocheck
// Arquivo: CadastroLogin/JS/background.js

document.addEventListener('DOMContentLoaded', function() {
    // Criar partículas de fundo
    createParticles();
    
    // Iniciar animação de gradiente
    startGradientAnimation();
    
    // Configurar tema inicial e o botão de alternância
    setInitialTheme();
    setupThemeToggle();
});

function createParticles() {
    const background = document.querySelector('.tech-background');
    if (!background) return;
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 7 + 3;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = 15 + Math.random() * 10;
        
        particle.classList.add('particle');
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        if (i % 5 === 0) {
            particle.classList.add('highlight-particle');
            particle.style.animationDuration = `${12 + Math.random() * 6}s`;
        }
        
        if (size < 4) particle.classList.add('small-particle');
        else if (size < 6) particle.classList.add('medium-particle');
        else particle.classList.add('large-particle');
        
        background.appendChild(particle);
    }
}

function startGradientAnimation() {
    const background = document.querySelector('.tech-background');
    if (background) {
        background.style.animation = 'gradientBG 15s ease infinite';
    }
}

/**
 * ✅ CORREÇÃO APLICADA AQUI ✅
 * Define o tema inicial. Agora, o padrão é sempre 'dark' se nenhum 
 * tema for encontrado no armazenamento local.
 */
function setInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Se o usuário já escolheu um tema, usa a escolha dele
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Caso contrário, define 'dark' como o tema padrão inicial
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    updateThemeIcon();
}

function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeToggleIcon = document.querySelector('.theme-toggle i');
    if (!themeToggleIcon) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        themeToggleIcon.classList.remove('fa-sun');
        themeToggleIcon.classList.add('fa-moon');
    } else {
        themeToggleIcon.classList.remove('fa-moon');
        themeToggleIcon.classList.add('fa-sun');
    }
}