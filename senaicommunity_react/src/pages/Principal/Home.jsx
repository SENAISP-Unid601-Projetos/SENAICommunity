import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

const Home = ({ onLogout }) => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Senai Community | Principal';
    }, []);

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <h1>Senai Community</h1>
                <button onClick={handleLogout} className="logout-btn">Sair</button>
            </header>
            <main className="home-content">
                <h2>Página Principal</h2>
                <p>Aqui ficará o conteúdo do seu feed, projetos, etc.</p>
            </main>
        </div>
    );
};

export default Home;