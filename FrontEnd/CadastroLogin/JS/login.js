// @ts-nocheck
// Arquivo: CadastroLogin/JS/login.js

document.addEventListener("DOMContentLoaded", function () {
  // Se você tiver uma função setupPasswordToggles em outro arquivo (como utils.js), certifique-se de que ele seja carregado no HTML.
  // Exemplo: if (typeof setupPasswordToggles === 'function') setupPasswordToggles();

  const loginForm = document.getElementById("loginForm");

  const togglePasswordButtons = document.querySelectorAll(".toggle-password");

  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Encontra o input associado (que está no mesmo grupo/pai)
      const input = this.parentElement.querySelector("input");
      const icon = this.querySelector("i");

      // Alterna entre tipo 'password' e 'text'
      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash"); // Ícone de olho cortado
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye"); // Ícone de olho normal
      }
    });
  });
  const backendUrl = "http://localhost:8080";
  // ATENÇÃO: Verifique se este é o seu Client ID correto
  const googleClientId =
    "1055449517512-gq7f7doogo5e8vmaq84vgrabsk1q5f5k.apps.googleusercontent.com";

  // 1. Inicializa o Google Sign-In

  function initGoogle() {
    if (typeof google !== "undefined" && google.accounts) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
      });

      const googleButton = document.getElementById("google-signin-button");
      if (googleButton) {
        google.accounts.id.renderButton(googleButton, {
          theme: "outline", // ou "filled_blue", "filled_black"
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "continue_with", // texto: "Entrar com Google"
        });
      }
    } else {
      // Tenta novamente se a API do Google não tiver carregado a tempo
      setTimeout(initGoogle, 500);
    }
  }
  initGoogle();

  // 2. Função que é chamada após o login com Google ser bem-sucedido
  async function handleGoogleCredentialResponse(response) {
    const btn = document.getElementById("google-signin-button");
    if (!btn) return;

    btn.disabled = true;
    btn.classList.add("loading");

    try {
      // Envia o token do Google para o seu backend
      const backendResponse = await axios.post(
        `${backendUrl}/autenticacao/login/google`,
        {
          token: response.credential,
        }
      );

      // Salva o token JWT que o seu backend retornou
      const token = backendResponse.data.token;
      localStorage.setItem("token", token); // Usando 'token' como chave

      await Swal.fire({
        icon: "success",
        title: "Login com Google realizado!",
        text: "Você será redirecionado em breve.",
        timer: 2000,
        showConfirmButton: false,
      });

      window.location.href = "principal.html";
    } catch (error) {
      console.error(
        "Erro ao fazer login com Google:",
        error.response?.data || error.message
      );
      Swal.fire({
        icon: "error",
        title: "Erro no Login com Google",
        text: "Não foi possível autenticar sua conta. Tente novamente.",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  }

  // 3. Função para o login com email e senha
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = this.querySelector('input[type="email"]').value;
      const senha = document.getElementById("loginPassword").value;
      const btn = this.querySelector('button[type="submit"]');

      btn.disabled = true;
      btn.classList.add("loading");

      try {
        // **CORREÇÃO AQUI**: Removida a linha duplicada que causava o erro de sintaxe
        const response = await axios.post(`${backendUrl}/autenticacao/login`, {
          email: email,
          senha: senha,
        });

        const token = response.data.token;
        localStorage.setItem("token", token); // Usando 'token' como chave
        localStorage.setItem("emailLogado", email);

        await Swal.fire({
          icon: "success",
          title: "Login realizado!",
          text: "Você será redirecionado em breve.",
          timer: 2000,
          showConfirmButton: false,
        });

        window.location.href = "principal.html";
      } catch (error) {
        console.error("Erro ao fazer login:", error);

        let errorTitle = "Erro ao fazer login";
        let errorMessage = "Verifique suas credenciais e tente novamente.";

        if (error.response) {
          if (error.response.status === 401) {
            errorTitle = "Acesso Negado";
            errorMessage = "Email ou senha inválidos.";
          } else if (error.response.status === 400) {
            errorTitle = "Dados Inválidos";
            errorMessage = "Por favor, preencha todos os campos.";
          }
        } else if (error.request) {
          errorTitle = "Erro de Conexão";
          errorMessage =
            "Não foi possível se conectar ao servidor. Verifique sua rede.";
        }

        Swal.fire({
          icon: "error",
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: "#3085d6",
        });
      } finally {
        btn.disabled = false;
        btn.classList.remove("loading");
      }
    });
  }
});
