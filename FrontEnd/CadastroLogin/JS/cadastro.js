document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggles();
    setupThemeToggle();

    const passwordInput = document.getElementById('registerPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            const strengthBar = document.querySelector('.strength-bar');

            let strength = 0;
            if (password.length >= 8) strength += 1;
            if (/[A-Z]/.test(password)) strength += 1;
            if (/\d/.test(password)) strength += 1;
            if (/[^A-Za-z0-9]/.test(password)) strength += 1;

            strengthBar.dataset.strength = Math.min(strength, 3);
            strengthBar.style.width = `${(strength / 3) * 100}%`;

            if (strength === 0) {
                strengthBar.style.backgroundColor = '#ff4444';
            } else if (strength === 1) {
                strengthBar.style.backgroundColor = '#ffbb33';
            } else {
                strengthBar.style.backgroundColor = '#00C851';
            }
        });
    }

    const fotoInput = document.getElementById('foto');
    if (fotoInput) {
        fotoInput.addEventListener('change', function () {
            const fileName = this.files[0] ? this.files[0].name : 'Foto de perfil (opcional)';
            document.getElementById('file-name').textContent = fileName;
        });
    }

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

            const formData = new FormData();
            formData.append('nome', document.getElementById('nome').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('senha', senha);
            formData.append('curso', document.getElementById('curso').value);
            formData.append('periodo', document.getElementById('periodo').value);
            formData.append('dataNascimento', document.getElementById('dataNascimento').value);

            const foto = document.getElementById('foto').files[0];
            if (foto) {
                formData.append('foto', foto);
            }

            const btn = this.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const originalText = btnText.textContent;

            btn.disabled = true;
            btnText.textContent = 'Cadastrando...';

            try {
                const response = await axios.post('http://localhost:8080/alunos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                alert('Cadastro realizado com sucesso!');
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
});