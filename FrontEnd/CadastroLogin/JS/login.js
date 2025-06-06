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
                const response = await axios.post('http://localhost:8080/login', {
                    email: email,
                    senha: senha
                });

                // Se der certo, salva no localStorage (pode ser o id, nome, token, etc.)
                const usuario = response.data;
                localStorage.setItem('usuarioLogado', JSON.stringify(usuario));

                // Redireciona pro dashboard
                window.location.href = 'pages/dashboard.html';

            } catch (error) {
                console.error('Erro ao fazer login:', error);
                alert('Email ou senha inválidos. Tente novamente.');

                btn.disabled = false;
                btnText.textContent = originalText;
            }
        });
    }
});
