document.addEventListener('DOMContentLoaded', function() {
    // Alternar entre mostrar/esconder senha
    document.querySelectorAll('.toggle-password').forEach(button => {
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
    });
    
    // Força da senha (cadastro)
    const passwordInput = document.getElementById('registerPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strengthBar = document.querySelector('.strength-bar');
            
            let strength = 0;
            
            // Verificar requisitos
            if (password.length >= 8) strength += 1;
            if (/[A-Z]/.test(password)) strength += 1;
            if (/\d/.test(password)) strength += 1;
            if (/[^A-Za-z0-9]/.test(password)) strength += 1;
            
            // Atualizar barra de força
            strengthBar.dataset.strength = Math.min(strength, 3);
            strengthBar.style.width = `${(strength / 3) * 100}%`;
            
            // Atualizar cor
            if (strength === 0) {
                strengthBar.style.backgroundColor = '#ff4444';
            } else if (strength === 1) {
                strengthBar.style.backgroundColor = '#ffbb33';
            } else {
                strengthBar.style.backgroundColor = '#00C851';
            }
        });
    }

    // Mostrar nome do arquivo selecionado
    const fotoInput = document.getElementById('foto');
    if (fotoInput) {
        fotoInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Foto de perfil (opcional)';
            document.getElementById('file-name').textContent = fileName;
        });
    }
    
    // Alternador de tema
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Atualizar ícone
            this.innerHTML = newTheme === 'dark' 
                ? '<i class="fas fa-moon"></i>' 
                : '<i class="fas fa-sun"></i>';
            
            // Atualizar background
            if (typeof updateTechBackgroundTheme === 'function') {
                updateTechBackgroundTheme(newTheme);
            }
        });
        
        // Carregar tema salvo
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    }
    
    // Validação de formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const originalText = btnText.textContent;
            
            btn.disabled = true;
            btnText.textContent = 'Autenticando...';
            
            setTimeout(() => {
                window.location.href = 'pages/dashboard.html';
            }, 1500);
        });
    }
    
    // Cadastro de novo usuário
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validar senhas
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmarSenha').value;
            
            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }
            
            // Validar termos
            if (!document.getElementById('terms').checked) {
                alert('Você deve aceitar os termos e condições!');
                return;
            }
            
            // Coletar dados do formulário
            const formData = new FormData();
            formData.append('nome', document.getElementById('nome').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('senha', senha);
            formData.append('curso', document.getElementById('curso').value);
            formData.append('periodo', document.getElementById('periodo').value);
            
            // Adicionar foto se existir
            const foto = document.getElementById('foto').files[0];
            if (foto) {
                formData.append('foto', foto);
            }
            
            // Configurar botão de loading
            const btn = this.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const originalText = btnText.textContent;
            
            btn.disabled = true;
            btnText.textContent = 'Cadastrando...';
            
            try {
                // Enviar para o back-end
                const response = await axios.post('http://localhost:8080/alunos', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                // Sucesso - redirecionar para login
                alert('Cadastro realizado com sucesso!');
                window.location.href = 'login.html';
                
            } catch (error) {
                console.error('Erro no cadastro:', error);
                
                // Tratar erros específicos
                let errorMessage = 'Erro ao cadastrar. Tente novamente.';
                if (error.response) {
                    if (error.response.status === 409) {
                        errorMessage = 'Este e-mail já está cadastrado!';
                    } else if (error.response.status === 400) {
                        errorMessage = 'Preencha todos os campos corretamente.';
                    }
                }
                
                alert(errorMessage);
                
                // Restaurar botão
                btn.disabled = false;
                btnText.textContent = originalText;
            }
        });
    }
});