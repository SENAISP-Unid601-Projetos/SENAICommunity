document.addEventListener('DOMContentLoaded', () => {
    // 1. Aplica as configurações assim que a página carrega (puxando do global)
    if (window.aplicarAcessibilidadeGlobal) {
        window.aplicarAcessibilidadeGlobal();
    }

    // 2. Inicializa os botões visuais (marca o que está ativo e cria os eventos)
    initSettingsUI();

    // 3. Configura o botão de Sair (Logout)
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

// --- CONTROLE DOS BOTÕES ---

function initSettingsUI() {
    // Verifica o tamanho da fonte atual
    const currentSize = localStorage.getItem('fontSize') || 'medium';
    updateFontButtonsUI(currentSize);

    // Liga cada botão (Switch) à sua função
    setupToggle('reduceMotion', 'reduce-motion-toggle');
    setupToggle('highContrast', 'high-contrast-toggle');
    setupToggle('readableFont', 'readable-font-toggle');
    setupToggle('highlightLinks', 'highlight-links-toggle');
}

function setupToggle(key, elementId) {
    const toggle = document.getElementById(elementId);
    if (toggle) {
        // 1. Marca o checkbox se já estiver salvo como 'true'
        toggle.checked = localStorage.getItem(key) === 'true';

        // 2. Adiciona o evento de clique
        toggle.addEventListener('change', (e) => {
            // Salva a nova preferência no navegador
            localStorage.setItem(key, e.target.checked);
            
            // Chama a função GLOBAL (que está no principal.js) para mudar a cor/estilo na hora
            if (window.aplicarAcessibilidadeGlobal) {
                window.aplicarAcessibilidadeGlobal();
            } else {
                console.error("Função global de acessibilidade não encontrada!");
            }
        });
    }
}

// Essa função precisa ser global (window) pois é chamada no onclick do HTML (botões A A A)
window.updateFontSize = (size) => {
    localStorage.setItem('fontSize', size);
    updateFontButtonsUI(size);
    
    // Chama a função GLOBAL para aplicar a mudança
    if (window.aplicarAcessibilidadeGlobal) {
        window.aplicarAcessibilidadeGlobal();
    }
};

function updateFontButtonsUI(size) {
    document.querySelectorAll('.btn-font').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.btn-font[onclick*="'${size}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
}