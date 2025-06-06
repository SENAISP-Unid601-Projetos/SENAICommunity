document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    setupThemeToggle();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = this.querySelector('input[type="email"]').value;
            const senha = document.getElementById('loginPassword').value;

            const btn = this.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const originalText = btnText.textContent;

            btn.disabled = true;
            btnText.textContent = 'Autenticando...';

            try {
                // Envia para o endpoint certo
                const response = await axios.post('http://localhost:8080/autenticacao/login', {
                    email: email,
                    senha: senha
                });

                // Se der certo, pega o token
                const token = response.data.token;

                // Salva no localStorage (você pode salvar o token e o email, ou buscar dados depois)
                localStorage.setItem('token', token);
                localStorage.setItem('emailLogado', email);

                alert('Login realizado com sucesso!');

                // Redireciona pro dashboard ou outra página
                window.location.href = 'pages/dashboard.html';

            } catch (error) {
                console.error('Erro ao fazer login:', error);

                let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';

                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = 'Email ou senha inválidos.';
                    } else if (error.response.status === 400) {
                        errorMessage = 'Preencha todos os campos.';
                    }
                }

                alert(errorMessage);

                btn.disabled = false;
                btnText.textContent = originalText;
            }
        });
    }
});
