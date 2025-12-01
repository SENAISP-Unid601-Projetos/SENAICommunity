// google-auth.js
window.googleAuthConfig = {
  clientId:
    "1055449517512-gq7f7doogo5e8vmaq84vgrabsk1q5f5k.apps.googleusercontent.com",
  backendUrl: "http://localhost:8080",
};

let googleAuthInitialized = false;
let retryCount = 0;
const maxRetries = 10;

function initGoogleAuth() {
  if (googleAuthInitialized) {
    return;
  }

  if (!window.google || !google.accounts) {
    retryCount++;
    if (retryCount <= maxRetries) {
      console.log(
        `Google API not loaded yet, retrying... (${retryCount}/${maxRetries})`
      );
      setTimeout(initGoogleAuth, 500);
    } else {
      console.error("Failed to load Google API after maximum retries.");
    }
    return;
  }

  google.accounts.id.initialize({
    client_id: googleAuthConfig.clientId,
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: false,
  });

  // Render buttons
  const loginBtn = document.getElementById("google-signin-button");
  const cadastroBtn = document.getElementById("google-signin-button-cadastro");

  if (loginBtn) {
    google.accounts.id.renderButton(loginBtn, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "continue_with",
    });
  }

  if (cadastroBtn) {
    google.accounts.id.renderButton(cadastroBtn, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "signup_with",
    });
  }

  googleAuthInitialized = true;
  console.log("Google Auth initialized successfully.");
}

async function handleCredentialResponse(response) {
  try {
    const res = await axios.post(
      `${window.googleAuthConfig.backendUrl}/autenticacao/login/google`,
      {
        token: response.credential,
      }
    );

    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }

    await Swal.fire({
      icon: "success",
      title: "Login realizado!",
      text: "Entrando no sistema...",
      timer: 2000,
      showConfirmButton: false,
    });

    window.location.href = "principal.html";
  } catch (error) {
    console.error("Erro no login Google:", error);
    let msg = "Falha ao autenticar com Google.";
    if (error.response && error.response.data) {
      msg = error.response.data;
    }
    Swal.fire({ icon: "error", title: "Erro", text: msg });
  }
}

// Inicializar quando a página estiver carregada
// Note: a API do Google pode ser carregada antes ou depois deste script.
// Se a API já estiver carregada, podemos inicializar imediatamente.
// Caso contrário, a função initGoogleAuth tentará novamente.

// Verificar se a API já está disponível
if (window.google && google.accounts) {
  initGoogleAuth();
} else {
  // Se não, vamos tentar quando a janela for carregada e também com retries.
  window.addEventListener("load", function () {
    // Dar um pequeno atraso para garantir que a API foi carregada
    setTimeout(initGoogleAuth, 100);
  });
}

// Além disso, se a API for carregada depois do evento load, ainda assim teremos os retries.
// Mas note que a API do Google é carregada com async defer, então pode ser depois do load.
// Por isso, a função initGoogleAuth tem um mecanismo de retry.
