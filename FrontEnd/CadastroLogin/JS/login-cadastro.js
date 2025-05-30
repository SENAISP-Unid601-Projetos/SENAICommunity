document.addEventListener('DOMContentLoaded', function() {
    // ========== FUNCIONALIDADES GERAIS ==========
    // Alternar tema
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            this.innerHTML = newTheme === 'dark' 
                ? '<i class="fas fa-moon"></i>' 
                : '<i class="fas fa-sun"></i>';
            
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

    // Alternar visibilidade da senha
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');
            
            input.type = input.type === 'password' ? 'text' : 'password';
            icon.classList.toggle('fa-eye-slash');
            icon.classList.toggle('fa-eye');
        });
    });

    // ========== SISTEMA DE LOGIN ==========
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            const btn = this.querySelector('button[type="submit"]');
            
            // Limpar erros anteriores
            clearErrors();
            
            // Ativar estado de loading
            btn.disabled = true;
            btn.classList.add('btn-loading');

            try {
                const response = await axios.post('http://localhost:8080/login', {
                    email: emailInput.value,
                    senha: passwordInput.value
                });

                if (response.data?.token) {
                    handleSuccessfulLogin(response.data.token, emailInput.value);
                } else {
                    throw new Error('Resposta inválida do servidor');
                }
            } catch (error) {
                handleLoginError(error, emailInput, passwordInput);
            } finally {
                btn.disabled = false;
                btn.classList.remove('btn-loading');
            }
        });
    }

    // ========== FUNÇÕES AUXILIARES ==========
    function clearErrors() {
        document.querySelectorAll('.input-error').forEach(el => {
            el.classList.remove('input-error');
        });
        
        const errorMsg = document.querySelector('.login-error');
        if (errorMsg) errorMsg.remove();
    }

    function handleSuccessfulLogin(token, email) {
        if (document.getElementById('rememberMe').checked) {
            localStorage.setItem('authToken', token);
            localStorage.setItem('userEmail', email);
        } else {
            sessionStorage.setItem('authToken', token);
        }
        window.location.href = 'pages/dashboard.html';
    }

    function handleLoginError(error, emailInput, passwordInput) {
        console.error('Erro no login:', error);
        
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        if (error.response?.status === 400 || error.response?.status === 401) {
            errorMessage = 'E-mail ou senha incorretos';
        }

        // Exibir mensagem de erro
        const errorElement = document.createElement('div');
        errorElement.className = 'login-error';
        errorElement.textContent = errorMessage;
        loginForm.insertBefore(errorElement, loginForm.lastElementChild);

        // Destacar campos com erro
        emailInput.classList.add('input-error');
        passwordInput.classList.add('input-error');
    }

    // ========== SISTEMA DE CADASTRO ==========
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.classList.add('btn-loading');

            try {
                const formData = new FormData();
                formData.append('nome', document.getElementById('nome').value);
                formData.append('email', document.getElementById('email').value);
                formData.append('senha', document.getElementById('senha').value);
                formData.append('curso', document.getElementById('curso').value);
                formData.append('periodo', document.getElementById('periodo').value);
                
                const foto = document.getElementById('foto').files[0];
                if (foto) formData.append('foto', foto);

                const response = await axios.post('http://localhost:8080/alunos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                alert('Cadastro realizado com sucesso!');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Erro no cadastro:', error);
                alert(error.response?.status === 409 
                    ? 'Este e-mail já está cadastrado!' 
                    : 'Erro ao cadastrar. Tente novamente.');
            } finally {
                btn.disabled = false;
                btn.classList.remove('btn-loading');
            }
        });
    }
});