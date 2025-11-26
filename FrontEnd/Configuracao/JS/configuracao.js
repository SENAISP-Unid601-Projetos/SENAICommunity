document.addEventListener('DOMContentLoaded', () => {
    // 1. Aplica as configurações assim que a página carrega
    if (window.aplicarAcessibilidadeGlobal) {
        window.aplicarAcessibilidadeGlobal();
    }

    // 2. Inicializa os botões visuais da página
    initSettingsUI();

    // 3. Inicializa o Menu Mobile (Sidebar) <-- NOVO
    initSidebarMobile();

    // 4. Configura o botão de Sair (Logout)
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

// --- NOVO: FUNÇÃO PARA O MENU MOBILE ---
function initSidebarMobile() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    // Fecha ao clicar no fundo escuro
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
}

// --- CONTROLE DOS BOTÕES DE ACESSIBILIDADE ---

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
            if (window.aplicarAcessibilidadeGlobal) {
                window.aplicarAcessibilidadeGlobal();
            }
        });
    }
}

window.updateFontSize = (size) => {
    localStorage.setItem('fontSize', size);
    updateFontButtonsUI(size);
    if (window.aplicarAcessibilidadeGlobal) {
        window.aplicarAcessibilidadeGlobal();
    }
};

function updateFontButtonsUI(size) {
    document.querySelectorAll('.btn-font').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.btn-font[onclick*="'${size}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
}