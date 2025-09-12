// /FrontEnd/Perfil/JS/perfil.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- NOSSO BANCO DE DADOS DE USUÁRIOS ---
    const userDatabase = {
        'usuario': {
            name: "Usuário Temporário",
            title: "Sem Curso",
            location: "São Carlos, Brasil",
            avatar: "./img/perfil.png",
            cover: "https://images.unsplash.com/photo-1579403124614-197f69d8187b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
            stats: { connections: 3, projects: 1 }, // Conexões atualizadas para 3
            about: "Entusiasta de tecnologia",
            skills: ["React", "JavaScript", "TypeScript", "HTML5 & CSS3", "Git & GitHub", "Scrum"],
            projects: [
                { title: "Senai Community", image: "./img/unnamed.png", description: "Toda ideia merece espaço para crescer. Aqui, ela encontra pessoas, projetos e oportunidades. Bem-vindo ao SenaiCommunity!" }
            ],
            connections: [
                { id: "senai", name: "Senai São Carlos", title: "Faculdade de Tecnologia e Escola SENAI Antonio Adolpho Lobbe", avatar: "img/senai.jpg" },
                { id: "miguel", name: "Miguel Piscki", title: "Especialista em IoT e Automação", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
                { id: "vinicius", name: "Vinicius Gallo", title: "Desenvolvimento de Sistemas", avatar: "./img/viniciusGallo.jpg" }
            ]
        },
        'miguel': {
            name: "Miguel Piscki",
            title: "Especialista em IoT e Automação",
            location: "Araraquara, Brasil",
            avatar: "https://randomuser.me/api/portraits/men/22.jpg",
            cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
            stats: { connections: 88, projects: 5 },
            about: "Apaixonado por hardware e software. Conectando o mundo físico ao digital através de soluções inovadoras com Arduino e outras plataformas.",
            skills: ["Arduino", "C++", "Python", "Node.js", "Sensores IoT", "Automação Industrial"],
            projects: [
                { title: "Automação Industrial com Arduino", image: "./img/unnamed.png", description: "Sistema de monitoramento de temperatura e umidade." }
            ],
            connections: [
                 { id: "vinicius", name: "Vinicius Gallo", title: "Desenvolvedor Full-Stack", avatar: "./img/viniciusGallo.jpg" },
                 { id: "ana", name: "Ana Silva", title: "Engenheira de Software", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
                 { id: "usuario", name: "Usuário Temporário", title: "Sem Curso", avatar: "./img/perfil.png" }
            ]
        },
        'ana': {
            name: "Ana Silva",
            title: "Engenheira de Software na Tech Solutions Inc.",
            location: "São Paulo, Brasil",
            avatar: "https://randomuser.me/api/portraits/women/33.jpg",
            cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
            stats: { connections: 432, projects: 18 },
            about: "Engenheira de software com 5 anos de experiência, especializada em desenvolvimento de sistemas distribuídos e microserviços na nuvem.",
            skills: ["Java", "Spring Boot", "AWS", "Docker", "Kubernetes", "Microserviços"],
            projects: [
                 { title: "Dashboard de Vendas", image: "./img/tiProjeto.png", description: "Análise de dados de vendas em tempo real." }
            ],
            connections: [
                 { id: "miguel", name: "Miguel Piscki", title: "Especialista em IoT", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
            ]
        },
        'senai': {
            name: "Senai São Carlos",
            title: "Faculdade de Tecnologia e Escola SENAI Antonio Adolpho Lobbe",
            location: "São Carlos, Brasil",
            avatar: "./img/senai.jpg",
            cover: "https://www.senairs.org.br/sites/default/files/senai.png", 
            stats: { connections: 1250, projects: 200 },
            about: "O SENAI São Carlos é um centro de excelência em educação profissional e tecnológica, formando talentos para a indústria 4.0. Oferecemos cursos técnicos, de graduação e pós-graduação.",
            skills: ["Tecnologia", "Inovação", "Indústria 4.0", "Educação", "Mecatrônica", "Desenvolvimento de Sistemas"],
            projects: [],
            connections: []
        },
        'vinicius': {
            name: "Vinicius Gallo",
            title: "Desenvolvimento de Sistemas",
            location: "São Carlos, Brasil",
            avatar: "./img/viniciusGallo.jpg",
            cover: "https://images.unsplash.com/photo-1579403124614-197f69d8187b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
            stats: { connections: 201, projects: 4 },
            about: "um entusiasta de tecnologia e estudante do SENAI, com foco em criar soluções web robustas e escaláveis. Tem experiência com JavaScript, React, Node.js e metodologias ágeis.",
            skills: ["React", "JavaScript", "TypeScript", "HTML5 & CSS3", "Git & GitHub", "Scrum"],
            projects: [
                { title: "Senai Community", image: "./img/unnamed.png", description: "Toda ideia merece espaço para crescer. Aqui, ela encontra pessoas, projetos e oportunidades. Bem-vindo ao SenaiCommunity!" },
                { title: "Dashboard de Vendas", image: "./img/tiProjeto.png", description: "Análise de dados de vendas em tempo real." }
            ],
            connections: [
                { id: "senai", name: "Senai São Carlos", title: "Faculdade de Tecnologia e Escola SENAI Antonio Adolpho Lobbe", avatar: "img/senai.jpg" },
                { id: "ana", name: "Ana Silva", title: "Engenheira de Software", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
                { id: "usuario", name: "Usuário Temporário", title: "Sem Curso", avatar: "./img/perfil.png" }
            ]
        }
    };

    // --- LÓGICA PARA CARREGAR O PERFIL ---
    function loadProfile() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id') || 'usuario';
        
        const user = userDatabase[userId];
        if (!user) {
            console.error("Usuário não encontrado!");
            return;
        }

        document.querySelector('.profile-cover img').src = user.cover;
        document.getElementById('profile-avatar-img').src = user.avatar;
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-title').textContent = user.title;
        document.getElementById('profile-location-text').textContent = user.location;
        document.querySelector('.profile-stats .stat:nth-child(1) strong').textContent = user.stats.connections;
        document.querySelector('.profile-stats .stat:nth-child(2) strong').textContent = user.stats.projects;
        document.querySelector('#sobre p').textContent = user.about;
        document.querySelector('#sobre .tags-container').innerHTML = user.skills.map(skill => `<span class="tag">${skill}</span>`).join('');
        document.querySelector('#projetos .projetos-grid-perfil').innerHTML = user.projects.map(proj => `
            <div class="projeto-card-perfil">
               <div class="projeto-imagem" style="background-image: url('${proj.image}')"></div>
               <div class="projeto-conteudo"><h3>${proj.title}</h3><p>${proj.description}</p></div>
            </div>`).join('') || '<p>Nenhum projeto para exibir.</p>';
        document.querySelector('#conexoes h3').textContent = `Conexões (${user.stats.connections})`;
        document.querySelector('#conexoes .conexoes-grid').innerHTML = user.connections.map(conn => `
            <a href="perfil.html?id=${conn.id}" class="conexao-card-link">
                <div class="conexao-card">
                    <img src="${conn.avatar}" alt="${conn.name}">
                    <h4>${conn.name}</h4><p>${conn.title}</p>
                </div>
            </a>`).join('') || '<p>Nenhuma conexão para exibir.</p>';

        const actionsContainer = document.getElementById('profile-actions-container');
        if (userId === 'usuario') {
             actionsContainer.innerHTML = `<button class="btn-perfil primary"><i class="fas fa-edit"></i> Editar Perfil</button>`;
        } else {
             actionsContainer.innerHTML = `<button class="btn-perfil primary"><i class="fas fa-user-plus"></i> Conectar</button><button class="btn-perfil secondary"><i class="fas fa-comment-dots"></i> Mensagem</button>`;
        }
    }

    // --- LÓGICA DAS ABAS ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    loadProfile();
});