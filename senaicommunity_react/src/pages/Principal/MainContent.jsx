import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faVideo, faCode, faThumbsUp, faComment, faShareSquare, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Componente para criar um novo post
const PostCreator = ({ currentUser }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [postText, setPostText] = useState('');

    const userImage = currentUser?.urlFotoPerfil || "https://via.placeholder.com/40";

    const handlePublish = async () => {
        if (!postText.trim()) return;

        const postData = { conteudo: postText };
        const formData = new FormData();
        formData.append(
            "postagem",
            new Blob([JSON.stringify(postData)], { type: "application/json" })
        );
        
        try {
            await axios.post('http://localhost:8080/postagem/upload-mensagem', formData);
            setPostText('');
            setIsExpanded(false);
            // O post aparecerá via WebSocket, não precisa recarregar a lista manualmente
        } catch (error) {
            console.error("Erro ao publicar:", error);
            alert("Não foi possível publicar a postagem.");
        }
    };

    if (isExpanded) {
        return (
            <div className="post-creator-expanded" style={{ display: 'block' }}>
                <div className="editor-header"><h3>Criar Publicação</h3></div>
                <textarea 
                    className="editor-textarea" 
                    placeholder={`No que você está pensando, ${currentUser?.nome || ''}?`}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    autoFocus
                />
                <div className="post-editor-footer">
                    <div className="editor-actions">
                        <button className="cancel-btn" onClick={() => setIsExpanded(false)}>Cancelar</button>
                        <button className="publish-btn" disabled={!postText.trim()} onClick={handlePublish}>Publicar</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="post-creator-simple" onClick={() => setIsExpanded(true)}>
            <div className="post-creator-trigger">
                <div className="avatar-small"><img src={userImage} alt="Seu Perfil" /></div>
                <input type="text" placeholder="Começar publicação" readOnly />
            </div>
            <div className="post-options">
                <button className="option-btn"><FontAwesomeIcon icon={faImage} /> Foto</button>
                <button className="option-btn"><FontAwesomeIcon icon={faVideo} /> Vídeo</button>
                <button className="option-btn"><FontAwesomeIcon icon={faCode} /> Código</button>
            </div>
        </div>
    );
};

// Componente principal do conteúdo central
const MainContent = ({ currentUser }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/chat/publico');
                // Ordena os posts por data, do mais novo para o mais antigo
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
                <PostCreator currentUser={currentUser} />
            </div>

            <div className="feed-separator"><hr/></div>
            
            <div className="posts-container">
                {isLoading ? (
                    <p>Carregando feed...</p>
                ) : (
                    posts.map(post => (
                        <div className="post" key={post.id}>
                            <div className="post-header">
                                <div className="post-author">
                                    <div className="post-icon"><img src={post.urlFotoAutor || 'https://via.placeholder.com/40'} alt={post.nomeAutor} /></div>
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
                    ))
                )}
            </div>
        </main>
    );
};

export default MainContent;