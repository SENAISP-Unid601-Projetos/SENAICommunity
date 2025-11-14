document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------------------
  // AGUARDA O SCRIPT PRINCIPAL
  // -----------------------------------------------------------------
  document.addEventListener("globalScriptsLoaded", (e) => {
    const currentUser = window.currentUser;

    const ProjetoDetalhePage = {
      // --- ESTADO ---
      state: {
        stompClient: null,
        projetoId: null,
      },

      // --- ELEMENTOS (ATUALIZADOS) ---
      elements: {
        // Info Coluna
        titulo: document.getElementById("projeto-titulo"),
        descricao: document.getElementById("projeto-descricao"),
        infoCategoria: document.getElementById("info-categoria"),
        infoTecnologias: document.getElementById("info-tecnologias"),
        integrantesLista: document.getElementById("integrantes-lista"),

        // Chat Coluna
        membrosIcones: document.getElementById("projeto-membros-icones"),
        chatMessages: document.getElementById("chat-messages"),
        chatForm: document.getElementById("chat-form"),
        chatInput: document.getElementById("chat-message-input"),
        chatUserAvatar: document.getElementById("chat-user-avatar"),
      },

      // -----------------------------------------------------------------
      // INICIALIZAÇÃO
      // -----------------------------------------------------------------
      async init() {
        // Verifica se o usuário está logado
        const token = localStorage.getItem('authToken') || window.authToken;
        if (!token || !currentUser) {
          console.error("Token ou usuário não encontrado. Redirecionando para login...");
          window.showNotification("Você precisa estar logado para acessar esta página.", "error");
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
          return;
        }

        const params = new URLSearchParams(window.location.search);
        this.state.projetoId = params.get("id");

        if (!this.state.projetoId) {
          document.querySelector(".main-content").innerHTML =
            "<h1>ID do projeto não encontrado.</h1>";
          return;
        }

        if (this.elements.chatUserAvatar) {
            this.elements.chatUserAvatar.src = window.getAvatarUrl(currentUser.urlFotoPerfil);
        }

        // Carrega os dados. A conexão WS SÓ será chamada
        // dentro de loadProjectDetails, após o sucesso.
        await this.loadProjectDetails();
        
        this.setupEventListeners();
      },

      // -----------------------------------------------------------------
      // FUNÇÕES DE DADOS (REST)
      // -----------------------------------------------------------------
      async loadProjectDetails() {
        try {
          const response = await window.axios.get(
            `${window.backendUrl}/projetos/${this.state.projetoId}`
          );
          const proj = response.data;

          // Renderiza dados na Coluna de Informações
          this.elements.titulo.textContent = proj.titulo;
          this.elements.descricao.textContent = proj.descricao || "Sem descrição.";
          this.elements.infoCategoria.textContent = proj.categoria || "N/A";
          this.elements.infoTecnologias.textContent = (proj.tecnologias || []).join(', ') || "N/A";

          // Renderiza membros
          this.elements.membrosIcones.innerHTML = "";
          this.elements.integrantesLista.innerHTML = "";
          
          if (!proj.membros || proj.membros.length === 0) {
             this.elements.integrantesLista.innerHTML = '<li class="empty-state">Nenhum integrante.</li>';
          } else {
             (proj.membros || []).forEach(membro => {
                const avatarUrl = window.getAvatarUrl(membro.usuarioFotoPerfil);
                
                const imgIcon = document.createElement('img');
                imgIcon.src = avatarUrl;
                imgIcon.title = membro.usuarioNome;
                this.elements.membrosIcones.appendChild(imgIcon);

                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="avatar"><img src="${avatarUrl}" alt="${membro.usuarioNome}"></div>
                    <span class="nome">${membro.usuarioNome}</span>
                `;
                this.elements.integrantesLista.appendChild(li);
             });
          }
          
          // Se carregar o projeto funcionou, o token é válido.
          await this.fetchChatHistory();
          this.connectWebSocket();

        } catch (error) {
          console.error("Erro ao buscar detalhes do projeto:", error);
          
          if (error.response?.status === 403) {
            this.elements.titulo.textContent = "Acesso Negado";
            this.elements.descricao.textContent = "Você não tem permissão para acessar este projeto.";
            document.querySelector('.projeto-chat-coluna')?.remove();
          } else if (error.response?.status === 404) {
            this.elements.titulo.textContent = "Projeto Não Encontrado";
            this.elements.descricao.textContent = "O projeto solicitado não existe ou foi removido.";
          } else {
            this.elements.titulo.textContent = "Erro ao Carregar";
            this.elements.descricao.textContent = "Não foi possível carregar os detalhes do projeto.";
          }
        }
      },
      
      async fetchChatHistory() {
        try {
            const response = await window.axios.get(
                `${window.backendUrl}/api/chat/grupo/${this.state.projetoId}`
            );
            const mensagens = response.data;
            
            this.elements.chatMessages.innerHTML = ""; 
            if (mensagens.length === 0) {
                this.elements.chatMessages.innerHTML = '<p class="empty-state">Nenhuma mensagem ainda. Seja o primeiro!</p>';
            } else {
                mensagens.forEach(msg => this.renderMessage(msg, false)); 
            }
            this.scrollToBottom();
        } catch (error) {
            console.error("Erro ao buscar histórico do chat:", error);
            this.elements.chatMessages.innerHTML = '<p class="empty-state">Não foi possível carregar o histórico.</p>';
        }
      },

      // -----------------------------------------------------------------
      // FUNÇÕES DE CHAT (WEBSOCKET)
      // -----------------------------------------------------------------
      
      connectWebSocket() {
        const token = localStorage.getItem('authToken') || window.authToken;
        
        if (!token) {
            console.error("Token não encontrado. O chat não pode conectar.");
            window.showNotification("Erro de autenticação para o chat. Faça login novamente.", "error");
            return;
        }

        const socket = new SockJS(`${window.backendUrl}/ws`);
        
        // --- INÍCIO DA CORREÇÃO (Conexão Perdida) ---
        
        // 1. Adicionar um listener 'onclose' ao socket nativo (SockJS)
        // Este é o método mais confiável para capturar *todas* as desconexões.
        socket.onclose = (e) => {
            console.warn('Socket fechado. Tentando reconectar em 5 segundos...', e);
            window.showNotification("Conexão do chat perdida. Reconectando...", "error");
            
            // Tenta reconectar após 5 segundos
            setTimeout(() => {
                // Só reconecta se não houver uma conexão ativa
                if (!this.state.stompClient || !this.state.stompClient.connected) {
                   console.log("Tentando reconectar...");
                   this.connectWebSocket(); 
                }
            }, 5000);
        };
        // --- FIM DA CORREÇÃO ---

        this.state.stompClient = Stomp.over(socket);

        // 2. Habilitar o debug para ver os heartbeats (PING/PONG) no console
        this.state.stompClient.debug = (str) => {
             console.log('STOMP: ' + str);
        };

        this.state.stompClient.connect(
            { 
                Authorization: `Bearer ${token}`,
                // 3. Enviar heartbeats a cada 20s (cliente envia, servidor envia)
                // Isso mantém a conexão "viva" e detecta quedas.
                'heart-beat': '20000,20000' 
            },
            (frame) => {
                console.log("Conectado ao WebSocket: " + frame);
                // Dá um feedback positivo e limpa msgs de erro
                window.showNotification("Conectado ao chat do projeto!", "success"); 
                
                // Subscrever para mensagens do grupo
                this.state.stompClient.subscribe(
                    `/topic/grupo/${this.state.projetoId}`,
                    (message) => {
                        const msgPayload = JSON.parse(message.body);
                        if (msgPayload.remetenteId !== currentUser.id) {
                            this.renderMessage(msgPayload, false);
                        }
                    }
                );
                
                // Subscrever para erros
                this.state.stompClient.subscribe(
                    `/user/queue/errors`,
                    (message) => {
                        window.showNotification(`Erro: ${message.body}, "error"`);
                    }
                );
            },
            (error) => {
                // Este 'error' callback é para falhas na *primeira* conexão
                console.error("Falha ao conectar no WebSocket:", error);
                // O 'socket.onclose' já foi acionado ou será acionado em breve,
                // então não precisamos duplicar a lógica de reconexão aqui.
            }
        );
      },
      
      sendMessage(event) {
        event.preventDefault();
        const conteudo = this.elements.chatInput.value.trim();
        
        if (conteudo && this.state.stompClient && this.state.stompClient.connected) {
            const chatMessage = {
                remetenteId: currentUser.id,
                conteudo: conteudo,
                tipo: 'TEXTO'
            };

            this.state.stompClient.send(
                `/app/grupo/${this.state.projetoId}`,
                { Authorization: `Bearer ${localStorage.getItem('authToken') || window.authToken}` }, 
                JSON.stringify(chatMessage)
            );

            // Renderiza a msg localmente AGORA
            const localMessageDTO = {
                remetenteId: currentUser.id,
                remetenteNome: currentUser.nome,
                remetenteFotoPerfil: currentUser.urlFotoPerfil,
                conteudo: conteudo,
                timestamp: new Date().toISOString(),
                tipo: 'TEXTO'
            };
            this.renderMessage(localMessageDTO, true); 

            this.elements.chatInput.value = "";
        } else {
            window.showNotification("Não foi possível enviar a mensagem. Verifique sua conexão.", "error");
        }
      },
      
      // -----------------------------------------------------------------
      // FUNÇÕES DE RENDERIZAÇÃO (Estilo WhatsApp)
      // -----------------------------------------------------------------
      
      renderMessage(msg, isLocalMessage) {
        const emptyState = this.elements.chatMessages.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const msgElement = document.createElement("div");
        msgElement.className = "message-item";

        if (msg.remetenteId === currentUser.id) {
            msgElement.classList.add("sent");
        } else {
            msgElement.classList.add("received");
        }
        
        if (isLocalMessage) {
            msgElement.classList.add("local");
        }
        
        const timestamp = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit'
        });
        
        // Header (Nome do Autor)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.textContent = msg.remetenteNome;
        
        // Content (Balão)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Body (Texto)
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'message-body';
        const p = document.createElement('p');
        p.textContent = msg.conteudo; // Proteção XSS
        bodyDiv.appendChild(p);
        
        // Footer (Timestamp)
        const footerDiv = document.createElement('div');
        footerDiv.className = 'message-footer';
        footerDiv.textContent = timestamp;
        
        // Montagem
        contentDiv.appendChild(bodyDiv);
        contentDiv.appendChild(footerDiv);
        
        msgElement.appendChild(headerDiv); // Nome
        msgElement.appendChild(contentDiv); // Balão
        
        this.elements.chatMessages.appendChild(msgElement);
        this.scrollToBottom();
      },

      scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
      },
      
      // -----------------------------------------------------------------
      // EVENT LISTENERS
      // -----------------------------------------------------------------
      setupEventListeners() {
        this.elements.chatForm.addEventListener('submit', this.sendMessage.bind(this));
      }
    };

    // --- INICIALIZAÇÃO DA PÁGINA ---
    ProjetoDetalhePage.init();
    window.ProjetoDetalhePage = ProjetoDetalhePage;
  });
});