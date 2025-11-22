import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // Importado para o botão de perfil

// Componentes de Layout
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
// RightSidebar NÃO é importada aqui

// Estilos
import '../../pages/Principal/Principal.css'; // Estilo principal do layout
import './Configuracoes.css'; // Estilos específicos da página

// --- Componente ToggleSwitch ---
const ToggleSwitch = ({ id, label, checked, onChange }) => {
    // ... (Código do ToggleSwitch não muda) ...
    return (
        <div className="toggle-switch">
            <input
                type="checkbox"
                className="toggle-switch-checkbox"
                id={id}
                checked={checked}
                onChange={onChange}
            />
            <label className="toggle-switch-label" htmlFor={id}>
                <span className="toggle-switch-inner" />
                <span className="toggle-switch-switch" />
            </label>
            <label htmlFor={id} className="toggle-switch-text">{label}</label>
        </div>
    );
};

// --- Componente Principal ---
const Configuracoes = ({ onLogout }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate(); // Hook para navegação

    // Estados para as configurações
    const [isPerfilPrivado, setIsPerfilPrivado] = useState(false);
    const [notificacoesEmail, setNotificacoesEmail] = useState(true);
    const [notificacoesPush, setNotificacoesPush] = useState(true);
    // ✅ NOVOS ESTADOS DE ACESSIBILIDADE
    const [altoContraste, setAltoContraste] = useState(false);
    const [tamanhoFonte, setTamanhoFonte] = useState('normal'); // 'normal', 'grande', 'extra-grande'

    // ✅ 1. Adiciona o estado do menu mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        document.title = 'Senai Community | Configurações';

        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                onLogout();
                return;
            }
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
                const response = await axios.get('http://localhost:8080/usuarios/me');
                setCurrentUser(response.data);
                // TODO: Carregar as configurações salvas do usuário (incluindo acessibilidade)
                // Ex: setIsPerfilPrivado(response.data.configuracoes.perfilPrivado);
                // Ex: setAltoContraste(response.data.configuracoes.altoContraste);
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                onLogout();
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentUser();
    }, [onLogout]);

    // ✅ EFEITO PARA APLICAR MODO DE ALTO CONTRASTE (Exemplo)
    useEffect(() => {
        if (altoContraste) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        // Você precisaria definir estilos CSS para a classe .high-contrast
    }, [altoContraste]);

    const handleSaveChanges = () => {
        // ... (Código do handleSaveChanges não muda) ...
        // Lógica para salvar as configurações no backend
        // Incluir altoContraste e tamanhoFonte nos dados enviados

        Swal.fire({
            icon: 'success',
            title: 'Salvo!',
            text: 'Suas configurações foram atualizadas.',
            timer: 2000,
            showConfirmButton: false
        });
    };

     const handleDeleteAccount = () => {
        // ... (Código do handleDeleteAccount não muda) ...
        Swal.fire({
            title: 'Você tem certeza?',
            text: "Esta ação não pode ser revertida! Todos os seus dados serão permanentemente excluídos.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--danger)',
            cancelButtonColor: 'var(--bg-quaternary)',
            confirmButtonText: 'Sim, excluir minha conta',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Lógica real de exclusão da conta aqui
                Swal.fire(
                    'Excluída!',
                    'Sua conta foi excluída.',
                    'success'
                ).then(() => onLogout());
            }
        });
    };

    if (isLoading || !currentUser) {
        return <div>Carregando...</div>; // Ou um componente de spinner
    }

    return (
        <>
            {/* ✅ 2. Passa a prop 'onToggleSidebar' para o Topbar */}
            <Topbar 
                onLogout={onLogout} 
                currentUser={currentUser} 
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* ✅ 3. Adiciona o overlay */}
            {isSidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <div className="container config-container">
                {/* ✅ 4. Passa a prop 'isOpen' para o Sidebar */}
                <Sidebar 
                    currentUser={currentUser} 
                    isOpen={isSidebarOpen}
                />

                <main className="main-content">
                    <div className="widget-card config-page-card">
                        <h2 className="widget-title">Configurações</h2>

                        {/* --- Seção de Perfil --- */}
                        <div className="config-section">
                            <h3>Conta e Perfil</h3>
                            {/* ... itens de perfil ... */}
                             <div className="config-item">
                                <div>
                                    <h4>Editar Perfil</h4>
                                    <p>Atualize seu nome, foto, bio e outras informações públicas.</p>
                                </div>
                                <button className="btn-config btn-primary" onClick={() => navigate('/perfil')}>Ir para o Perfil</button>
                            </div>
                            <div className="config-item">
                                <div>
                                    <h4>Alterar Senha</h4>
                                    <p>Recomendamos usar uma senha forte que você não usa em outro lugar.</p>
                                </div>
                                <button className="btn-config btn-secondary">Alterar</button>
                            </div>
                        </div>

                        {/* --- Seção de Privacidade --- */}
                        <div className="config-section">
                            <h3>Privacidade</h3>
                            {/* ... item de perfil privado ... */}
                             <div className="config-item">
                                <div>
                                    <h4>Perfil Privado</h4>
                                    <p>Se ativado, apenas suas conexões poderão ver seus projetos e postagens.</p>
                                </div>
                                <ToggleSwitch
                                    id="perfil-privado"
                                    checked={isPerfilPrivado}
                                    onChange={() => setIsPerfilPrivado(!isPerfilPrivado)}
                                />
                            </div>
                        </div>

                        {/* --- Seção de Notificações --- */}
                        <div className="config-section">
                            <h3>Notificações</h3>
                            {/* ... toggles de notificação ... */}
                             <ToggleSwitch
                                id="notif-email"
                                label="Receber notificações por e-mail"
                                checked={notificacoesEmail}
                                onChange={() => setNotificacoesEmail(!notificacoesEmail)}
                            />
                            <ToggleSwitch
                                id="notif-push"
                                label="Receber notificações push no navegador"
                                checked={notificacoesPush}
                                onChange={() => setNotificacoesPush(!notificacoesPush)}
                            />
                        </div>

                        {/* ✅ NOVA SEÇÃO DE ACESSIBILIDADE */}
                        <div className="config-section">
                            <h3>Acessibilidade</h3>
                            <div className="config-item">
                                <div>
                                    <h4>Modo de Alto Contraste</h4>
                                    <p>Aumenta o contraste das cores para facilitar a leitura.</p>
                                </div>
                                <ToggleSwitch
                                    id="alto-contraste"
                                    checked={altoContraste}
                                    onChange={() => setAltoContraste(!altoContraste)}
                                />
                            </div>
                            <div className="config-item">
                                <div>
                                    <h4>Tamanho da Fonte</h4>
                                    <p>Ajuste o tamanho do texto em toda a plataforma.</p>
                                </div>
                                {/* Exemplo com Select - pode ser trocado por botões ou slider */}
                                <select
                                    className="config-select"
                                    value={tamanhoFonte}
                                    onChange={(e) => setTamanhoFonte(e.target.value)}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="grande">Grande</option>
                                    <option value="extra-grande">Extra Grande</option>
                                </select>
                            </div>
                        </div>
                        {/* FIM DA NOVA SEÇÃO */}

                        {/* --- Seção de Conta --- */}
                         <div className="config-section">
                            <h3>Gerenciamento da Conta</h3>
                             {/* ... item de excluir conta ... */}
                              <div className="config-item">
                                <div>
                                    <h4>Excluir conta</h4>
                                    <p>Exclui permanentemente sua conta e todos os seus dados.</p>
                                </div>
                                <button className="btn-config btn-danger" onClick={handleDeleteAccount}>Excluir Conta</button>
                            </div>
                        </div>

                        <div className="config-footer">
                            <button className="btn-config btn-primary" onClick={handleSaveChanges}>Salvar Alterações</button>
                        </div>

                    </div>
                </main>

                {/* A RightSidebar não é renderizada aqui */}
            </div>
        </>
    );
};

export default Configuracoes;