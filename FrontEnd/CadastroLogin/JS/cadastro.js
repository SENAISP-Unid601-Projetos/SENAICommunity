document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    setupThemeToggle();

    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const senha = document.getElementById('registerPassword').value;
            const confirmarSenha = document.getElementById('confirmarSenha').value;

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            if (!document.getElementById('terms').checked) {
                alert('Você deve aceitar os termos e condições!');
                return;
            }

            // Monta o FormData
            const formData = new FormData();
            formData.append('nome', document.getElementById('nome').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('senha', senha);
            formData.append('curso', document.getElementById('curso').value);
            formData.append('periodo', document.getElementById('periodo').value);
            formData.append('dataNascimento', document.getElementById('dataNascimento').value);

            // Verifica se a foto foi enviada
            const foto = document.getElementById('foto').files[0];
            if (foto) {
                formData.append('foto', foto);
            }

            // Altera texto do botão enquanto carrega
            const btn = this.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const originalText = btnText.textContent;

            btn.disabled = true;
            btnText.textContent = 'Cadastrando...';

            try {
                // 🚀 Envia via Axios para o back-end
                const response = await axios.post('http://localhost:8080/cadastro/alunos', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                console.log('Cadastro realizado:', response.data);
                alert('Cadastro realizado com sucesso!');

                // Redireciona pro login após cadastro
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Erro no cadastro:', error);

                let errorMessage = 'Erro ao cadastrar. Tente novamente.';
                if (error.response) {
                    if (error.response.status === 409) {
                        errorMessage = 'Este e-mail já está cadastrado!';
                    } else if (error.response.status === 400) {
                        errorMessage = 'Preencha todos os campos corretamente.';
                    }
                }

                alert(errorMessage);
                btn.disabled = false;
                btnText.textContent = originalText;
            }
        });
    }

    // Atualiza nome do arquivo ao selecionar foto
    const fotoInput = document.getElementById('foto');
    if (fotoInput) {
        fotoInput.addEventListener('change', function () {
            const fileName = this.files[0] ? this.files[0].name : 'Foto de perfil (opcional)';
            document.getElementById('file-name').textContent = fileName;
        });
    }
});
