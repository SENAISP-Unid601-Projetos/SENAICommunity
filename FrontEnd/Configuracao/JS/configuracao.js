document.addEventListener('DOMContentLoaded', () => {
    // 1. Aplica as configurações assim que a página carrega
    aplicarAcessibilidade();
    
    // 2. Inicializa os botões visuais (marca o que está ativo)
    initSettingsUI();
    
    // 3. Configura o botão de Sair
    const logoutBtn = document.querySelector('.logout-action-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair da conta?')) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
});

// --- FUNÇÃO PRINCIPAL QUE FAZ A MÁGICA ACONTECER ---
function aplicarAcessibilidade() {
    const html = document.documentElement;

    // 1. Tamanho da Fonte
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    html.setAttribute('data-font-size', savedFontSize);

    // 2. Redução de Movimento
    if (localStorage.getItem('reduceMotion') === 'true') {
        document.body.classList.add('reduce-motion');
    } else {
        document.body.classList.remove('reduce-motion');
    }

    // 3. Alto Contraste
    if (localStorage.getItem('highContrast') === 'true') {
        html.classList.add('acessibilidade-alto-contraste');
    } else {
        html.classList.remove('acessibilidade-alto-contraste');
    }

    // 4. Fonte Legível
    if (localStorage.getItem('readableFont') === 'true') {
        html.classList.add('acessibilidade-fonte-legivel');
    } else {
        html.classList.remove('acessibilidade-fonte-legivel');
    }

    // 5. Destacar Links
    if (localStorage.getItem('highlightLinks') === 'true') {
        html.classList.add('acessibilidade-destacar-links');
    } else {
        html.classList.remove('acessibilidade-destacar-links');
    }
}

// --- CONTROLE DOS BOTÕES ---

function initSettingsUI() {
    const currentSize = localStorage.getItem('fontSize') || 'medium';
    updateFontButtonsUI(currentSize);

    setupToggle('reduceMotion', 'reduce-motion-toggle');
    setupToggle('highContrast', 'high-contrast-toggle');
    setupToggle('readableFont', 'readable-font-toggle');
    setupToggle('highlightLinks', 'highlight-links-toggle');
}

function setupToggle(key, elementId) {
    const toggle = document.getElementById(elementId);
    if (toggle) {
        toggle.checked = localStorage.getItem(key) === 'true';
        toggle.addEventListener('change', (e) => {
            localStorage.setItem(key, e.target.checked);
            aplicarAcessibilidade(); // Aplica na hora!
        });
    }
}

// Essa função precisa ser global (window) pois é chamada no onclick do HTML
window.updateFontSize = (size) => {
    localStorage.setItem('fontSize', size);
    updateFontButtonsUI(size);
    aplicarAcessibilidade(); // Aplica na hora!
};

function updateFontButtonsUI(size) {
    document.querySelectorAll('.btn-font').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.btn-font[onclick*="'${size}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
}