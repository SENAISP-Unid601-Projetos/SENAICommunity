/* =================================================================
   LÓGICA DE CONFIGURAÇÕES (configuracao.js)
   ================================================================= */

// 1. Funções Globais (Disponíveis para o HTML)

window.updateFontSize = function(size) {
    localStorage.setItem('fontSize', size);
    updateFontButtonsUI(size);
    if (window.aplicarAcessibilidadeGlobal) {
        window.aplicarAcessibilidadeGlobal();
    }
};

window.abrirModalExclusao = function() {
    const modal = document.getElementById('delete-account-modal');
    const passwordInput = document.getElementById('delete-password');
    if (modal) {
        modal.style.display = 'flex';
        if (passwordInput) {
            passwordInput.value = '';
            setTimeout(() => passwordInput.focus(), 100);
        }
    }
};

window.fecharModalExclusao = function() {
    const modal = document.getElementById('delete-account-modal');
    if (modal) modal.style.display = 'none';
};

window.togglePasswordVisibility = function(fieldId) {
    const input = document.getElementById(fieldId);
    const icon = input.nextElementSibling;
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
};

// 2. Funções Auxiliares Internas

function updateFontButtonsUI(size) {
    document.querySelectorAll('.btn-font').forEach(btn => btn.classList.remove('active'));
    // Seleciona o botão que chama a função com o tamanho específico
    const activeBtn = document.querySelector(`.btn-font[onclick*="'${size}'"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function setupToggle(key, elementId) {
    const toggle = document.getElementById(elementId);
    if (toggle) {
        // Carrega estado salvo ou false
        toggle.checked = localStorage.getItem(key) === 'true';
        
        toggle.addEventListener('change', (e) => {
            localStorage.setItem(key, e.target.checked);
            // Aplica imediatamente
            if (window.aplicarAcessibilidadeGlobal) {
                window.aplicarAcessibilidadeGlobal();
            }
        });
    }
}

function initSettingsUI() {
    const currentSize = localStorage.getItem('fontSize') || 'medium';
    updateFontButtonsUI(currentSize);

    setupToggle('reduceMotion', 'reduce-motion-toggle');
    setupToggle('highContrast', 'high-contrast-toggle');
    setupToggle('readableFont', 'readable-font-toggle');
    setupToggle('highlightLinks', 'highlight-links-toggle');
}

function initSidebarMobile() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar) {
        // Remove listeners antigos para evitar duplicação (clone)
        const newToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newToggle, menuToggle);

        newToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        });
    }
}

// Lógica de Exclusão de Conta (Backend)
async function handleAccountDeletion(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('delete-password');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const originalText = confirmBtn.innerHTML;
    
    // Feedback Visual
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

    try {
        // Recupera dados do usuário do localStorage (salvo no login)
        const userJson = localStorage.getItem('user'); // Ou use window.currentUser se estiver disponível
        let email = null;
        
        if (userJson) {
            const user = JSON.parse(userJson);
            email = user.email;
        } else if (window.currentUser) {
            email = window.currentUser.email;
        }

        if (!email) throw new Error("Usuário não identificado. Faça login novamente.");

        // 1. Verifica a senha fazendo uma requisição de login
        await axios.post(`${window.backendUrl}/autenticacao/login`, {
            email: email,
            senha: passwordInput.value
        });

        // 2. Se passou do login, deleta a conta
        confirmBtn.innerHTML = '<i class="fas fa-trash"></i> Excluindo...';
        await axios.delete(`${window.backendUrl}/usuarios/me`);

        alert("Sua conta foi excluída com sucesso.");
        localStorage.clear();
        window.location.href = 'login.html';

    } catch (error) {
        console.error(error);
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
        
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            alert("Senha incorreta.");
            passwordInput.value = '';
            passwordInput.focus();
        } else {
            alert("Erro ao excluir conta: " + (error.message || "Tente novamente."));
        }
    }
}

// 3. Inicialização (DOMContentLoaded)

document.addEventListener('DOMContentLoaded', () => {
    // Aplica acessibilidade se já estiver carregado
    if (window.aplicarAcessibilidadeGlobal) {
        window.aplicarAcessibilidadeGlobal();
    }

    // Inicializa UI
    initSettingsUI();
    initSidebarMobile();

    // Listener do botão de Logout normal (fora do modal)
    const logoutBtnAction = document.getElementById('logout-btn-action');
    if (logoutBtnAction) {
        logoutBtnAction.addEventListener('click', () => {
            if(confirm("Deseja realmente sair?")) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        });
    }

    // Listener do Formulário de Exclusão (dentro do modal)
    const deleteForm = document.getElementById('delete-account-form');
    if (deleteForm) {
        deleteForm.addEventListener('submit', handleAccountDeletion);
    }
});