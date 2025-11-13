// @ts-nocheck
// Arquivo: CadastroLogin/JS/cadastro.js

/**
 * Adiciona a máscara DD/MM/AAAA ao campo de data de nascimento.
 */
function setupDateMask() {
    const dataNascimentoInput = document.getElementById('dataNascimento');
    if (dataNascimentoInput) {
        IMask(dataNascimentoInput, {
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
        
        const strengthMap = { 0: 'Senha Fraca', 1: 'Senha Fraca', 2: 'Senha Média', 3: 'Senha Forte' };

        if (strengthLevel === -1) {
            strengthBar.setAttribute('data-strength', '0');
            strengthText.textContent = '';
            return;
        }
        
        strengthBar.setAttribute('data-strength', strengthLevel);
        strengthText.textContent = strengthMap[strengthLevel] || '';
    });
}

/**
 * Configura a área de upload de imagem com drag-drop e preview,
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
    
    fotoInput.addEventListener('change', () => {
        if (fotoInput.files.length > 0) {
            handleFile(fotoInput.files[0]);
        }
    });
    
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
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

        const formData = new FormData(this);
        const dataNascimentoValor = formData.get('dataNascimento');

        if (!dataNascimentoValor) {
            Swal.fire({ icon: 'error', title: 'Campo Obrigatório', text: 'Por favor, insira sua data de nascimento.' });
            return; // Impede o envio
        }

        if (dataNascimentoValor.includes('_')) {
             Swal.fire({ icon: 'error', title: 'Data Incompleta', text: 'Por favor, preencha a data de nascimento (DD/MM/AAAA).' });
             return; // Impede o envio
        }
        
        const [dia, mes, ano] = dataNascimentoValor.split('/');
        if (dia && mes && ano && dia.length === 2 && mes.length === 2 && ano.length === 4) {
             const dataFormatada = `${ano}-${mes}-${dia}`;
             formData.set('dataNascimento', dataFormatada);
        } else {
             Swal.fire({ icon: 'error', title: 'Data Inválida', text: 'Por favor, insira uma data de nascimento válida (DD/MM/AAAA).' });
             return; 
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
           if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.response) {
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
 * Ponto de entrada principal para a página de cadastro.
 */
document.addEventListener('DOMContentLoaded', function() {
    setupDateMask();
    setupPasswordStrengthMeter();
    setupImageUpload();
    setupFormSubmission();
    
    if (typeof setupPasswordToggles === 'function') {
        setupPasswordToggles(); 
    }
    
});
