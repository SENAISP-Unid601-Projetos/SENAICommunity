document.addEventListener('DOMContentLoaded', function() {
    // Criar partículas de fundo
    createParticles();
    
    // Iniciar animação de gradiente
    startGradientAnimation();
    
    // Configurar tema inicial
    setInitialTheme();
    
    // Configurar alternador de tema
    setupThemeToggle();
});

function createParticles() {
    const background = document.querySelector('.tech-background');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 7 + 3;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = 15 + Math.random() * 10;
        
        particle.classList.add('particle');
        
        // Definir tamanho e posição
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        
        // Definir animação
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        // Adicionar classe de destaque para algumas partículas
        if (i % 5 === 0) {
            particle.classList.add('highlight-particle');
            particle.style.animationDuration = `${12 + Math.random() * 6}s`;
        }
        
        // Adicionar classe de tamanho
        if (size < 4) {
            particle.classList.add('small-particle');
        } else if (size < 6) {
            particle.classList.add('medium-particle');
        } else {
            particle.classList.add('large-particle');
        }
        
        background.appendChild(particle);
    }
}

function startGradientAnimation() {
    // A animação é controlada pelo CSS, apenas verificamos se o elemento existe
    const background = document.querySelector('.tech-background');
    if (background) {
        background.style.animation = 'gradientBG 15s ease infinite';
    }
}

function setInitialTheme() {
    // Verificar preferência do usuário ou usar dark theme como padrão
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
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
    const themeToggle = document.querySelector('.theme-toggle i');
    if (!themeToggle) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        themeToggle.classList.remove('fa-sun');
        themeToggle.classList.add('fa-moon');
    } else {
        themeToggle.classList.remove('fa-moon');
        themeToggle.classList.add('fa-sun');
    }
}   