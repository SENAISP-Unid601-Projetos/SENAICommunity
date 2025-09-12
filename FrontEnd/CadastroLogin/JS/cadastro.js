
// FUNÇÕES DE SETUP (Definições)
// ===================================================================

/**
 * Adiciona a máscara DD/MM/AAAA ao campo de data de nascimento.
 */
function setupDateMask() {
    const dataNascimentoInput = document.getElementById('dataNascimento');
    if (dataNascimentoInput) {
        const dateMask = IMask(dataNascimentoInput, {
            mask: '00/00/0000',
            lazy: false,
            placeholderChar: '_'
        });
    }
}

/**
 * Configura o medidor de força da senha em tempo real.
 */
function setupPasswordStrengthMeter() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strength-text');

    if (!passwordInput || !strengthBar || !strengthText) return;

    function checkPasswordStrength(password) {
        let score = 0;
        if (!password) return -1;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score < 3) return 0;
        if (score < 5) return 2;
        return 3;
    }

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strengthLevel = checkPasswordStrength(password);
        
        if (strengthLevel === -1) {
            strengthBar.setAttribute('data-strength', '0');
            strengthText.textContent = '';
            return;
        }
        
        strengthBar.setAttribute('data-strength', strengthLevel);
        const strengthMap = { 0: 'Senha Fraca', 1: 'Senha Fraca', 2: 'Senha Média', 3: 'Senha Forte' };
        strengthText.textContent = strengthMap[strengthLevel] || '';
    });
}

/**
 * Configura a área de upload de imagem com drag-drop e preview.
 */
function setupImageUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fotoInput = document.getElementById('foto');
    const imagePreview = document.getElementById('image-preview');

    if (!dropZone || !fotoInput || !imagePreview) return;

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            Swal.fire({ icon: 'error', title: 'Arquivo Inválido', text: 'Por favor, selecione um arquivo de imagem.' });
            fotoInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('image-preview-hidden');
            dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fotoInput.files = dataTransfer.files;
    }

    dropZone.addEventListener('click', () => fotoInput.click());
    fotoInput.addEventListener('change', () => handleFile(fotoInput.files[0]));
    
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });

    imagePreview.addEventListener('click', () => {
        imagePreview.classList.add('image-preview-hidden');
        dropZone.style.display = 'flex';
        fotoInput.value = '';
    });
}

/**
 * Configura a lógica de submissão do formulário de cadastro.
 */
function setupFormSubmission() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // ... (validações de senha e termos) ...

        const formData = new FormData(this);
        const dataNascimentoValor = formData.get('dataNascimento');
        if (dataNascimentoValor) {
            const [dia, mes, ano] = dataNascimentoValor.split('/');
            if (dia && mes && ano && dia.length === 2 && mes.length === 2 && ano.length === 4) {
                 const dataFormatada = `${ano}-${mes}-${dia}`;
                 formData.set('dataNascimento', dataFormatada);
            } else {
                 Swal.fire({ icon: 'error', title: 'Data Inválida', text: 'Por favor, insira uma data de nascimento válida.' });
                 return;
            }
        }
        
        const btn = this.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.classList.add('loading');

        try {
            await axios.post('http://localhost:8080/cadastro/alunos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            await Swal.fire({
                icon: 'success', title: 'Cadastro realizado!',
                text: 'Você será redirecionado para a tela de login.',
                timer: 2500, showConfirmButton: false, allowOutsideClick: false
            });
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro no cadastro:', error);
            let errorMessage = 'Erro ao cadastrar. Tente novamente mais tarde.';
            if (error.response) {
                if (error.response.status === 409) errorMessage = 'Este e-mail já está cadastrado!';
                else if (error.response.status === 400) errorMessage = 'Dados inválidos. Verifique todos os campos.';
            }
            Swal.fire({ icon: 'error', title: 'Erro no Cadastro', text: errorMessage });
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    });
}

/**
 * Configura os botões de "mostrar/esconder" senha.
 */
function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

/**
 * ✅ CORREÇÃO APLICADA AQUI ✅
 * Configura o botão de troca de tema (light/dark).
 */
function setupThemeToggle() {
    const themeToggleButton = document.querySelector('.theme-toggle');
    const rootElement = document.documentElement;
    if (!themeToggleButton) return;

    const icon = themeToggleButton.querySelector('i');
    const THEME_KEY = 'user-theme';

    function applyTheme(theme) {
        const isLight = theme === 'light';
        rootElement.setAttribute('data-theme', isLight ? 'light' : 'dark'); // Usa dark como padrão explícito
        if (icon) {
            icon.classList.toggle('fa-sun', isLight);
            icon.classList.toggle('fa-moon', !isLight);
        }
        if (isLight) {
            localStorage.setItem(THEME_KEY, 'light');
        } else {
            localStorage.removeItem(THEME_KEY);
        }
    }

    themeToggleButton.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });

    // Aplica o tema salvo no carregamento inicial
    applyTheme(localStorage.getItem(THEME_KEY));
}


// ===================================================================
// PONTO DE ENTRADA PRINCIPAL
// ===================================================================
/**
 * ✅ ESTRUTURA CORRIGIDA ✅
 * Este é o único 'DOMContentLoaded' que chama todas as outras funções,
 * garantindo que nenhum evento seja registrado duas vezes.
 */
document.addEventListener('DOMContentLoaded', function() {
    setupDateMask();
    setupPasswordStrengthMeter();
    setupImageUpload();
    setupFormSubmission();
    setupPasswordToggles();
    setupThemeToggle(); // Chamado uma única vez
});