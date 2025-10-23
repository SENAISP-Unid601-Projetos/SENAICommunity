import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ IMPORTADO para navegação
import axios from 'axios';
import Swal from 'sweetalert2';
import IMask from 'imask';

// Importando componentes e estilos
import Background from '../../components/Auth/Background';
import ThemeToggle from '../../components/Auth/ThemeToggle';
import InputField from '../../components/Auth/InputField';
import FileUpload from '../../components/Auth/FileUpload';
import '../Login/login.css'; // Estilos base
import './cadastro.css'; // Estilos da página

// Componente principal da página de Cadastro
const Cadastro = () => {
    // ✅ HOOK para navegação
    const navigate = useNavigate();

    // Estado para guardar os dados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        curso: '',
        periodo: '',
        dataNascimento: '',
        foto: null,
        terms: false,
    });
    
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [loading, setLoading] = useState(false);

    // Efeito para mudar o título da página
    useEffect(() => {
        document.title = 'Senai Community | Cadastro';
    }, []);

    // Efeito para aplicar a máscara no campo de data
    useEffect(() => {
        const dateElement = document.getElementById('dataNascimento');
        if (dateElement) {
            const mask = IMask(dateElement, { mask: '00/00/0000' });
            // Limpa a máscara quando o componente é desmontado para evitar memory leaks
            return () => mask.destroy();
        }
    }, []);
    
    // Função para lidar com mudanças nos inputs
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (name === 'senha') {
            checkPasswordStrength(value);
        }

        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : files ? files[0] : value
        }));
    };

    // Lógica para verificar a força da senha
    const checkPasswordStrength = (password) => {
        let score = 0;
        if (!password) { setPasswordStrength(0); return; }
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score < 3) setPasswordStrength(1);
        else if (score < 5) setPasswordStrength(2);
        else setPasswordStrength(3);
    };
    
    // Função para submeter o formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.senha !== formData.confirmarSenha) {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'As senhas não coincidem!' });
            return;
        }
        
        if (!formData.terms) {
            Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Você deve aceitar os termos e a política de privacidade.' });
            return;
        }

        // Formata a data para o backend (AAAA-MM-DD)
        const [dia, mes, ano] = formData.dataNascimento.split('/');
        // Validação simples da data
        if (!dia || !mes || !ano || ano.length !== 4) {
            Swal.fire({ icon: 'error', title: 'Data inválida', text: 'Por favor, insira uma data de nascimento válida no formato DD/MM/AAAA.' });
            return;
        }
        const formattedDate = `${ano}-${mes}-${dia}`;

        const submissionData = new FormData();
        submissionData.append('nome', formData.nome);
        submissionData.append('email', formData.email);
        submissionData.append('senha', formData.senha);
        submissionData.append('curso', formData.curso);
        submissionData.append('periodo', formData.periodo);
        submissionData.append('dataNascimento', formattedDate);
        if (formData.foto) {
            submissionData.append('foto', formData.foto);
        }

        setLoading(true);

        try {
            // Este POST estava falhando por causa do CORS, não por causa deste código.
            // A lógica de não enviar 'Content-Type' está CORRETA.
            await axios.post('http://localhost:8080/cadastro/alunos', submissionData);

            await Swal.fire({
                icon: 'success', title: 'Cadastro realizado!',
                text: 'Você será redirecionado para a tela de login.',
                timer: 2500, showConfirmButton: false, allowOutsideClick: false
            });
            
            navigate('/login'); 
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            const errorMessage = error.response?.status === 409 
                ? 'Este e-mail já está cadastrado!' 
                : 'Erro ao cadastrar. Verifique os dados e tente novamente.';
            Swal.fire({ icon: 'error', title: 'Erro no Cadastro', text: errorMessage });
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
                            <i className="fas fa-code"></i>
                            <span>Senai<span className="highlight">Community</span></span>
                        </div>
                        <h1>Crie sua conta</h1>
                        <p className="subtext">Preencha seus dados para começar</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <InputField icon="fas fa-user" type="text" name="nome" placeholder="Nome completo" value={formData.nome} onChange={handleChange} required />
                        <InputField icon="fas fa-envelope" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                        
                        <div className="input-group">
                            <i className="fas fa-lock"></i>
                            <input 
                                type={isPasswordVisible ? "text" : "password"} 
                                name="senha" 
                                placeholder="Senha" 
                                value={formData.senha} 
                                onChange={handleChange} 
                                required 
                            />
                            <button type="button" className="toggle-password" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                                <i className={`fas ${isPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>

                        <div className="password-strength">
                            <div className="strength-meter">
                                <div className="strength-bar" data-strength={passwordStrength}></div>
                            </div>
                        </div>

                        <InputField icon="fas fa-lock" type="password" name="confirmarSenha" placeholder="Confirmar senha" value={formData.confirmarSenha} onChange={handleChange} required />
                        <InputField icon="fas fa-graduation-cap" type="text" name="curso" placeholder="Curso" value={formData.curso} onChange={handleChange} required />

                        <div className="input-group">
                             <i className="fas fa-clock"></i>
                             <select name="periodo" value={formData.periodo} onChange={handleChange} required>
                                 <option value="" disabled>Selecione seu período</option>
                                 <option value="Manhã">Manhã</option>
                                 <option value="Tarde">Tarde</option>
                                 <option value="Noite">Noite</option>
                             </select>
                         </div>

                        <InputField icon="fas fa-birthday-cake" type="text" id="dataNascimento" name="dataNascimento" placeholder="Data de Nascimento (DD/MM/AAAA)" value={formData.dataNascimento} onChange={handleChange} required />
                        
                        <FileUpload file={formData.foto} setFile={(file) => setFormData(prev => ({ ...prev, foto: file }))} />

                        <label className="checkbox terms">
                            <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} />
                            <span className="checkmark"></span>
                            Eu concordo com os <a href="#" className="text-link">Termos</a> e <a href="#" className="text-link">Política</a>
                        </label>

                        <button type="submit" className="btn btn-primary" disabled={loading || !formData.terms}>
                            {loading ? <span className="spinner"></span> : <span className="btn-text">Cadastrar</span>}
                        </button>
                        
                        <div className="auth-footer">
                            <p>Já tem uma conta? <a href="/login" className="text-link">Faça login</a></p>
                        </div>
                    </form>
                </div>
            </div>
            <ThemeToggle />
        </>
    );
};

export default Cadastro;