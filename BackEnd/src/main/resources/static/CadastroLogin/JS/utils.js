// @ts-nocheck
// Arquivo: CadastroLogin/JS/utils.js

/**
 * Configura os botões de "mostrar/esconder" senha em toda a aplicação.
 * Esta função deve ser a única fonte para esta funcionalidade.
 */
function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        // Previne a adição de múltiplos listeners ao mesmo botão
        if (button.dataset.listenerAttached) return;

        button.addEventListener('click', function() {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });

        // Marca o botão para não adicionar o evento novamente
        button.dataset.listenerAttached = 'true';
    });
}

// O DOMContentLoaded foi removido daqui para ser chamado 
// especificamente nos scripts de cada página (login.js, cadastro.js).