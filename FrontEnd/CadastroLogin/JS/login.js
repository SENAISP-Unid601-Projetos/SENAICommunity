// @ts-nocheck
// Arquivo: CadastroLogin/JS/login.js

document.addEventListener('DOMContentLoaded', function() {
    // Chama a função de alternância de senha definida em utils.js
    // A configuração do tema já é gerenciada por background.js
    setupPasswordToggles();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const senha = document.getElementById('loginPassword').value;
            const btn = this.querySelector('button[type="submit"]');
            
            btn.disabled = true;
            btn.classList.add('loading');

            try {
                const response = await axios.post('http://localhost:8080/autenticacao/login', {
                    email: email,
                    senha: senha
                });

                const token = response.data.token;
                localStorage.setItem('token', token);
                localStorage.setItem('emailLogado', email);

                await Swal.fire({
                    icon: 'success',
                    title: 'Login realizado!',
                    text: 'Você será redirecionado em breve.',
                    timer: 2000,
                    showConfirmButton: false
                });

                window.location.href = 'principal.html';

            } catch (error) {
                console.error('Erro ao fazer login:', error);

                let errorTitle = 'Erro ao fazer login';
                let errorMessage = 'Verifique suas credenciais e tente novamente.';

                if (error.response) {
                    if (error.response.status === 401) {
                        errorTitle = 'Acesso Negado';
                        errorMessage = 'Email ou senha inválidos.';
                    } else if (error.response.status === 400) {
                        errorTitle = 'Dados Inválidos';
                        errorMessage = 'Por favor, preencha todos os campos.';
                    }
                } else if (error.request) {
                    errorTitle = 'Erro de Conexão';
                    errorMessage = 'Não foi possível se conectar ao servidor. Verifique sua rede.';
                }
                
                Swal.fire({
                    icon: 'error',
                    title: errorTitle,
                    text: errorMessage,
                    confirmButtonColor: '#3085d6'
                });

            } finally {
                btn.disabled = false;
                btn.classList.remove('loading');
            }
        });
    }
});