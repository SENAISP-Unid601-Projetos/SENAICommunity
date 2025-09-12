document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    setupThemeToggle();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const senha = document.getElementById('loginPassword').value;

            // Seleciona o botão
            const btn = this.querySelector('button[type="submit"]');
            
            // --- MODIFICAÇÃO PARA O SPINNER ---
            // Ativa o estado de carregamento adicionando a classe .loading
            btn.disabled = true;
            btn.classList.add('loading');

            try {
                // Envia para o endpoint certo
                const response = await axios.post('http://localhost:8080/autenticacao/login', {
                    email: email,
                    senha: senha
                });

                // Se der certo, pega o token
                const token = response.data.token;

                // Salva no localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('emailLogado', email);

                // --- MENSAGEM DE SUCESSO ELEGANTE ---
                await Swal.fire({
                    icon: 'success',
                    title: 'Login realizado!',
                    text: 'Você será redirecionado em breve.',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Redireciona pro dashboard ou outra página
                window.location.href = 'principal.html';

            } catch (error) {
                console.error('Erro ao fazer login:', error);

                let errorTitle = 'Erro ao fazer login';
                let errorMessage = 'Verifique suas credenciais e tente novamente.';

                if (error.response) {
                    // Erros específicos vindos do servidor
                    if (error.response.status === 401) {
                        errorTitle = 'Acesso Negado';
                        errorMessage = 'Email ou senha inválidos.';
                    } else if (error.response.status === 400) {
                        errorTitle = 'Dados Inválidos';
                        errorMessage = 'Por favor, preencha todos os campos.';
                    }
                } else if (error.request) {
                    // Erro de rede (CORS, servidor offline, etc.)
                    errorTitle = 'Erro de Conexão';
                    errorMessage = 'Não foi possível se conectar ao servidor. Verifique sua rede.';
                }
                
                // --- MENSAGEM DE ERRO ELEGANTE ---
                Swal.fire({
                    icon: 'error',
                    title: errorTitle,
                    text: errorMessage,
                    confirmButtonColor: '#3085d6'
                });

            } finally {
                // --- MODIFICAÇÃO PARA O SPINNER ---
                // Garante que o estado de carregamento seja removido no final
                btn.disabled = false;
                btn.classList.remove('loading');
            }
        });
    }
});

// Supondo que você tenha estas funções em algum lugar
function setupPasswordToggles() { /* ... */ }
function setupThemeToggle() { /* ... */ }