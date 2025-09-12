document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    setupThemeToggle();

    const loginForm = document.getElementById('loginForm');
    const backendUrl = 'http://localhost:8080';
    const googleClientId = '1055449517512-gq7f7doogo5e8vmaq84vgrabsk1q5f5k.apps.googleusercontent.com'; // Use seu próprio Client ID
    
    // Inicializa o Google Sign-In SDK
    function initGoogle() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false, // Previna seleção automática na primeira vez
            });
            // Renderiza o botão no seu elemento div
            google.accounts.id.renderButton(
                document.getElementById('google-signin-button'),
                { theme: 'outline', size: 'large', text: 'signin_with', width: 388 } // Customiza a aparência
            );
        }
    }
    initGoogle();


    // Função de callback que recebe o token do Google
    async function handleGoogleCredentialResponse(response) {
        const btn = document.getElementById('google-signin-button');
        if (!btn) return;
        
        // --- MODIFICAÇÃO PARA O SPINNER ---
        btn.disabled = true;
        btn.classList.add('loading');
        
        try {
            const backendResponse = await axios.post(`${backendUrl}/autenticacao/login/google`, {
                token: response.credential
            });
            
            const token = backendResponse.data.token;
            localStorage.setItem('token', token);
            
            await Swal.fire({
                icon: 'success',
                title: 'Login com Google realizado!',
                text: 'Você será redirecionado em breve.',
                timer: 2000,
                showConfirmButton: false
            });
            
            window.location.href = 'principal.html';
            
        } catch (error) {
            console.error('Erro ao fazer login com Google:', error.response?.data || error.message);
            Swal.fire({
                icon: 'error',
                title: 'Erro no Login com Google',
                text: 'Não foi possível autenticar sua conta. Tente novamente.',
                confirmButtonColor: '#3085d6'
            });
            
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }
    
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
                const response = await axios.post(`${backendUrl}/autenticacao/login`, {
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