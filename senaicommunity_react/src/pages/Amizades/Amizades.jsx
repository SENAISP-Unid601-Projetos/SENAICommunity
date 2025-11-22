import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; 
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPaperPlane, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import './Amizade.css'; // Vamos criar este CSS abaixo

const Amizades = ({ onLogout }) => {
    const [amigos, setAmigos] = useState([]);
    const [busca, setBusca] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const DEFAULT_AVATAR_URL = "http://localhost:8080/images/default-avatar.png";

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return onLogout && onLogout();

            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const [userRes, amigosRes] = await Promise.all([
                    axios.get('http://localhost:8080/usuarios/me'),
                    axios.get('http://localhost:8080/api/amizades/')
                ]);
                setCurrentUser(userRes.data);
                setAmigos(amigosRes.data);
            } catch (error) {
                console.error("Erro ao carregar amizades:", error);
            }
        };
        fetchData();
    }, [onLogout]);

    const getProfileImageUrl = (fotoPerfil) => {
        if (!fotoPerfil) return DEFAULT_AVATAR_URL;
        if (fotoPerfil.startsWith("http")) return fotoPerfil;
        if (fotoPerfil.startsWith("/")) return `http://localhost:8080${fotoPerfil}`;
        return `http://localhost:8080/api/arquivos/${fotoPerfil}`;
    };

    // Filtra amigos baseado na busca
    const amigosFiltrados = amigos.filter(amigo => 
        amigo.nome.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="amizades-page">
            <Topbar onLogout={onLogout} currentUser={currentUser} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            
            <div className="container">
                <Sidebar currentUser={currentUser} isOpen={isSidebarOpen} />
                
                <main className="main-content">
                    <div className="widget-card">
                        <div className="amizades-header">
                            <h2>Todos os meus Amigos</h2>
                            <div className="search-bar-container">
                                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Pesquisar amigo..." 
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>

                        <div className="amizades-list-container">
                            {amigosFiltrados.length === 0 ? (
                                <p className="empty-search">Nenhum amigo encontrado.</p>
                            ) : (
                                <div className="amizades-grid">
                                    {amigosFiltrados.map(amigo => (
                                        <div key={amigo.idAmizade} className="amigo-card-full">
                                            <div className="amigo-card-img-wrapper">
                                                <img 
                                                    src={getProfileImageUrl(amigo.fotoPerfil)} 
                                                    alt={amigo.nome} 
                                                    onError={(e) => {e.target.src=DEFAULT_AVATAR_URL}}
                                                />
                                            </div>
                                            <div className="amigo-card-info">
                                                <h3>{amigo.nome}</h3>
                                                <span className={amigo.online ? "status-badge online" : "status-badge offline"}>
                                                    {amigo.online ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                            <div className="amigo-card-actions">
                                                <button onClick={() => navigate(`/mensagens?dm=${amigo.idUsuario}`)} className="btn-msg">
                                                    <FontAwesomeIcon icon={faPaperPlane} />
                                                </button>
                                                <Link to={`/perfil/${amigo.idUsuario}`} className="btn-perfil">
                                                    Ver Perfil
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                
                <RightSidebar />
            </div>
        </div>
    );
};

export default Amizades;