import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faVideo, faCode, faThumbsUp, faComment, faShareSquare, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// --- COMPONENTE POSTCREATOR CORRIGIDO ---

const PostCreator = ({ currentUser }) => {
    // 1. ESTADO ATUALIZADO: Trocamos 'isExpanded' por 'postType'
    // (null = fechado, 'text' = texto, 'photo' = foto, 'video' = video, 'code' = código)
    const [postType, setPostType] = useState(null);
    const [postText, setPostText] = useState('');
    const [postFile, setPostFile] = useState(null); // Estado para o arquivo

    const userImage = currentUser?.urlFotoPerfil 
        ? `http://localhost:8080${currentUser.urlFotoPerfil}`
        : "https://via.placeholder.com/40";

    // 2. FUNÇÃO PARA FECHAR E LIMPAR O MODAL
    const handleClose = () => {
        setPostType(null);
        setPostText('');
        setPostFile(null);
    };

    // 3. FUNÇÃO PARA LIDAR COM A SELEÇÃO DE ARQUIVO
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPostFile(e.target.files[0]);
        }
    };

    // 4. FUNÇÃO DE PUBLICAÇÃO ATUALIZADA (IMPORTANTE!)
    const handlePublish = async () => {
        const textIsEmpty = !postText.trim();
        const fileIsEmpty = !postFile;

        // Não fazer nada se ambos estiverem vazios
        if (textIsEmpty && fileIsEmpty) return;

        const formData = new FormData();
        const postData = { conteudo: postText };
        
        formData.append(
            "postagem",
            new Blob([JSON.stringify(postData)], { type: "application/json" })
        );

        let endpoint;
        
        // Se tiver um arquivo (foto ou vídeo)
        if (postFile) {
            formData.append("midia", postFile);
            // !! ATENÇÃO !!: Você provavelmente tem um endpoint diferente para
            // posts com mídia. O seu 'upload-mensagem' atual pode ser só para texto.
            // Verifique seu backend e coloque o endpoint correto aqui.
            // Estou *assumindo* que seja 'upload-midia', mas pode ser outro.
            endpoint = 'http://localhost:8080/postagem/upload-midia';
        } else {
            // Se for SÓ texto (ou código)
            endpoint = 'http://localhost:8080/postagem/upload-mensagem';
        }
        
        try {
            await axios.post(endpoint, formData, {
                 // O Axios define o 'Content-Type: multipart/form-data' sozinho
                 // quando você envia um FormData.
            });
            handleClose(); // Fecha e limpa o modal
            // TODO: Adicionar lógica para recarregar o feed
        } catch (error) {
            console.error("Erro ao publicar:", error);
            alert("Não foi possível publicar a postagem.");
        }
    };

    // --- RENDERIZAÇÃO ---

    // 5. VISTA SIMPLES (QUANDO postType === null)
    if (postType === null) {
        return (
            <div className="post-creator-simple">
                {/* O input de texto agora define o postType para 'text' */}
                <div className="post-creator-trigger" onClick={() => setPostType('text')}>
                    <div className="avatar-small"><img src={userImage} alt="Seu Perfil" /></div>
                    <input type="text" placeholder="Começar publicação" readOnly />
                </div>
                <div className="post-options">
                    {/* 6. ONCLICKS CORRIGIDOS: Cada botão define seu próprio postType */}
                    <button className="option-btn" onClick={() => setPostType('photo')}><FontAwesomeIcon icon={faImage} /> Foto</button>
                    <button className="option-btn" onClick={() => setPostType('video')}><FontAwesomeIcon icon={faVideo} /> Vídeo</button>
                    <button className="option-btn" onClick={() => setPostType('code')}><FontAwesomeIcon icon={faCode} /> Código</button>
                </div>
            </div>
        );
    }

    // 7. VISTA EXPANDIDA (QUANDO postType !== null)
    
    // Define o título e placeholder com base no tipo
    let title = "Criar Publicação";
    let placeholder = `No que você está pensando, ${currentUser?.nome || ''}?`;

    if (postType === 'photo') title = "Publicar Foto";
    if (postType === 'video') title = "Publicar Vídeo";
    if (postType === 'code') {
        title = "Publicar Código";
        placeholder = "Cole seu código aqui...";
    }
            
    return (
        <div className="post-creator-expanded" style={{ display: 'block' }}>
            <div className="editor-header"><h3>{title}</h3></div>
            <textarea 
                className="editor-textarea" 
                placeholder={placeholder}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                autoFocus
            />
            
            {/* 8. RENDERIZAÇÃO CONDICIONAL DO INPUT DE ARQUIVO */}
            {(postType === 'photo' || postType === 'video') && (
                <div className="file-uploader" style={{marginTop: '1rem'}}>
                    <input 
                        type="file" 
                        accept={postType === 'photo' ? "image/*" : "video/*"}
                        onChange={handleFileChange}
                        style={{
                            color: postFile ? 'var(--success)' : 'var(--text-secondary)',
                            marginTop: '0.5rem'
                        }}
                    />
                    {postFile && <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Arquivo selecionado: {postFile.name}</p>}
                </div>
            )}
            
            <div className="post-editor-footer">
                <div className="editor-actions">
                    {/* Botão Cancelar agora chama handleClose */}
                    <button className="cancel-btn" onClick={handleClose}>Cancelar</button>
                    <button 
                        className="publish-btn" 
                        // 9. LÓGICA DE 'DISABLED' ATUALIZADA
                        // Habilita se tiver texto OU arquivo
                        disabled={!postText.trim() && !postFile} 
                        onClick={handlePublish}
                    >
                        Publicar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MAINCONTENT (ORIGINAL E FUNCIONAL) ---

const MainContent = ({ currentUser }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/chat/publico');
                const sortedPosts = response.data.sort(
                    (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)
                );
                setPosts(sortedPosts);
            } catch (error) {
                console.error("Erro ao carregar o feed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <main className="main-content">
            <div className="post-creator">
                {/* O PostCreator corrigido será renderizado aqui */}
                <PostCreator currentUser={currentUser} />
            </div>
            <div className="feed-separator"><hr/></div>
            <div className="posts-container">
                {isLoading ? (
                    <p>Carregando feed...</p>
                ) : (
                    posts.map(post => {
                        // ✅ CORREÇÃO AQUI
                        const autorAvatar = post.urlFotoAutor
                            ? `http://localhost:8080${post.urlFotoAutor}`
                            : 'https://via.placeholder.com/40';
                        
                        return (
                            <div className="post" key={post.id}>
                                <div className="post-header">
                                    <div className="post-author">
                                        <div className="post-icon"><img src={autorAvatar} alt={post.nomeAutor} /></div>
                                        <div className="post-info">
                                            <h2>{post.nomeAutor}</h2>
                                            <span>{new Date(post.dataCriacao).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="post-options-btn"><FontAwesomeIcon icon={faEllipsisH} /></div>
                                </div>
                                <p className="post-text">{post.conteudo}</p>
                                {post.urlsMidia && post.urlsMidia.length > 0 && (
                                    <div className="post-images">
                                        <img src={post.urlsMidia[0]} alt="Imagem do Post" />
                                    </div>
                                )}
                                <div className="post-actions">
                                    <button><FontAwesomeIcon icon={faThumbsUp} /> Curtir</button>
                                    <button><FontAwesomeIcon icon={faComment} /> Comentar</button>
                                    <button><FontAwesomeIcon icon={faShareSquare} /> Compartilhar</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
};

export default MainContent;