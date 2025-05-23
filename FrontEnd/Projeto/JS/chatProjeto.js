// Mock de dados para os grupos
const currentUser = {
  id: 1,
  nome: "Vinicius Gallo Santos",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg"
};
const groups = [
  {
    id: 1,
    nome: "Projeto IoT",
    avatar: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80",
    membros: [
      currentUser,
      { id: 2, nome: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
      { id: 3, nome: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }
    ],
    mensagens: [
      { autor: 2, texto: "Oi pessoal, novidades do projeto?", hora: "19:01" },
      { autor: 1, texto: "Ainda não, mas terminei o layout!", hora: "19:02" },
      { autor: 3, texto: "Posso revisar o código depois.", hora: "19:05" }
    ]
  },
  {
    id: 2,
    nome: "Trabalho de ADS",
    avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=80",
    membros: [
      currentUser,
      { id: 4, nome: "Matheus B.", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
      { id: 5, nome: "Yuri Bragança", avatar: "https://randomuser.me/api/portraits/men/67.jpg" }
    ],
    mensagens: [
      { autor: 4, texto: "Enviei a introdução no docs.", hora: "18:22" },
      { autor: 1, texto: "Show! Vou adicionar a parte de requisitos.", hora: "18:25" },
      { autor: 5, texto: "Posso entregar o diagrama amanhã.", hora: "18:27" }
    ]
  }
];

let selectedGroup = null;
let filteredGroups = [...groups];

// DOM refs
const groupsListEl = document.getElementById('groups-list');
const groupSearchEl = document.getElementById('group-search');
const chatHeaderArea = document.getElementById('chat-header-area');
const chatGroupAvatar = document.getElementById('chat-group-avatar');
const chatGroupTitle = document.getElementById('chat-group-title');
const chatMembers = document.getElementById('chat-members');
const chatMessagesArea = document.getElementById('chat-messages-area');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

// RENDERIZA A LISTA DE GRUPOS
function renderGroupsList() {
  if (!groupsListEl) return;
  groupsListEl.innerHTML = '';
  if (filteredGroups.length === 0) {
    groupsListEl.innerHTML = `<div style="color:#8b949e;text-align:center;padding:2rem 0;">Nenhum grupo encontrado.</div>`;
    return;
  }
  filteredGroups.forEach(g => {
    const lastMsg = g.mensagens.length ? g.mensagens[g.mensagens.length - 1] : null;
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card' + (selectedGroup && selectedGroup.id === g.id ? ' selected' : '');
    groupCard.innerHTML = `
      <img src="${g.avatar}" class="avatar" alt="">
      <div class="group-info">
        <div class="group-title">${g.nome}</div>
        <div class="group-last-msg">${lastMsg ? `<strong>${getUserName(g, lastMsg.autor)}:</strong> ${lastMsg.texto}` : ""}</div>
        <div class="group-members-avatars">
          ${g.membros.slice(0, 4).map(m => `<img class="mini-avatar" src="${m.avatar}" title="${m.nome}"/>`).join('')}
        </div>
      </div>
    `;
    groupCard.onclick = () => selectGroup(g.id);
    groupsListEl.appendChild(groupCard);
  });
}

function getUserName(group, id) {
  const user = group.membros.find(m => m.id === id);
  return user ? user.nome.split(' ')[0] : "Desconhecido";
}

// SELECIONA UM GRUPO
function selectGroup(groupId) {
  selectedGroup = groups.find(g => g.id === groupId);
  renderGroupsList();
  renderChatHeader();
  renderChatMessages();
  chatInput.disabled = false;
  chatSendBtn.disabled = false;
  chatInput.focus();
}

// CABEÇALHO DO CHAT
function renderChatHeader() {
  if (!chatGroupAvatar || !chatGroupTitle || !chatMembers) return;
  if (!selectedGroup) {
    chatGroupAvatar.style.display = 'none';
    chatGroupTitle.textContent = '';
    chatMembers.innerHTML = '';
    return;
  }
  chatGroupAvatar.style.display = '';
  chatGroupAvatar.src = selectedGroup.avatar;
  chatGroupAvatar.alt = selectedGroup.nome;
  chatGroupTitle.textContent = selectedGroup.nome;
  chatMembers.innerHTML = selectedGroup.membros.map(m => `<span>${m.nome.split(" ")[0]}</span>`).join("");
}

// MENSAGENS DO CHAT
function renderChatMessages() {
  if (!chatMessagesArea) return;
  if (!selectedGroup) {
    chatMessagesArea.innerHTML = `<div class="empty-chat">Selecione um grupo para conversar.</div>`;
    return;
  }
  chatMessagesArea.innerHTML = '';
  selectedGroup.mensagens.forEach(msg => {
    const user = selectedGroup.membros.find(m => m.id === msg.autor) || currentUser;
    const div = document.createElement('div');
    div.className = 'message-row' + (msg.autor === currentUser.id ? ' me' : '');
    div.innerHTML = `
      <img src="${user.avatar}" class="message-avatar" alt="">
      <div class="message-bubble">
        <div class="message-content">${msg.texto}</div>
        <div class="message-meta">${user.nome.split(" ")[0]} • ${msg.hora}</div>
      </div>
    `;
    chatMessagesArea.appendChild(div);
  });
  chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
}

// ENVIO DE MENSAGEM
if (chatForm) {
  chatForm.onsubmit = e => {
    e.preventDefault();
    if (!selectedGroup) return;
    const texto = chatInput.value.trim();
    if (!texto) return;
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    selectedGroup.mensagens.push({
      autor: currentUser.id,
      texto,
      hora
    });
    chatInput.value = '';
    renderGroupsList();
    renderChatMessages();
    chatInput.focus();
  };
}

// BUSCA DE GRUPOS
if (groupSearchEl) {
  groupSearchEl.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    filteredGroups = groups.filter(gr =>
      gr.nome.toLowerCase().includes(q)
    );
    renderGroupsList();
  });
}

// Botão de novo grupo (exemplo: abre um alert, pode abrir modal futuramente)
const addGroupBtn = document.querySelector('.add-group-btn');
if (addGroupBtn) {
  addGroupBtn.onclick = () => {
    alert('Funcionalidade de criar novo grupo em breve!');
  };
}

// Dropdown do usuário
const userDropdown = document.querySelector('.user-dropdown');
if (userDropdown) {
  userDropdown.addEventListener('click', function(e) {
    e.stopPropagation();
    const dropdown = this.querySelector('.dropdown-menu');
    if (dropdown)
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
}
document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(menu => menu.style.display = 'none');
});

// Inicialização
renderGroupsList();
renderChatHeader();
renderChatMessages();