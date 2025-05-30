// MOCK DE DADOS
const allUsers = [
  { id: 2, nome: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: 3, nome: "Matheus Biancolini", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
  { id: 4, nome: "Yuri Bragança", avatar: "https://randomuser.me/api/portraits/men/67.jpg" },
  { id: 5, nome: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
];

const currentUser = {
  id: 1,
  nome: "Vinicius Gallo Santos",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg"
};

let meusProjetos = [
  {
    id: 1,
    nome: "Sistema de Monitoramento IoT",
    descricao: "Projeto de automação residencial utilizando sensores inteligentes.",
    criador: currentUser,
    membros: [currentUser, allUsers[0]],
  }
];

let projetosParticipo = [
  {
    id: 2,
    nome: "App de Agenda Escolar",
    descricao: "Aplicativo mobile para organização de tarefas e eventos escolares.",
    criador: allUsers[1],
    membros: [allUsers[1], currentUser]
  }
];

let convites = [
  {
    id: 3,
    nome: "Plataforma de Cursos Online",
    remetente: allUsers[2].nome,
    descricao: "Participe do projeto de ensino a distância para cursos técnicos.",
    avatar: allUsers[2].avatar
  }
];

// NOTIFICAÇÃO
function showNotification(message, type = "info") {
  const notificationCenter = document.querySelector('.notification-center');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  if (notificationCenter) {
    notificationCenter.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 350);
    }, 3000);
  }
}

// RENDERIZAÇÃO DOS PROJETOS
function renderMeusProjetos() {
  const container = document.getElementById('meus-projetos');
  if (!container) return;
  let emptyState = document.getElementById('sem-meus-projetos');
  if (!emptyState) {
    emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.id = 'sem-meus-projetos';
    emptyState.style.display = 'none';
    emptyState.innerHTML = `
      <p>Você ainda não criou nenhum projeto.</p>
      <button class="action-btn" id="criar-primeiro-projeto">
        <i class="fas fa-plus"></i> Criar Projeto
      </button>
    `;
    container.appendChild(emptyState);
  }
  container.querySelectorAll('.project-card').forEach(card => card.remove());
  if (meusProjetos.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    meusProjetos.forEach(projeto => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.location.href = `chatProjeto.html?id=${projeto.id}`;
      });
      card.innerHTML = `
        <button class="project-options-btn" title="Opções" onclick="event.stopPropagation();"><i class="fas fa-ellipsis-h"></i></button>
        <div class="project-header">
          <img class="creator-avatar" src="${projeto.criador.avatar}" title="Criador" alt="Criador">
          <span class="project-title">${projeto.nome}</span>
        </div>
        <div class="project-desc">${projeto.descricao}</div>
        <div class="project-footer">
          <div class="project-members">
            ${projeto.membros.map(m => `<img class="member-avatar" src="${m.avatar}" title="${m.nome}">`).join('')}
          </div>
          <div class="project-actions">
            <button title="Editar" onclick="event.stopPropagation();"><i class="fas fa-edit"></i></button>
            <button title="Excluir" onclick="deleteProjeto(${projeto.id});event.stopPropagation();"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }
  const btnCriarPrimeiroProjeto = document.getElementById('criar-primeiro-projeto');
  if (btnCriarPrimeiroProjeto) btnCriarPrimeiroProjeto.addEventListener('click', openModal);
}

function renderProjetosParticipo() {
  const container = document.getElementById('projetos-participo');
  if (!container) return;
  let emptyState = document.getElementById('sem-projetos-participo');
  if (!emptyState) {
    emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.id = 'sem-projetos-participo';
    emptyState.style.display = 'none';
    emptyState.innerHTML = `
      <p>Você ainda não está participando de nenhum projeto.</p>
    `;
    container.appendChild(emptyState);
  }
  container.querySelectorAll('.project-card').forEach(card => card.remove());
  if (projetosParticipo.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    projetosParticipo.forEach(projeto => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.location.href = `chatProjeto.html?id=${projeto.id}`;
      });
      card.innerHTML = `
        <button class="project-options-btn" title="Opções" onclick="event.stopPropagation();"><i class="fas fa-ellipsis-h"></i></button>
        <div class="project-header">
          <img class="creator-avatar" src="${projeto.criador.avatar}" title="Criador" alt="Criador">
          <span class="project-title">${projeto.nome}</span>
        </div>
        <div class="project-desc">${projeto.descricao}</div>
        <div class="project-footer">
          <div class="project-members">
            ${projeto.membros.map(m => `<img class="member-avatar" src="${m.avatar}" title="${m.nome}">`).join('')}
          </div>
          <div class="project-actions">
            <button title="Sair do Projeto" onclick="leaveProjeto(${projeto.id});event.stopPropagation();"><i class="fas fa-sign-out-alt"></i></button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }
}

function renderConvites() {
  const container = document.getElementById('lista-convites');
  if (!container) return;
  let emptyState = document.getElementById('sem-convites');
  if (!emptyState) {
    emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.id = 'sem-convites';
    emptyState.style.display = 'none';
    emptyState.innerHTML = `
      <p>Você não possui convites de projetos no momento.</p>
    `;
    container.appendChild(emptyState);
  }
  container.querySelectorAll('.invite-card').forEach(card => card.remove());
  if (convites.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
    convites.forEach(convite => {
      const card = document.createElement('div');
      card.className = 'invite-card';
      card.innerHTML = `
        <div class="invite-info">
          <div style="display:flex;align-items:center;gap:0.7rem;">
            <img src="${convite.avatar}" alt="${convite.remetente}" class="member-avatar">
            <strong>${convite.nome}</strong>
          </div>
          <span>Convite de <b>${convite.remetente}</b></span>
          <span style="color:var(--text-secondary);font-size:0.98em">${convite.descricao}</span>
        </div>
        <div class="invite-actions">
          <button class="accept" onclick="acceptConvite(${convite.id})">Aceitar</button>
          <button class="decline" onclick="declineConvite(${convite.id})">Recusar</button>
        </div>
      `;
      container.appendChild(card);
    });
  }
}

// FUNÇÕES DE PROJETO
function deleteProjeto(id) {
  meusProjetos = meusProjetos.filter(p => p.id !== id);
  renderMeusProjetos();
  showNotification("Projeto excluído com sucesso!", "success");
}
function leaveProjeto(id) {
  projetosParticipo = projetosParticipo.filter(p => p.id !== id);
  renderProjetosParticipo();
  showNotification("Você saiu do projeto.", "info");
}
function acceptConvite(id) {
  const convite = convites.find(c => c.id === id);
  if (convite) {
    projetosParticipo.push({
      id: convite.id,
      nome: convite.nome,
      descricao: convite.descricao,
      criador: allUsers.find(u => u.nome === convite.remetente) || currentUser,
      membros: [currentUser, allUsers.find(u => u.nome === convite.remetente) || currentUser]
    });
    convites = convites.filter(c => c.id !== id);
    renderProjetosParticipo();
    renderConvites();
    showNotification("Convite aceito! Você agora participa do projeto.", "success");
  }
}
function declineConvite(id) {
  convites = convites.filter(c => c.id !== id);
  renderConvites();
  showNotification("Convite recusado.", "info");
}

// MODAL CRIAR PROJETO & CONVITE DE USUÁRIOS
const btnCriarProjeto = document.getElementById('btn-criar-projeto');
const criarPrimeiroProjeto = document.getElementById('criar-primeiro-projeto');
const modal = document.getElementById('modal-criar-projeto');
const closeModal = document.querySelector('.close-modal');
const formCriarProjeto = document.getElementById('form-criar-projeto');
const inputBuscaUsuario = document.getElementById('input-busca-usuario');
const listaUsuarios = document.getElementById('lista-usuarios');
const listaConvidados = document.getElementById('lista-convidados');

let convidados = [];

function openModal() {
  if (modal) {
    modal.style.display = 'flex';
    if (inputBuscaUsuario && (inputBuscaUsuario instanceof HTMLInputElement || inputBuscaUsuario instanceof HTMLTextAreaElement)) inputBuscaUsuario.value = '';
    if (listaUsuarios) {
      listaUsuarios.innerHTML = '';
      listaUsuarios.classList.remove('active');
    }
    convidados = [];
    renderConvidados();
  }
}
function closeModalFn() {
  if (modal) modal.style.display = 'none';
  if (formCriarProjeto && formCriarProjeto instanceof HTMLFormElement) formCriarProjeto.reset();
  convidados = [];
  renderConvidados();
}
if (btnCriarProjeto) btnCriarProjeto.addEventListener('click', openModal);
if (criarPrimeiroProjeto) criarPrimeiroProjeto.addEventListener('click', openModal);
if (closeModal) closeModal.addEventListener('click', closeModalFn);
if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) closeModalFn(); });

// Buscar usuários para convite
if (inputBuscaUsuario) {
  inputBuscaUsuario.addEventListener('input', function() {
    let query = '';
    if (inputBuscaUsuario instanceof HTMLInputElement || inputBuscaUsuario instanceof HTMLTextAreaElement) {
      query = inputBuscaUsuario.value.trim().toLowerCase();
    }
    if (!query) {
      if (listaUsuarios) {
        listaUsuarios.innerHTML = '';
        listaUsuarios.classList.remove('active');
      }
      return;
    }
    const results = allUsers.filter(u =>
      u.nome.toLowerCase().includes(query) &&
      u.id !== currentUser.id &&
      !convidados.some(c => c.id === u.id)
    );
    if (listaUsuarios) {
      if (results.length === 0) {
        listaUsuarios.classList.remove('active');
        listaUsuarios.innerHTML = '';
        return;
      }
      listaUsuarios.innerHTML = results.map(u => `
        <div class="user-result" data-id="${u.id}">
          <img src="${u.avatar}" width="28" height="28" style="border-radius:50%;border:1.5px solid var(--border-color);background:#222;">
          <span>${u.nome}</span>
        </div>
      `).join('');
      listaUsuarios.classList.add('active');

      listaUsuarios.querySelectorAll('.user-result').forEach(function(el) {
        el.addEventListener('click', function() {
          const userIdAttr = el.getAttribute('data-id');
          const userId = userIdAttr ? parseInt(userIdAttr) : 0;
          const user = allUsers.find(u => u.id === userId);
          if (user && !convidados.some(c => c.id === user.id)) {
            convidados.push(user);
            renderConvidados();
            if (inputBuscaUsuario instanceof HTMLInputElement || inputBuscaUsuario instanceof HTMLTextAreaElement) {
              inputBuscaUsuario.value = '';
            }
            listaUsuarios.classList.remove('active');
            listaUsuarios.innerHTML = '';
          }
        });
      });
    }
  });
}

function renderConvidados() {
  if (!listaConvidados) return;
  listaConvidados.innerHTML = convidados.map(u => `
    <div class="invited-chip">
      <img src="${u.avatar}" width="21" style="border-radius:50%;margin-right:4px;"> ${u.nome}
      <button class="remove-invite" title="Remover convidado" data-id="${u.id}">&times;</button>
    </div>
  `).join('');
  listaConvidados.querySelectorAll('.remove-invite').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const userIdAttr = btn.getAttribute('data-id');
      const userId = userIdAttr ? parseInt(userIdAttr) : 0;
      convidados = convidados.filter(c => c.id !== userId);
      renderConvidados();
    });
  });
}

// Criar projeto (mock)
if (formCriarProjeto) {
  formCriarProjeto.addEventListener('submit', function(e) {
    e.preventDefault();
    let nome = '', descricao = '';
    let nomeInput = formCriarProjeto.querySelector('input');
    let descInput = formCriarProjeto.querySelector('textarea');
    // @ts-ignore
    if (nomeInput instanceof HTMLInputElement || nomeInput instanceof HTMLTextAreaElement) {
      nome = nomeInput.value.trim();
    }
    if (descInput instanceof HTMLInputElement || descInput instanceof HTMLTextAreaElement) {
      descricao = descInput.value.trim();
    }
    if (!nome || !descricao) return;
    const newProject = {
      id: Date.now(),
      nome,
      descricao,
      criador: currentUser,
      membros: [currentUser, ...convidados]
    };
    meusProjetos.push(newProject);

    // Envia convites simulados para os convidados
    convidados.forEach(function(u) {
      convites.push({
        id: Date.now() + Math.random(),
        nome,
        descricao,
        remetente: currentUser.nome,
        avatar: currentUser.avatar
      });
    });

    renderMeusProjetos();
    renderConvites();
    if (formCriarProjeto instanceof HTMLFormElement) formCriarProjeto.reset();
    closeModalFn();
    showNotification("Projeto criado com sucesso! Convites enviados.", "success");
  });
}

// Dropdown do usuário
const userDropdown = document.querySelector('.user-dropdown');
if (userDropdown) {
  userDropdown.addEventListener('click', function(e) {
    e.stopPropagation();
    const dropdown = this.querySelector('.dropdown-menu');
    if (dropdown && dropdown instanceof HTMLElement)
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
}
document.addEventListener('click', function() {
  document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
    if (menu instanceof HTMLElement) menu.style.display = 'none';
  });
});

// Tema (dark/light)
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;
const savedTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', savedTheme);
if (themeToggle) {
  themeToggle.innerHTML = savedTheme === 'dark'
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';

  themeToggle.addEventListener('click', function() {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.innerHTML = newTheme === 'dark'
      ? '<i class="fas fa-moon"></i>'
      : '<i class="fas fa-sun"></i>';
    showNotification(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
  });
}

// Inicialização
renderMeusProjetos();
renderProjetosParticipo();
renderConvites();