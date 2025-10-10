import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faCalendarAlt, faPen } from '@fortawesome/free-solid-svg-icons';

// Componentes de Layout (reaproveitados)
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';

// Estilos
import '../../pages/Principal/Principal.css'; // Estilo principal do layout
import './Perfil.css'; // Estilos específicos da página de perfil

const Perfil = ({ onLogout }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = 'Senai Community | Meu Perfil';

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
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                onLogout();
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentUser();
    }, [onLogout]);

    if (isLoading || !currentUser) {
        return <div>Carregando perfil...</div>;
    }

    const userImage = currentUser.urlFotoPerfil || "https://via.placeholder.com/150";
    const userDob = currentUser.dataNascimento 
        ? new Date(currentUser.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
        : 'Não informado';

    return (
        <>
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className="container">
                <Sidebar currentUser={currentUser} />

                <main className="main-content">
                    <div className="profile-page">
                        <div className="profile-header">
                            <div className="profile-banner">
                                {/* Pode adicionar uma imagem de banner aqui se quiser */}
                            </div>
                            <div className="profile-details">
                                <div className="profile-picture-container">
                                    <img src={userImage} alt="Foto do Perfil" id="profile-pic-img" />
                                </div>
                                <div className="profile-info-actions">
                                    <div className="profile-info">
                                        <h1 id="profile-name">{currentUser.nome}</h1>
                                        <p id="profile-title">{currentUser.tipoUsuario}</p>
                                    </div>
                                    <div className="profile-actions">
                                        <button className="btn btn-primary" id="edit-profile-btn-page">
                                            <FontAwesomeIcon icon={faPen} /> Editar Perfil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="profile-body">
                            <div className="widget-card">
                                <h3>Sobre</h3>
                                <p id="profile-bio">{currentUser.bio || 'Nenhuma bio informada.'}</p>
                                <ul className="profile-metadata">
                                    <li><FontAwesomeIcon icon={faEnvelope} /><span id="profile-email">{currentUser.email}</span></li>
                                    <li><FontAwesomeIcon icon={faCalendarAlt} />Nascido em <span id="profile-dob">{userDob}</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Perfil;