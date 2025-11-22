import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    // Ícones do Perfil
    faEnvelope,
    faCalendarAlt,
    faPen,
    // Ícones das Postagens
    faThumbsUp,
    faComment,
    faEllipsisH,
    faSpinner,
    faChevronLeft,
    faChevronRight,
    faPaperPlane,
    faReply,
    faTimes,
    faTrash,
    faImage,
    // ÍCONES DOS BOTÕES
    faUserPlus,
    faCommentDots,
    faClockRotateLeft,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

// Contexto e Componentes
import { useWebSocket } from '../../contexts/WebSocketContext.tsx'; 
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar';
import EditarPerfilModal from './EditarPerfilModal';

// Estilos
import '../../pages/Principal/Principal.css';
import './Perfil.css';
import './EditarPerfilModal.css';

// =================================================================
// FUNÇÕES HELPER
// =================================================================
const getCorrectImageUrl = (url) => {
    const placeholder = "https://via.placeholder.com/40";
    if (!url) return placeholder;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("/")) return `http://localhost:8080${url}`;
    return `http://localhost:8080/alunoPictures/${url}`; 
};

const formatarData = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return seconds + "s";
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "a";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return Math.floor(seconds) + "s";
};

const buildCommentTree = (comments) => {
  if (!comments || comments.length === 0) return [];
  const commentsMap = {};
  const tree = [];
  comments.forEach((comment) => {
    commentsMap[comment.id] = { ...comment, replies: [] };
  });
  Object.values(commentsMap).forEach((comment) => {
    if (comment.parentId) {
      const parent = commentsMap[comment.parentId];
      if (parent) {
        parent.replies.push(comment);
      } else {
        tree.push(comment);
      }
    } else {
      tree.push(comment);
    }
  });
  return tree;
};

// =================================================================
// SUB-COMPONENTE: POSTEDITOR
// =================================================================
const PostEditor = ({ post, onCancel, onSave }) => {
  const [editedText, setEditedText] = useState(post.conteudo);
  const [keptMediaUrls, setKeptMediaUrls] = useState(post.urlsMidia || []);
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [urlsParaRemover, setUrlsParaRemover] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesWithPreview = Array.from(e.target.files).map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );
      setNewMediaFiles((prevFiles) => [...prevFiles, ...filesWithPreview]);
    }
  };

  useEffect(() => {
    return () => {
      newMediaFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [newMediaFiles]);

  const handleRemoveKeptUrl = (urlToRemove) => {
    setKeptMediaUrls(keptMediaUrls.filter((url) => url !== urlToRemove));
    setUrlsParaRemover((prev) => [...prev, urlToRemove]);
  };

  const handleRemoveNewFile = (indexToRemove) => {
    setNewMediaFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    const formData = new FormData();
    const postData = {
      conteudo: editedText,
      urlsParaRemover: urlsParaRemover,
    };
    formData.append(
      "postagem",
      new Blob([JSON.stringify(postData)], { type: "application/json" })
    );
    newMediaFiles.forEach((file) => {
      formData.append("arquivos", file);
    });
    
    await onSave(formData, post.id); 
    setIsSaving(false);
  };

  const totalMedia = keptMediaUrls.length + newMediaFiles.length;

  return (
    <div className="post-editor-inline">
      <textarea
        className="editor-textarea"
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        autoFocus
      />
      <div className="edit-media-container">
        {keptMediaUrls.map((url, index) => {
          const fullUrl = getCorrectImageUrl(url);
          const isVideo = fullUrl.match(/\.(mp4|webm|ogg)$/i);
          return (
            <div key={`kept-${index}`} className="edit-media-item">
              {isVideo ? (
                <video src={fullUrl} controls={false} />
              ) : (
                <img src={fullUrl} alt={`Mídia existente ${index + 1}`} />
              )}
              <button
                type="button"
                onClick={() => handleRemoveKeptUrl(url)}
                className="remove-media-btn"
                title="Remover mídia"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          );
        })}
        {newMediaFiles.map((file, index) => {
          const isVideo = file.type.startsWith("video/");
          return (
            <div key={`new-${index}`} className="edit-media-item">
              {isVideo ? (
                <video src={file.preview} controls={false} />
              ) : (
                <img src={file.preview} alt={file.name} />
              )}
              <button
                type="button"
                onClick={() => handleRemoveNewFile(index)}
                className="remove-media-btn"
                title="Remover mídia"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="post-editor-footer">
        <div className="editor-actions-left">
          <label
            htmlFor={`edit-file-upload-${post.id}`}
            className="file-upload-label small"
          >
            <FontAwesomeIcon icon={faImage} />
            <span>Adicionar Mídia</span>
          </label>
          <input
            id={`edit-file-upload-${post.id}`}
            className="hidden-file-input"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            multiple
          />
        </div>
        <div className="editor-actions">
          <button className="cancel-btn" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </button>
          <button
            className="publish-btn"
            disabled={(!editedText.trim() && totalMedia === 0) || isSaving}
            onClick={handleSaveClick}
          >
            {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// SUB-COMPONENTE: Comment
// =================================================================
const Comment = ({
  comment,
  currentUser,
  onLikeComment,
  onReplyClick,
  postId,
  depth = 1, 
}) => {
  const [repliesVisible, setRepliesVisible] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const showViewRepliesButton = hasReplies && depth === 1;
  const areRepliesShown = (depth === 1 && repliesVisible) || depth > 1;
  const userImage = getCorrectImageUrl(comment.urlFotoAutor);

  return (
    <>
      <div className="comment-item">
        <div className="avatar-small">
          <img src={userImage} alt={comment.nomeAutor} />
        </div>
        <div className="comment-body">
          <div className="comment-content">
             <Link to={`/perfil/${comment.autorId}`} className="comment-author-name">
                <strong>{comment.nomeAutor}</strong>
             </Link>
            <p>
              {comment.replyingToName && (
                <strong className="reply-tag">@{comment.replyingToName}</strong>
              )}{" "}
              {comment.conteudo}
            </p>
          </div>
          <div className="comment-actions-below">
            <span>{formatarData(comment.dataCriacao)}</span>
            ·
            <button
              className={`comment-action-btn ${
                comment.curtidoPeloUsuario ? "liked" : ""
              }`}
              onClick={() => onLikeComment(postId, comment.id)}
            >
              <FontAwesomeIcon icon={faThumbsUp} /> (
              {Number.isInteger(comment.totalCurtidas)
                ? comment.totalCurtidas
                : 0}
              )
            </button>
            ·
            <button
              className="comment-action-btn"
              onClick={() => onReplyClick(comment)}
            >
              <FontAwesomeIcon icon={faReply} />
              Responder
            </button>
          </div>
          {showViewRepliesButton && !repliesVisible && (
            <button
              className="comment-view-replies"
              onClick={() => setRepliesVisible(true)}
            >
              Ver {comment.replies.length} resposta
              {comment.replies.length > 1 ? "s" : ""}
            </button>
          )}
          {showViewRepliesButton && repliesVisible && (
            <button
              className="comment-view-replies"
              onClick={() => setRepliesVisible(false)}
            >
              Ocultar respostas
            </button>
          )}
        </div>
      </div> 
      {hasReplies && areRepliesShown && (
        <div className="comment-replies-list" style={{ paddingLeft: '15px' }}> 
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onLikeComment={onLikeComment}
              onReplyClick={onReplyClick}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
};

// =================================================================
// SUB-COMPONENTE: CommentSection
// =================================================================
const CommentSection = ({
  postId,
  comments = [],
  currentUser,
  stompClient,
  isConnected,
  onLikeComment,
}) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userImage = getCorrectImageUrl(currentUser?.urlFotoPerfil);
  const [replyingTo, setReplyingTo] = useState(null);
  const commentInputRef = useRef(null);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!isConnected || !stompClient) {
      alert("A conexão com o chat não está ativa. Tente novamente.");
      return;
    }
    setIsSubmitting(true);
    const payload = {
      conteudo: commentText,
      parentId: replyingTo ? replyingTo.id : null,
    };
    const destination = `/app/postagem/${postId}/comentar`; 
    try {
      stompClient.publish({
        destination: destination,
        body: JSON.stringify(payload),
      });
      setCommentText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Erro ao enviar comentário via WebSocket:", error);
      alert("Falha ao comentar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyClick = (comment) => {
    setReplyingTo(comment);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  return (
    <div className="comment-section">
      <form className="comment-form" onSubmit={handleSubmitComment}>
        {replyingTo && (
          <div className="replying-to-banner">
            <span>
              Respondendo a <strong>@{replyingTo.nomeAutor}</strong>
            </span>
            <button
              type="button"
              className="cancel-reply-btn"
              onClick={() => setReplyingTo(null)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}
        <div className="comment-input-wrapper">
          <div className="avatar-small">
            <img src={userImage} alt="Seu Perfil" />
          </div>
          <input
            ref={commentInputRef}
            type="text"
            placeholder="Escreva um comentário..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting || !isConnected}
          />
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={isSubmitting || !commentText.trim() || !isConnected}
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
        </div>
      </form>
      <div className="comment-list">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onLikeComment={onLikeComment}
              onReplyClick={handleReplyClick}
              postId={postId}
              depth={1}
            />
          ))
        ) : (
          <p style={{ textAlign: "center", fontSize: "0.9em", color: "#888", paddingTop: "10px" }}>
            Nenhum comentário ainda.
          </p>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENTE: PostagemItem
// =========================================================================
const PostagemItem = ({
    post,
    loggedInUser,
    activeCommentBox,
    handleToggleComments,
    handleLike,
    handleLikeComment, 
    activePostMenu,
    handleTogglePostMenu,
    handleEditPost,
    handleDeletePost,
    currentUser, 
    stompClient,
    isConnected
}) => {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const scrollerRef = useRef(null);

    const handleMediaScroll = () => {
        if (scrollerRef.current) {
            const scrollLeft = scrollerRef.current.scrollLeft;
            const itemWidth = scrollerRef.current.clientWidth;
            const newIndex = Math.round(scrollLeft / itemWidth);
            setCurrentMediaIndex(newIndex);
        }
    };

    const scrollMedia = (direction) => {
        if (scrollerRef.current) {
            const itemWidth = scrollerRef.current.clientWidth;
            const newScrollLeft = scrollerRef.current.scrollLeft + direction * itemWidth;
            scrollerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        }
    };

    const autorImage = getCorrectImageUrl(post.urlFotoAutor);
    const isMyPost = loggedInUser && loggedInUser.id === post.autorId;
    const totalCurtidas = Number.isInteger(post.totalCurtidas) ? post.totalCurtidas : 0;
    
    const commentTree = buildCommentTree(post.comentarios);
    const totalComentarios = Array.isArray(post.comentarios) ? post.comentarios.length : 0;

    return (
        <div className="post-card">
            <div className="post-header">
                <Link to={`/perfil/${post.autorId}`} className="post-author-link">
                    <img src={autorImage} alt={post.nomeAutor} className="post-author-img" />
                    <div className="post-author-info">
                        <strong>{post.nomeAutor}</strong>
                        <span>{formatarData(post.dataCriacao)}</span>
                    </div>
                </Link>
                
                {isMyPost && (
                    <div
                      className="post-options-btn"
                      onClick={() => handleTogglePostMenu(post.id)} 
                    >
                      <FontAwesomeIcon icon={faEllipsisH} />
                    </div>
                )}

                {activePostMenu === post.id && ( 
                    <div className="post-options-dropdown">
                      <button onClick={() => handleEditPost(post)}>
                        <FontAwesomeIcon icon={faPen} /> Editar Postagem
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="danger"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Excluir Postagem
                      </button>
                    </div>
                )}
            </div>
            <div className="post-content">
                <p>{post.conteudo}</p>
            </div>
            {post.urlsMidia && post.urlsMidia.length > 0 && (
                <div className="post-media-container">
                    {post.urlsMidia.length > 1 && currentMediaIndex > 0 && (
                        <button className="media-nav-btn prev" onClick={() => scrollMedia(-1)}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                    )}
                    <div className="post-media-scroller" ref={scrollerRef} onScroll={handleMediaScroll}>
                        {post.urlsMidia.map((url, index) => (
                            <div key={index} className="post-media-item">
                                <img src={getCorrectImageUrl(url)} alt={`Mídia ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                    {post.urlsMidia.length > 1 && currentMediaIndex < post.urlsMidia.length - 1 && (
                        <button className="media-nav-btn next" onClick={() => scrollMedia(1)}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    )}
                    {post.urlsMidia.length > 1 && (
                        <div className="media-dots">
                            {post.urlsMidia.map((_, index) => (
                                <span key={index} className={`dot ${index === currentMediaIndex ? 'active' : ''}`}></span>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div className="post-actions">
                <button
                    onClick={() => handleLike(post.id)}
                    className={post.curtidoPeloUsuario ? "liked" : ""}
                >
                    <FontAwesomeIcon icon={faThumbsUp} />
                    Curtir ({totalCurtidas})
                </button>
                <button onClick={() => handleToggleComments(post.id)}>
                    <FontAwesomeIcon icon={faComment} />
                    Comentar ({totalComentarios})
                </button>
            </div>
            {activeCommentBox === post.id && (
                <CommentSection
                    postId={post.id}
                    comments={commentTree} 
                    currentUser={currentUser}
                    stompClient={stompClient}
                    isConnected={isConnected}
                    onLikeComment={handleLikeComment}
                />
            )}
        </div>
    );
};

// =========================================================================
// ✅ COMPONENTE PRINCIPAL: Perfil (CORRIGIDO: BOTÃO DE CHAT SEMPRE VISÍVEL)
// =========================================================================
const Perfil = ({ onLogout }) => {
    const [profileData, setProfileData] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [postagens, setPostagens] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [friendshipStatus, setFriendshipStatus] = useState(null);

    const { userId } = useParams();
    const navigate = useNavigate(); 
    
    const { stompClient, isConnected } = useWebSocket();
    const [activeCommentBox, setActiveCommentBox] = useState(null);
    const [activePostMenu, setActivePostMenu] = useState(null);
    const [editingPost, setEditingPost] = useState(null);

   const handleToggleComments = (postId) => {
        setActiveCommentBox((prev) => (prev === postId ? null : postId));
    };

    useEffect(() => {
        const handleFeedUpdate = (message) => {
            try {
                const payload = JSON.parse(message.body);
                const updatedPost = payload.postagem || payload;
                
                if (!updatedPost || !updatedPost.id) {
                   if (payload.tipo === "remocao" && payload.postagemId) {
                     setPostagens((currentPostagens) => 
                       currentPostagens.filter((p) => p.id !== payload.postagemId)
                     );
                   }
                   return;
                }

                const postId = updatedPost.id;

                setPostagens((currentPostagens) => { 
                    const postIndex = currentPostagens.findIndex((p) => p.id === postId);

                    if (postIndex > -1) {
                        const newPosts = [...currentPostagens];
                        const oldPost = currentPostagens[postIndex];
                        const mergedComentarios = (updatedPost.comentarios || []).map(newComment => {
                            const oldComment = (oldPost.comentarios || []).find(c => c.id === newComment.id);
                            if (oldComment) {
                                return { ...newComment, curtidoPeloUsuario: oldComment.curtidoPeloUsuario };
                            }
                            return { ...newComment, curtidoPeloUsuario: false }; 
                        });
                        const mergedPost = {
                            ...updatedPost,
                            comentarios: mergedComentarios,
                            curtidoPeloUsuario: oldPost.curtidoPeloUsuario 
                        };
                        newPosts[postIndex] = mergedPost;
                        return newPosts;
                    } else if (payload.tipo !== "remocao") {
                         if (updatedPost.autorId === profileData?.id) {
                            return [updatedPost, ...currentPostagens];
                         }
                    }
                    return currentPostagens;
                });
            } catch (error) {
                console.error("Falha ao processar mensagem do WebSocket no Perfil:", error);
            }
        };

        if (isConnected && stompClient && profileData) { 
            const subscription = stompClient.subscribe("/topic/publico", handleFeedUpdate);
            return () => {
                if (subscription) subscription.unsubscribe();
            };
        }
    }, [isConnected, stompClient, profileData]);

    const fetchPageData = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            onLogout();
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsLoading(true);
        setPostagens([]);
        setFriendshipStatus(null);

        let meResponse;
        try {
            meResponse = await axios.get('http://localhost:8080/usuarios/me');
            setLoggedInUser(meResponse.data);
        } catch (error) {
            console.error("Erro ao buscar usuário logado:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                onLogout();
            }
            return;
        }

        const isMyProfile = !userId || (meResponse.data.id.toString() === userId);
        const apiUrl = isMyProfile
            ? 'http://localhost:8080/usuarios/me'
            : `http://localhost:8080/usuarios/${userId}`;
        
        let perfilId;

        try {
            const profileResponse = await axios.get(apiUrl);
            setProfileData(profileResponse.data);
            perfilId = profileResponse.data.id;
            document.title = `Senai Community | ${profileResponse.data.nome}`;

             if (!isMyProfile) {
                 try {
                    const statusResponse = await axios.get(`http://localhost:8080/usuarios/buscar?nome=${profileResponse.data.nome}`);
                    const foundUser = statusResponse.data.find(user => user.id === profileResponse.data.id);
                    if (foundUser) {
                        setFriendshipStatus(foundUser.statusAmizade);
                    } else {
                        setFriendshipStatus('NENHUMA');
                    }
                 } catch (statusError) {
                     console.error("Erro ao buscar status de amizade:", statusError);
                     setFriendshipStatus('NENHUMA'); 
                 }
             }

        } catch (error) {
            console.error("Erro ao buscar dados do perfil:", error);
            setIsLoading(false);
            return;
        }

        if (perfilId) {
            try {
                const postagensResponse = await axios.get(`http://localhost:8080/postagem/usuario/${perfilId}`);
                const postsComComentariosOrdenados = postagensResponse.data.map(post => ({
                    ...post,
                    comentarios: (post.comentarios || []).sort((a, b) => {
                        if (a.destacado !== b.destacado) return b.destacado ? 1 : -1;
                        return new Date(a.dataCriacao) - new Date(b.dataCriacao);
                    })
                }));
                setPostagens(postsComComentariosOrdenados);
            } catch (error) {
                console.error("Erro ao buscar postagens do usuário:", error);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPageData();
    }, [onLogout, userId]);

    const handleLike = async (postId) => {
        const likeEndpoint = `http://localhost:8080/curtidas/toggle`;
        const payload = { postagemId: postId, comentarioId: null };
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        setPostagens(currentPosts => currentPosts.map(p => {
          if (p.id === postId) {
            const curtidas = Number.isInteger(p.totalCurtidas) ? p.totalCurtidas : 0;
            return {
              ...p,
              curtidoPeloUsuario: !p.curtidoPeloUsuario,
              totalCurtidas: p.curtidoPeloUsuario ? curtidas - 1 : curtidas + 1
            };
          }
          return p;
        }));
        try {
          await axios.post(likeEndpoint, payload, { headers });
        } catch (error) {
          console.error("Erro ao curtir post:", error);
          alert("Não foi possível curtir a postagem.");
          fetchPageData(); 
        }
    };
    
    const handleLikeComment = async (postId, commentId) => {
        if (!postId) return;
        const likeEndpoint = `http://localhost:8080/curtidas/toggle`;
        const payload = { postagemId: null, comentarioId: commentId };
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        setPostagens(currentPosts => currentPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comentarios: p.comentarios.map(c => {
                 if (c.id === commentId) {
                      const curtidas = Number.isInteger(c.totalCurtidas) ? c.totalCurtidas : 0;
                      return { ...c, curtidoPeloUsuario: !c.curtidoPeloUsuario, totalCurtidas: c.curtidoPeloUsuario ? curtidas - 1 : curtidas + 1 };
                 }
                 return c;
              })
            };
          }
          return p;
        }));
        try {
          await axios.post(likeEndpoint, payload, { headers });
        } catch (error) {
          console.error("Erro ao curtir comentário:", error);
          fetchPageData();
        }
    };

    const handleTogglePostMenu = (postId) => {
        setActivePostMenu((prevId) => (prevId === postId ? null : postId));
    };
    const handleEditPost = (post) => {
        setEditingPost(post);
        setActivePostMenu(null); 
    };
    const handleDeletePost = async (postId) => {
        setActivePostMenu(null); 
        const result = await Swal.fire({
          title: "Você tem certeza?",
          text: "Esta ação não pode ser revertida!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "var(--danger)",
          cancelButtonColor: "var(--bg-quaternary)",
          confirmButtonText: "Sim, excluir postagem",
          cancelButtonText: "Cancelar",
        });
        if (result.isConfirmed) {
          const deleteEndpoint = `http://localhost:8080/postagem/${postId}`;
          const token = localStorage.getItem("authToken");
          const headers = { Authorization: `Bearer ${token}` };
          try {
            await axios.delete(deleteEndpoint, { headers });
            setPostagens((prevPosts) => prevPosts.filter((p) => p.id !== postId)); 
            Swal.fire("Excluída!", "Sua postagem foi excluída.", "success");
          } catch (error) {
            console.error("Erro ao excluir post:", error);
            alert("Não foi possível excluir a postagem.");
          }
        }
    };
    const handleSaveEdit = async (formData, postId) => {
        const updateEndpoint = `http://localhost:8080/postagem/${postId}`;
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };
        try {
          await axios.put(updateEndpoint, formData, { headers });
          setEditingPost(null); 
        } catch (error) {
          console.error("Erro ao salvar edição:", error);
          alert("Não foi possível salvar as alterações.");
        }
    };

    const handleSaveProfile = async (novosDados) => {
        const { nome, bio, arquivoFoto } = novosDados;
        const token = localStorage.getItem('authToken');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setIsSaving(true);
        try {
            await axios.put('http://localhost:8080/usuarios/me', { nome, bio });
            if (arquivoFoto) {
                const formData = new FormData();
                formData.append('foto', arquivoFoto);
                await axios.put('http://localhost:8080/usuarios/me/foto', formData);
            }
            await fetchPageData(); 
            const meResponse = await axios.get('http://localhost:8080/usuarios/me');
            setLoggedInUser(meResponse.data);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnect = async () => {
        try {
            await axios.post(`http://localhost:8080/api/amizades/solicitar/${profileData.id}`);
            setFriendshipStatus('SOLICITACAO_ENVIADA'); 
            Swal.fire('Sucesso!', 'Solicitação de amizade enviada.', 'success');
        } catch (error) {
            console.error("Erro ao enviar solicitação:", error);
            const errorMsg = error.response?.data?.message || 'Não foi possível enviar a solicitação.';
            Swal.fire('Erro', errorMsg, 'error');
        }
    };

    const handleChat = () => {
        navigate(`/mensagens?dm=${profileData.id}`);
    };

    if (isLoading || !profileData || !loggedInUser) {
        return <div>Carregando perfil...</div>;
    }

    let userImage;
    if (profileData.urlFotoPerfil && profileData.urlFotoPerfil.startsWith('http')) {
        userImage = profileData.urlFotoPerfil;
    } else if (profileData.urlFotoPerfil) {
        userImage = getCorrectImageUrl(profileData.urlFotoPerfil); 
    } else {
        userImage = "https://via.placeholder.com/150";
    }
    const userDob = profileData.dataNascimento
        ? new Date(profileData.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : 'Não informado';

    const isMyProfile = loggedInUser.id === profileData.id;

    return (
        <>
            <Topbar
                onLogout={onLogout}
                currentUser={loggedInUser}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            <div className="container">
                <Sidebar
                    currentUser={loggedInUser}
                    isOpen={isSidebarOpen}
                />

                <main className="main-content">
                    <div className="profile-page">
                        <div className="profile-header">
                            <div className="profile-banner"></div>
                            <div className="profile-details">
                                <div className="profile-picture-container">
                                    <img src={userImage} alt="Foto do Perfil" id="profile-pic-img" />
                                </div>
                                <div className="profile-info-actions">
                                    <div className="profile-info">
                                        <h1 id="profile-name">{profileData.nome}</h1>
                                        <p id="profile-title">{profileData.tipoUsuario}</p>
                                    </div>

                                    <div className="profile-actions">
                                        {isMyProfile ? (
                                            <button
                                                className="btn btn-primary"
                                                id="edit-profile-btn-page"
                                                onClick={() => setIsModalOpen(true)}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Salvando...' : (
                                                    <><FontAwesomeIcon icon={faPen} /> Editar Perfil</>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="profile-actions-other">
                                                
                                                {/* ✅ MUDANÇA PRINCIPAL: Botão de Chat SEMPRE visível aqui */}
                                                <button className="btn btn-secondary" onClick={handleChat}>
                                                    <FontAwesomeIcon icon={faCommentDots} /> Conversar
                                                </button>

                                                {/* Botão de Conexão Condicional */}
                                                {friendshipStatus === 'NENHUMA' && (
                                                    <button className="btn btn-primary" onClick={handleConnect}>
                                                        <FontAwesomeIcon icon={faUserPlus} /> Conectar
                                                    </button>
                                                )}
                                                {friendshipStatus === 'SOLICITACAO_ENVIADA' && (
                                                    <button className="btn btn-secondary" disabled>
                                                        <FontAwesomeIcon icon={faClockRotateLeft} /> Pendente
                                                    </button>
                                                )}
                                                {friendshipStatus === 'SOLICITACAO_RECEBIDA' && (
                                                    <Link to="/conexoes" className="btn btn-primary">
                                                        Responder
                                                    </Link>
                                                )}
                                                {friendshipStatus === 'AMIGOS' && (
                                                    <button className="btn btn-secondary" disabled>
                                                        <FontAwesomeIcon icon={faCheck} /> Amigos
                                                    </button>
                                                )}
                                                {/* O botão de chat antigo que ficava aqui embaixo foi removido pois já está lá em cima */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="profile-body">
                            <div className="widget-card">
                                <h3>Sobre</h3>
                                <p id="profile-bio">{profileData.bio || 'Nenhuma bio informada.'}</p>
                                <ul className="profile-metadata">
                                    <li><FontAwesomeIcon icon={faEnvelope} /><span id="profile-email">{profileData.email}</span></li>
                                    <li><FontAwesomeIcon icon={faCalendarAlt} />Nascido em <span id="profile-dob">{userDob}</span></li>
                                </ul>
                            </div>

                            <div className="profile-posts-container">
                                <h3>Postagens de {profileData.nome.split(' ')[0]}</h3>
                                {isLoading && postagens.length === 0 && <p>Carregando postagens...</p>}
                                {!isLoading && postagens.length > 0 ? (
                                    <div className="feed-lista">
                                        {postagens.map(post => {
                                            if (editingPost && editingPost.id === post.id) {
                                                return (
                                                    <PostEditor
                                                        key={post.id}
                                                        post={editingPost}
                                                        onCancel={() => setEditingPost(null)}
                                                        onSave={handleSaveEdit}
                                                    />
                                                );
                                            }
                                            return (
                                                <PostagemItem
                                                    key={post.id}
                                                    post={post}
                                                    loggedInUser={loggedInUser}
                                                    activeCommentBox={activeCommentBox}
                                                    handleToggleComments={handleToggleComments}
                                                    handleLike={handleLike}
                                                    handleLikeComment={handleLikeComment}
                                                    currentUser={loggedInUser} 
                                                    stompClient={stompClient}
                                                    isConnected={isConnected}
                                                    activePostMenu={activePostMenu}
                                                    handleTogglePostMenu={handleTogglePostMenu}
                                                    handleEditPost={handleEditPost}
                                                    handleDeletePost={handleDeletePost}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    !isLoading && (
                                        <div className="widget-card">
                                            <p>{profileData.nome.split(' ')[0]} ainda não fez nenhuma postagem.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </main>
                <RightSidebar />
            </div>

            {isModalOpen && isMyProfile && (
                <EditarPerfilModal
                    user={profileData}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveProfile}
                />
            )}
        </>
    );
};

export default Perfil;