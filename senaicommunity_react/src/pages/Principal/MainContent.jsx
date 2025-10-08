import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faVideo, faCode, faThumbsUp, faComment, faShareSquare, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

// Componente para criar um novo post
const PostCreator = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [postText, setPostText] = useState('');

    // Se o editor estiver expandido, mostra o textarea
    if (isExpanded) {
        return (
            <div className="post-creator-expanded" style={{ display: 'block' }}>
                <div className="editor-header"><h3>Criar Publicação</h3></div>
                <textarea 
                    className="editor-textarea" 
                    placeholder="No que você está pensando, Vinicius?"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    autoFocus
                />
                <div className="post-editor-footer">
                    <div className="editor-actions">
                        <button className="cancel-btn" onClick={() => setIsExpanded(false)}>Cancelar</button>
                        <button className="publish-btn" disabled={!postText.trim()}>Publicar</button>
                    </div>
                </div>
            </div>
        );
    }

    // Vista padrão do criador de post
    return (
        <div className="post-creator-simple" onClick={() => setIsExpanded(true)}>
            <div className="post-creator-trigger">
                <div className="avatar-small"><img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Seu Perfil" /></div>
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
const MainContent = () => {
    // ✅ CORREÇÃO: Inicializa o array de posts com dados de exemplo
    const posts = [{
        id: 1, 
        author: "Miguel Piscki", 
        avatar: "https://randomuser.me/api/portraits/men/22.jpg", 
        time: "13h",
        text: "Finalizamos hoje o projeto de automação industrial usando Arduino e sensores IoT. O sistema monitora temperatura, umidade e controla atuadores remotamente!",
        image: "https://images.unsplash.com/photo-1558522195-e1201b090344?auto=format&fit=crop&w=1470&q=80",
    }];

    return (
        <main className="main-content">
            <div className="post-creator">
                <PostCreator />
            </div>

            <div className="feed-separator"><hr/></div>
            
            <div className="posts-container">
                {posts.map(post => (
                    <div className="post" key={post.id}>
                        <div className="post-header">
                            <div className="post-author">
                                <div className="post-icon"><img src={post.avatar} alt={post.author} /></div>
                                <div className="post-info">
                                    <h2>{post.author}</h2>
                                    <span>{post.time} • <i className="fas fa-globe-americas"></i></span>
                                </div>
                            </div>
                            <div className="post-options-btn"><FontAwesomeIcon icon={faEllipsisH} /></div>
                        </div>
                        <p className="post-text">{post.text}</p>
                        {post.image && <div className="post-images"><img src={post.image} alt="Imagem do Post" /></div>}
                        <div className="post-actions">
                            <button><FontAwesomeIcon icon={faThumbsUp} /> Curtir</button>
                            <button><FontAwesomeIcon icon={faComment} /> Comentar</button>
                            <button><FontAwesomeIcon icon={faShareSquare} /> Compartilhar</button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default MainContent;