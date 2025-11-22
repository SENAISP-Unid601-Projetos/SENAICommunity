import React, { useState, useEffect, useRef } from "react";
// Importa o WebSocketContext do local correto (.tsx)
import { useWebSocket } from "../../contexts/WebSocketContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faThumbsUp,
  faComment,
  faEllipsisH,
  faSpinner,
  faTimesCircle,
  faPaperPlane,
  faChevronLeft,
  faChevronRight,
  faPen,
  faTrash,
  faTimes,
  faReply,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

// =================================================================
// FUNÇÃO HELPER (Para corrigir URLs de imagem)
// =================================================================
const getCorrectImageUrl = (url) => {
  const placeholder = "https://via.placeholder.com/40";

  if (!url) {
    return placeholder;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `http://localhost:8080${url}`;
  }
  return `http://localhost:8080/alunoPictures/${url}`;
};

// =================================================================
// FUNÇÃO HELPER (Para formatar a data)
// =================================================================
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) {
    return seconds + "s";
  }
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + "a";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + "m";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + "d";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + "h";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + "min";
  }
  return Math.floor(seconds) + "s";
};

// =================================================================
// FUNÇÃO HELPER (Para aninhar os comentários)
// =================================================================
const buildCommentTree = (comments) => {
  if (!comments || comments.length === 0) return [];

  const commentsMap = {};
  const tree = [];

  // 1. Mapeia todos os comentários por ID e adiciona um array 'replies'
  comments.forEach((comment) => {
    commentsMap[comment.id] = { ...comment, replies: [] };
  });

  // 2. Itera sobre o mapa e aninha os filhos em seus pais
  Object.values(commentsMap).forEach((comment) => {
    if (comment.parentId) {
      const parent = commentsMap[comment.parentId];
      if (parent) {
        // Adiciona a resposta ao seu pai
        parent.replies.push(comment);
      } else {
        // Se o pai não for encontrado (ex: órfão), trata como nível 1
        tree.push(comment);
      }
    } else {
      // Comentário de nível 1 (não é uma resposta)
      tree.push(comment);
    }
  });

  return tree; // Retorna apenas os comentários de nível 1 (com filhos aninhados)
};

// =================================================================
// COMPONENTE POSTCREATOR (O criador de postagens) - Sem alterações
// =================================================================
const PostCreator = ({ currentUser }) => {
  const [postType, setPostType] = useState(null);
  const [postText, setPostText] = useState("");
  const [postFiles, setPostFiles] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const userImage = getCorrectImageUrl(currentUser?.urlFotoPerfil);

  const handleClose = () => {
    setPostType(null);
    setPostText("");
    setPostFiles([]);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setPostFiles((prevFiles) => [
        ...prevFiles,
        ...Array.from(e.target.files),
      ]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setPostFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handlePublish = async () => {
    const textIsEmpty = !postText.trim();
    const filesAreEmpty = postFiles.length === 0;
    if (textIsEmpty && filesAreEmpty) return;

    setIsPublishing(true);
    const formData = new FormData();
    const postData = { conteudo: postText };
    formData.append(
      "postagem",
      new Blob([JSON.stringify(postData)], { type: "application/json" })
    );
    postFiles.forEach((file) => {
      formData.append("arquivos", file);
    });

    const endpoint = "http://localhost:8080/postagem/upload-mensagem";
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Sua sessão expirou. Por favor, faça login novamente.");
      setIsPublishing(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.post(endpoint, formData, { headers });
      handleClose();
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Não foi possível publicar a postagem.");
    } finally {
      setIsPublishing(false);
    }
  };

  // --- RENDERIZAÇÃO ---
  if (postType === null) {
    return (
      <div className="post-creator-simple">
        <div
          className="post-creator-trigger"
          onClick={() => setPostType("media")}
        >
          <div className="avatar-small">
            <img src={userImage} alt="Seu Perfil" />
          </div>
          <input type="text" placeholder="Começar publicação" readOnly />
        </div>
      </div>
    );
  }

  // VISTA EXPANDIDA
  let title = "Publicar Postagem";
  let placeholder = `No que você está pensando, ${currentUser?.nome || ""}?`;

  return (
    <div className="post-creator-expanded" style={{ display: "block" }}>
      <div className="editor-header">
        <h3>{title}</h3>
      </div>
      <textarea
        className="editor-textarea"
        placeholder={placeholder}
        value={postText}
        onChange={(e) => setPostText(e.target.value)}
        autoFocus
      />
      <div className="file-uploader" style={{ marginTop: "1rem" }}>
        <label htmlFor="file-upload-input" className="file-upload-label">
          <FontAwesomeIcon icon={faImage} />
          <span>Mídia</span>
        </label>
        <input
          id="file-upload-input"
          className="hidden-file-input"
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          multiple
        />
        {postFiles.length > 0 && (
          <div className="selected-files-preview">
            {postFiles.map((file, index) => (
              <div key={index} className="file-preview-item">
                {file.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} />
                ) : (
                  <video src={URL.createObjectURL(file)} controls={false} />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="remove-file-btn"
                >
                  <FontAwesomeIcon icon={faTimesCircle} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="post-editor-footer">
        <div className="editor-actions">
          <button
            className="cancel-btn"
            onClick={handleClose}
            disabled={isPublishing}
          >
            Cancelar
          </button>
          <button
            className="publish-btn"
            disabled={
              (!postText.trim() && postFiles.length === 0) || isPublishing
            }
            onClick={handlePublish}
          >
            {isPublishing ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              "Publicar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// COMPONENTE: POSTEDITOR (Lógica de remoção de arquivos corrigida)
// =================================================================
const PostEditor = ({ post, onCancel, onSave }) => {
  const [editedText, setEditedText] = useState(post.conteudo);
  const [keptMediaUrls, setKeptMediaUrls] = useState(post.urlsMidia || []);
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [urlsParaRemover, setUrlsParaRemover] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      newMediaFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [newMediaFiles]);

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
// COMPONENTE: CommentItem (CÓDIGO COMPLETO E CORRIGIDO)
// =================================================================
const CommentItem = ({
  comment,
  currentUser,
  onLikeComment,
  onReplyClick,
  postId,
  depth = 1, // Define a profundidade padrão
}) => {
  const [repliesVisible, setRepliesVisible] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Lógica de visibilidade:
  const showViewRepliesButton = hasReplies && depth === 1;
  const areRepliesShown = (depth === 1 && repliesVisible) || depth > 1;

  // ✅ 1. Todo o componente é envolvido por um Fragmento (<>)
  return (
    <>
      {/* Este é o item do comentário (avatar + bolha) */}
      <div className="comment-item">
        <div className="avatar-small">
          <img
            src={getCorrectImageUrl(comment.urlFotoAutor)}
            alt={comment.nomeAutor}
          />
        </div>
        <div className="comment-body">
          <div className="comment-content">
            <strong>{comment.nomeAutor}</strong>
            <p>
              {comment.replyingToName && (
                <strong className="reply-tag">@{comment.replyingToName}</strong>
              )}{" "}
              {comment.conteudo}
            </p>
          </div>
          <div className="comment-actions-below">
            <span>{formatTimeAgo(comment.dataCriacao)}</span>
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
              onClick={() => onReplyClick(comment)} // Passa este comentário como o "pai"
            >
              <FontAwesomeIcon icon={faReply} />
              Responder
            </button>
          </div>

          {/* --- Lógica de Respostas Aninhadas (SÓ OS BOTÕES) --- */}
          {/* Os botões de Ver/Ocultar ficam AQUI DENTRO do comment-body */}

          {/* 1. Botão "Ver Respostas" */}
          {showViewRepliesButton && !repliesVisible && (
            <button
              className="comment-view-replies"
              onClick={() => setRepliesVisible(true)}
            >
              Ver {comment.replies.length} resposta
              {comment.replies.length > 1 ? "s" : ""}
            </button>
          )}

          {/* 2. Botão "Ocultar" */}
          {showViewRepliesButton && repliesVisible && (
            <button
              className="comment-view-replies"
              onClick={() => setRepliesVisible(false)}
            >
              Ocultar respostas
            </button>
          )}

        </div> {/* Fim do comment-body */}
      </div> {/* Fim do comment-item */}


      {/* ✅ 2. A Renderização das Respostas (o .map) é MOVIDA PARA FORA */}
      {/* Agora ela é "irmã" do "comment-item" e não "filha" do "comment-body" */}
      {hasReplies && areRepliesShown && (
        
        // Esta div receberá o padding de 15px do CSS que você pediu
        <div className="comment-replies-list"> 
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onLikeComment={onLikeComment}
              onReplyClick={onReplyClick}
              postId={postId}
              depth={depth + 1} // Incrementa a profundidade
            />
          ))}
        </div>
      )}
    </>
  );
}; // <-- ESTA É A CHAVE FINAL DO COMPONENTE

// =================================================================
// COMPONENTE: COMMENTSECTION (Passa a prop 'depth')
// =================================================================
const CommentSection = ({
  postId,
  comments = [], // Espera a ÁRVORE de comentários
  currentUser,
  stompClient,
  isConnected,
  onLikeComment,
}) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userImage = getCorrectImageUrl(currentUser?.urlFotoPerfil);
  const [replyingTo, setReplyingTo] =useState(null);
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
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onLikeComment={onLikeComment}
              onReplyClick={handleReplyClick}
              postId={postId}
              depth={1} // Passa a profundidade inicial (Nível 1)
            />
          ))
        ) : (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.9em",
              color: "#888",
              paddingTop: "10px",
            }}
          >
            Nenhum comentário ainda.
          </p>
        )}
      </div>
    </div>
  );
};

// =================================================================
// COMPONENTE MAINCONTENT (Lógica principal com correção do BUG DE LIKE)
// =================================================================
const MainContent = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { stompClient, isConnected } = useWebSocket();
  const [activeCommentBox, setActiveCommentBox] = useState(null);
  const [currentSlide, setCurrentSlide] = useState({});

  const [activePostMenu, setActivePostMenu] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  // --- WebSocket useEffect (Lógica de atualização em tempo real) ---
  useEffect(() => {
    // Lógica para mesclar atualizações de WS sem bugar os likes
    const handleFeedUpdate = (message) => {
      try {
        const payload = JSON.parse(message.body);
        const updatedPost = payload.postagem || payload;
        
        if (!updatedPost || !updatedPost.id) {
           if (payload.tipo === "remocao" && payload.postagemId) {
             setPosts((currentPosts) =>
               currentPosts.filter((p) => p.id !== payload.postagemId)
             );
           }
           return;
        }

        const postId = updatedPost.id;

        setPosts((currentPosts) => {
          const postIndex = currentPosts.findIndex((p) => p.id === postId);

          if (postIndex > -1) {
            // Post existe, vamos mesclar
            const newPosts = [...currentPosts];
            const oldPost = currentPosts[postIndex];

            // ✅✅✅ A CORREÇÃO ESTÁ AQUI ✅✅✅
            // Nós iteramos sobre a NOVA lista de comentários (do WebSocket)
            const mergedComentarios = (updatedPost.comentarios || []).map(newComment => {
              // E tentamos achar o comentário correspondente no ESTADO LOCAL
              const oldComment = (oldPost.comentarios || []).find(c => c.id === newComment.id);
              
              if (oldComment) {
                // SE ACHOU: Nós usamos o novo comentário (do WS) como base,
                // mas FORÇAMOS o 'curtidoPeloUsuario' a ser o do estado local.
                return {
                    ...newComment,
                    curtidoPeloUsuario: oldComment.curtidoPeloUsuario
                };
              }
              
              // SE NÃO ACHOU (é um comentário 100% novo):
              // Usamos o do WS, mas garantimos que 'curtidoPeloUsuario' seja falso,
              // pois o usuário local não poderia ter curtido ainda.
              return {
                ...newComment,
                curtidoPeloUsuario: false
              }; 
            });
            // ===================================================

            // Aqui mesclamos o post, preservando também o like DO POST
            const mergedPost = {
                ...updatedPost,
                comentarios: mergedComentarios,
                curtidoPeloUsuario: oldPost.curtidoPeloUsuario 
            };
            
            newPosts[postIndex] = mergedPost;
            return newPosts;
          
          } else if (payload.tipo !== "remocao") {
            // Post novo
            setCurrentSlide((prevSlides) => ({
              ...prevSlides,
              [updatedPost.id]: 0,
            }));
            return [updatedPost, ...currentPosts];
          }
          
          return currentPosts;
        });

      } catch (error) {
        console.error("Falha ao processar mensagem do WebSocket:", error);
      }
    };

    if (isConnected && stompClient) {
      const subscription = stompClient.subscribe(
        "/topic/publico",
        handleFeedUpdate
      );
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [isConnected, stompClient]);

  // --- Função para recarregar posts (usada para reverter erros) ---
  const fetchPosts = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const response = await axios.get(
          "http://localhost:8080/api/chat/publico",
          { headers }
        );
        setPosts(response.data);
        if (isLoading) {
          const initialSlides = {};
          response.data.forEach((post) => {
            initialSlides[post.id] = 0;
          });
          setCurrentSlide(initialSlides);
        }
      } catch (error) {
        console.error("Erro ao carregar o feed:", error);
      } finally {
        setIsLoading(false);
      }
  };

  // --- Busca inicial de posts ---
  useEffect(() => {
    setIsLoading(true);
    fetchPosts();
  }, []);

  // =================================================================
  // HANDLERS (Funções de clique)
  // =================================================================

  const handleLike = async (postId) => {
    const likeEndpoint = `http://localhost:8080/curtidas/toggle`;
    const payload = { postagemId: postId, comentarioId: null };
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    
    // Atualização Otimista
    setPosts(currentPosts => currentPosts.map(p => {
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
      fetchPosts(); // Reverte em caso de erro
    }
  };

  const handleLikeComment = async (postId, commentId) => {
    const likeEndpoint = `http://localhost:8080/curtidas/toggle`;
    const payload = { postagemId: null, comentarioId: commentId };
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Atualização Otimista
    setPosts(currentPosts => currentPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comentarios: p.comentarios.map(c => {
            if (c.id === commentId) {
              const curtidas = Number.isInteger(c.totalCurtidas) ? c.totalCurtidas : 0;
              return {
                ...c,
                curtidoPeloUsuario: !c.curtidoPeloUsuario,
                totalCurtidas: c.curtidoPeloUsuario ? curtidas - 1 : curtidas + 1
              };
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
      alert("Não foi possível curtir o comentário.");
      fetchPosts(); // Reverte em caso de erro
    }
  };


  const handleToggleComments = (postId) => {
    setActiveCommentBox((prevId) => (prevId === postId ? null : postId));
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
      if (!token) {
        alert("Sessão expirada.");
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      try {
        await axios.delete(deleteEndpoint, { headers });
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
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
    if (!token) {
      alert("Sessão expirada.");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.put(updateEndpoint, formData, { headers });
      setEditingPost(null); 
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      alert("Não foi possível salvar as alterações.");
    }
  };


  // --- Funções do Carrossel (Sem alterações) ---
  const nextSlide = (postId, totalSlides) => {
    setCurrentSlide((prevSlides) => {
      const currentIndex = prevSlides[postId] || 0;
      const nextIndex = (currentIndex + 1) % totalSlides;
      return { ...prevSlides, [postId]: nextIndex };
    });
  };
  const prevSlide = (postId, totalSlides) => {
    setCurrentSlide((prevSlides) => {
      const currentIndex = prevSlides[postId] || 0;
      const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      return { ...prevSlides, [postId]: prevIndex };
    });
  };

  // =================================================================
  // RENDERIZAÇÃO
  // =================================================================
  return (
    <main className="main-content">
      <div className="post-creator">
        <PostCreator currentUser={currentUser} />
      </div>
      <div className="feed-separator">
        <hr />
      </div>
      <div className="posts-container">
        {isLoading ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>
            <FontAwesomeIcon icon={faSpinner} spin /> Carregando feed...
          </p>
        ) : (
          posts.map((post) => {
            if (!post || !post.id) {
              return null;
            }

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

            const autorAvatar = getCorrectImageUrl(post.urlFotoAutor);
            const totalMidia = post.urlsMidia ? post.urlsMidia.length : 0;
            const currentPostSlide = currentSlide[post.id] || 0;
            
            const totalCurtidas = Number.isInteger(post.totalCurtidas) ? post.totalCurtidas : 0;
            
            // ✅ ATUALIZADO: Constrói a árvore de comentários aqui
            const commentTree = buildCommentTree(post.comentarios);
            const totalComentarios = Array.isArray(post.comentarios) ? post.comentarios.length : 0;

            return (
              <div className="post" key={post.id}>
              <div className="post-header">
            {/* ✅ O Link agora envolve toda a área do autor */}
            <Link to={`/perfil/${post.autorId}`} className="post-author-link">
              <div className="post-author">
                <div className="post-icon">
                  <img src={autorAvatar} alt={post.nomeAutor} />
                </div>
                <div className="post-info">
                  <h2>{post.nomeAutor || "Usuário"}</h2>
                  <span>{formatTimeAgo(post.dataCriacao)}</span>
                </div>
              </div>
            </Link>

                  {currentUser && post.autorId === currentUser.id && (
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

                <p className="post-text">{post.conteudo}</p>

                {totalMidia > 0 && (
                  <div className="post-media-carousel">
                    {totalMidia > 1 && (
                      <button
                        className="carousel-button prev"
                        onClick={() => prevSlide(post.id, totalMidia)}
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                    )}
                    <div
                      className="carousel-inner"
                      style={{
                        transform: `translateX(-${currentPostSlide * 100}%)`,
                      }}
                    >
                      {post.urlsMidia.map((url, index) => {
                        const fullUrl = getCorrectImageUrl(url);
                        const isVideo = fullUrl.match(/\.(mp4|webm|ogg)$/i);
                        return (
                          <div key={index} className="carousel-item">
                            {isVideo ? (
                              <video src={fullUrl} controls />
                            ) : (
                              <img src={fullUrl} alt={`Mídia ${index + 1}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {totalMidia > 1 && (
                      <button
                        className="carousel-button next"
                        onClick={() => nextSlide(post.id, totalMidia)}
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    )}
                    {totalMidia > 1 && (
                      <div className="carousel-indicators">
                        {Array.from({ length: totalMidia }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`indicator-dot ${
                              currentPostSlide === idx ? "active" : ""
                            }`}
                            onClick={() =>
                              setCurrentSlide((prevSlides) => ({
                                ...prevSlides,
                                [post.id]: idx,
                              }))
                            }
                          ></span>
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
          })
        )}
        {!isLoading && posts.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem" }}>
            Nenhuma publicação encontrada. Seja o primeiro a postar!
          </p>
        )}
      </div>
    </main>
  );
};

export default MainContent;