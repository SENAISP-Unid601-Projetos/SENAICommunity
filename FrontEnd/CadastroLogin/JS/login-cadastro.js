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
  
  // Validação de formulários
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Simular autenticação
          const btn = this.querySelector('button[type="submit"]');
          const btnText = btn.querySelector('.btn-text');
          const originalText = btnText.textContent;
          
          btn.disabled = true;
          btnText.textContent = 'Autenticando...';
          
          setTimeout(() => {
              // Redirecionar para dashboard após "autenticação"
              window.location.href = 'pages/dashboard.html';
          }, 1500);
      });
  }
  
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
      registerForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Validar senhas
          const password = document.getElementById('registerPassword').value;
          const confirmPassword = this.querySelector('input[type="password"]:not(#registerPassword)').value;
          
          if (password !== confirmPassword) {
              alert('As senhas não coincidem!');
              return;
          }
          
          // Simular cadastro
          const btn = this.querySelector('button[type="submit"]');
          const btnText = btn.querySelector('.btn-text');
          const originalText = btnText.textContent;
          
          btn.disabled = true;
          btnText.textContent = 'Criando conta...';
          
          setTimeout(() => {
              // Redirecionar para login após "cadastro"
              window.location.href = 'login.html';
          }, 1500);
      });
  }
});