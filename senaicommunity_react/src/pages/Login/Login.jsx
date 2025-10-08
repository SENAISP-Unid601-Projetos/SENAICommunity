import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

// Importações do Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

// Importação de Componentes e Estilos
import Background from '../../components/Auth/Background';
import ThemeToggle from '../../components/Auth/ThemeToggle';
import './login.css'; // O CSS corrigido que ajusta o alinhamento dos ícones

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Define o título da página quando o componente é montado
    useEffect(() => {
        document.title = 'Senai Community | Login';
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8080/autenticacao/login', {
                email,
                senha
            });

            const token = response.data.token;
            localStorage.setItem('authToken', token); // Armazena o token de autenticação

            onLogin(token); // Informa ao App.jsx que o login foi bem-sucedido
            
            // Redireciona para a página principal
            navigate('/principal');

        } catch (error) {
            console.error('Erro no login:', error);
            const errorMessage = error.response?.data || 'E-mail ou senha incorretos.';
            Swal.fire({ icon: 'error', title: 'Erro no Login', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Background />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo">
                            <FontAwesomeIcon icon={faCode} />
                            <span>Senai<span className="highlight">Community</span></span>
                        </div>
                        <h1>Bem-vindo de volta</h1>
                        <p className="subtext">Faça login para acessar sua conta</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <FontAwesomeIcon icon={faEnvelope} />
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        
                        <div className="input-group">
                            <FontAwesomeIcon icon={faLock} />
                            <input 
                                type={isPasswordVisible ? "text" : "password"} 
                                name="senha" 
                                placeholder="Senha" 
                                value={senha} 
                                onChange={(e) => setSenha(e.target.value)} 
                                required 
                            />
                            <button type="button" className="toggle-password" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                                <FontAwesomeIcon icon={isPasswordVisible ? faEyeSlash : faEye} />
                            </button>
                        </div>
                        
                        <div className="auth-options">
                            <label className="checkbox">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Lembrar de mim
                            </label>
                            <a href="#" className="text-link">Esqueceu a senha?</a>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Entrar'}
                        </button>
                        
                        <div className="auth-footer">
                            <p>Não tem uma conta? <Link to="/cadastro" className="text-link">Cadastre-se</Link></p>
                        </div>
                    </form>
                </div>
            </div>
            <ThemeToggle />
        </>
    );
};

export default Login;