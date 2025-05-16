// background.js - Código atualizado e testado
document.addEventListener('DOMContentLoaded', function() {
    const techBackground = document.querySelector('.tech-background');
    
    // Verifica se o elemento existe
    if (!techBackground) return;
    
    // Cores baseadas no tema
    const getParticleColor = () => {
        return document.documentElement.getAttribute('data-theme') === 'light' 
            ? 'rgba(0, 0, 0, 0.05)' 
            : 'rgba(255, 255, 255, 0.05)';
    };
    
    const getCircuitColor = () => {
        return document.documentElement.getAttribute('data-theme') === 'light' 
            ? 'rgba(207, 34, 46, 0.2)' 
            : 'rgba(248, 81, 73, 0.1)';
    };
    
    // Cria elementos de fundo
    function createTechElements() {
        techBackground.innerHTML = '';
        
        // Partículas neutras
        for (let i = 0; i < 40; i++) {
            createParticle();
        }
        
        // Circuitos
        for (let i = 0; i < 12; i++) {
            createCircuit();
        }
        
        // Destaques vermelhos
        for (let i = 0; i < 8; i++) {
            createHighlight();
        }
    }
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'tech-particle';
        
        const size = Math.random() * 4 + 1;
        Object.assign(particle.style, {
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 15 + 10}s`,
            backgroundColor: getParticleColor()
        });
        
        techBackground.appendChild(particle);
    }
    
    function createCircuit() {
        const circuit = document.createElement('div');
        circuit.className = 'tech-circuit';
        
        const size = Math.random() * 200 + 50;
        Object.assign(circuit.style, {
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.2 + 0.05,
            animationDelay: `${Math.random() * 3}s`,
            borderColor: getCircuitColor()
        });
        
        techBackground.appendChild(circuit);
    }
    
    function createHighlight() {
        const highlight = document.createElement('div');
        highlight.className = 'tech-highlight';
        
        Object.assign(highlight.style, {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 12 + 8}s`,
            width: `${Math.random() * 3 + 1}px`,
            height: highlight.style.width
        });
        
        techBackground.appendChild(highlight);
    }
    
    // Inicializa o fundo
    createTechElements();
    
    // Atualiza ao redimensionar
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(createTechElements, 200);
    });
    
    // Atualiza o tema
    window.updateTechBackgroundTheme = function(theme) {
        const particles = document.querySelectorAll('.tech-particle');
        const circuits = document.querySelectorAll('.tech-circuit');
        
        const particleColor = theme === 'light' 
            ? 'rgba(0, 0, 0, 0.05)' 
            : 'rgba(255, 255, 255, 0.05)';
        
        const circuitColor = theme === 'light' 
            ? 'rgba(207, 34, 46, 0.2)' 
            : 'rgba(248, 81, 73, 0.1)';
        
        particles.forEach(p => p.style.backgroundColor = particleColor);
        circuits.forEach(c => c.style.borderColor = circuitColor);
    };
});