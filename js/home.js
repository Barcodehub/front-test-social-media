// home.js

// API Configuration
const API_URL = 'https://ship-connect.ddns.net/api';
let csrfToken = null;


// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
    }
    return token;
}
document.addEventListener('DOMContentLoaded', getCsrfToken);
// Get CSRF token
async function getCsrfToken() {
    try {
        const response = await fetch(`${API_URL}/auth/csrf-token`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.csrfToken;
    } catch (error) {
        console.error('Error al obtener el token CSRF:', error);
    }
}

// API Headers
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

function getHeaders2() {
    return {
        'X-CSRF-Token': csrfToken,
        'Authorization': `${localStorage.getItem('token')}`
    };
}

// Load user data
async function loadUserData() {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: getHeaders()
        });
        const userData = await response.json();
        updateUIWithUserData(userData);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load news feed
async function loadNewsFeed() {
    try {
        const response = await fetch(`${API_URL}/posts/news-feed`, {
            headers: getHeaders()
        });
        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error('Error loading news feed:', error);
    }
}

let currentOffset = 0;
const storiesPerPage = 4; // Cantidad máxima de historias visibles
const storyWidth = 100; // Ancho de cada historia (incluido el margen/gap)
const gap = 10;

async function fetchStories() {
    try {
        const response = await fetch(`${API_URL}/stories`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Asegúrate de incluir el token si es necesario
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener las historias');
        }

        const stories = await response.json();
        renderStories(stories); // Renderiza las historias
        updateNavButtons(stories.length); // Actualiza los botones de navegación
    } catch (error) {
        console.error('Error al cargar las historias:', error.message);
    }
}

function renderStories(stories) {
    const storiesList = document.getElementById('storiesList');
    storiesList.innerHTML = ''; // Limpiar contenido previo

    stories.forEach(story => {
        const storyItem = document.createElement('div');
        storyItem.className = 'story-item';

        // Crea la imagen o contenido multimedia
        const media = document.createElement('img');
        media.src = story.mediaUrl; // Imagen por defecto si no hay contenido
        media.alt = `${story.author.username}'s story`;

        // Añade un overlay con el nombre del autor
        const overlay = document.createElement('div');
        overlay.className = 'story-overlay';
        overlay.innerText = story.author.username;

        storyItem.appendChild(media);
        storyItem.appendChild(overlay);

        // Agrega el evento de clic para abrir la historia
        storyItem.addEventListener('click', () => {
            openStory(story); // Función para manejar la visualización de la historia
        });

        storiesList.appendChild(storyItem);
    });
}


function openStory(story) {
    const storyModal = document.getElementById('storyModal');
    const storyMedia = document.getElementById('storyMedia');
    const storyAuthor = document.getElementById('storyAuthor');
    const closeModal = document.getElementById('closeModal');

    // Limpia contenido previo
    storyMedia.innerHTML = '';
    
    // Muestra el contenido multimedia (imagen o video)
    if (story.mediaUrl.endsWith('.mp4')) {
        const video = document.createElement('video');
        video.src = story.mediaUrl;
        video.controls = true;
        video.autoplay = true;
        storyMedia.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = story.mediaUrl;
        img.alt = `Historia de ${story.author.username}`;
        storyMedia.appendChild(img);
    }

    // Muestra el autor
    storyAuthor.textContent = `Historia de ${story.author.username}`;

    // Muestra el modal
    storyModal.classList.remove('hidden');

    // Agrega evento para cerrar el modal
    closeModal.onclick = () => {
        storyModal.classList.add('hidden');
    };

    // También cierra el modal al hacer clic fuera de él
    storyModal.onclick = (event) => {
        if (event.target === storyModal) {
            storyModal.classList.add('hidden');
        }
    };
}

function updateNavButtons(totalStories) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    const maxOffset = (Math.ceil(totalStories / storiesPerPage) - 1) * (storyWidth + gap) * storiesPerPage;

    // Mostrar u ocultar botones según la posición actual
    prevBtn.classList.toggle('hidden', currentOffset === 0);
    nextBtn.classList.toggle('hidden', currentOffset >= maxOffset);
}

function scrollStories(direction) {
    const storiesList = document.getElementById('storiesList');
    const maxScroll = (storiesList.children.length - storiesPerPage) * (storyWidth + gap);

    // Ajusta el offset basado en la dirección
    currentOffset += direction * (storyWidth + gap) * storiesPerPage;

    // Limitar dentro del rango permitido
    currentOffset = Math.max(0, Math.min(currentOffset, maxScroll));

    storiesList.style.transform = `translateX(-${currentOffset}px)`;

    updateNavButtons(storiesList.children.length);
}

document.getElementById('prevBtn').addEventListener('click', () => scrollStories(-1));
document.getElementById('nextBtn').addEventListener('click', () => scrollStories(1));

// Llama a la función para cargar las historias al cargar la página
document.addEventListener('DOMContentLoaded', fetchStories);





// Función para mostrar el modal de creación de historias
function showStoryModal() {
    document.getElementById('story-modal').style.display = 'block';
}

// Función para ocultar el modal de creación de historias
function hideStoryModal() {
    document.getElementById('story-modal').style.display = 'none';
}

// Función para enviar la historia al backend
async function submitStory() {
    const content = document.getElementById('story-content').value;
    const privacy = document.getElementById('story-privacy').value;
    const mediaInput = document.getElementById('story-media');
    const mediaFile = mediaInput.files[0];

    const formData = new FormData();
    formData.append('media', mediaFile);
    formData.append('content', content);
    formData.append('privacy', privacy);

    try {
        const response = await fetch(`${API_URL}/stories`, {
            method: 'POST',
            headers: getHeaders2(), // No necesitas establecer Content-Type para FormData
            credentials: 'include',
            body: formData,
            
        });

        if (!response.ok) {
            throw new Error('Error al crear la historia');
        }

        const newStory = await response.json();
        console.log('Nueva historia creada:', newStory);
        // Aquí podrías actualizar la interfaz para mostrar la nueva historia
        hideStoryModal();
    } catch (error) {
        console.error('Error al enviar la historia:', error);
    }
}

// Eventos
document.getElementById('create-story').addEventListener('click', showStoryModal);
document.getElementById('submit-story').addEventListener('click', submitStory);
document.getElementById('cancel-story').addEventListener('click', hideStoryModal);



function renderPosts(posts) {
    const postsFeed = document.getElementById('postsFeed');
    postsFeed.innerHTML = posts.map(post => `
        <div class="post-card" data-post-id="${post._id}">
            <div class="post-header">
                <img src="${post.author.profilePicture || '/assets/profile/default-profile.png'}" alt="${post.author.username}" class="profile-pic">
                <div class="post-info">
                    <h4>${post.author.username}</h4>
                    <span class="post-time">${formatTimeAgo(post.createdAt)}</span>
                    ${
                        post.shares.includes(getCurrentUserId())
                            ? `<p class="shared-by">Compartido por ti</p>` // Indicar que fue compartido
                            : ''
                    }
                </div>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-actions">
                <button onclick="toggleLike('${post._id}', 'post')" class="action-btn ${post.likes.includes(getCurrentUserId()) ? 'liked' : ''}">
                    <i class="fas fa-heart"></i>
                    <span class="likes-count">${post.likes.length}</span>
                </button>
                <button onclick="handleComment('${post._id}')" class="comment-btn">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments.length}</span>
                </button>
                <button class="view-comments-btn" onclick="handleComments('${post._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="sharePost('${post._id}')" class="action-btn">
                    <i class="fas fa-share"></i>
                    <span class="share-count">${post.shares.length || 0}</span>
                </button>
            </div>
        </div>
    `).join('');
}


// Post interactions
async function toggleLike(contentId, type) {
    try {
        const response = await fetch(`${API_URL}/likes/${type}/${contentId}`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al dar like');
        }

        const result = await response.json();
        updateLikeButton(contentId, result.likes.length);
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

function updateLikeButton(contentId, likesCount) {
    const postCard = document.querySelector(`[data-post-id="${contentId}"]`);
    if (postCard) {
        const likesCountSpan = postCard.querySelector('.likes-count');
        if (likesCountSpan) {
            likesCountSpan.textContent = ` ${likesCount}`;
        }
    }
}

async function handleComments(postId) {
    try {
        const comments = await getPostComments(postId);
        showCommentsModal(comments);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los comentarios');
    }
}
async function getPostComments(postId) {
    try {
        const response = await fetch(`${API_URL}/comments/${postId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al obtener comentarios');
        return await response.json();
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}



// Función para mostrar comentarios en un modal
function showCommentsModal(comments) {
    const modalHTML = `
        <div class="comments-modal" id="commentsModal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Comentarios</h3>
                <div class="comments-container">
                    ${comments.length > 0 
                        ? comments.map(comment => `
                            <div class="comment">

                              <div class="post-header">
                            <img src="${comment.author.profilePicture || '/assets/profile/default-profile.png'}" alt="Profile" class="profile-pic">
                            <div class="post-info">
                               <strong>${comment.author.username}</strong>
                                <p>${comment.content}</p>
                                <small>${new Date(comment.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                         </div>
                        `).join('')
                        : '<p>No hay comentarios aún</p>'
                    }
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('commentsModal');
    const closeBtn = modal.querySelector('.close-modal');
    
    closeBtn.onclick = () => {
        modal.remove();
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    };
}


// Función principal para manejar la creación de comentarios
async function handleComment(postId) {
    // Verificar que tenemos el ID del post
    if (!postId) {
        showError('Error: ID del post no válido');
        return;
    }

    // Verificar CSRF token antes de mostrar el modal
    if (!getCsrfToken()) {
        showError('Error de seguridad: Token CSRF no disponible');
        return;
    }

    const modalHTML = `
        <div class="comment-modal" id="commentModal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Agregar Comentario</h3>
                <div class="comment-form">
                    <textarea id="commentContent" placeholder="Escribe tu comentario aquí..." rows="4"></textarea>
                    <button id="submitComment" class="submit-btn">Publicar Comentario</button>
                </div>
                <div id="commentError" class="error-message" style="display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('commentModal');
    const closeBtn = modal.querySelector('.close-modal');
    const submitBtn = document.getElementById('submitComment');
    const textarea = document.getElementById('commentContent');
    const errorDiv = document.getElementById('commentError');

    // Manejadores de eventos
    closeBtn.onclick = () => modal.remove();
    
    window.onclick = (event) => {
        if (event.target === modal) modal.remove();
    };

    submitBtn.onclick = async () => {
        const content = textarea.value.trim();
        errorDiv.style.display = 'none';

        if (!content) {
            errorDiv.textContent = 'El comentario no puede estar vacío';
            errorDiv.style.display = 'block';
            return;
        }

        try {
            submitBtn.disabled = true;
            const comment = await submitComment(postId, content);
            
            // Actualizar el contador de comentarios en el post
            const postElement = document.querySelector(`[data-id="${postId}"]`);
            if (postElement) {
                const commentCountElement = postElement.querySelector('.comment-btn span');
                if (commentCountElement) {
                    const currentCount = parseInt(commentCountElement.textContent || '0');
                    commentCountElement.textContent = ` ${currentCount + 1}`;
                }
            }
            
            modal.remove();
            showSuccess('Comentario publicado exitosamente');
            
            // Opcional: Recargar los comentarios si están visibles
            const commentsModal = document.getElementById('commentsModal');
            if (commentsModal) {
                const comments = await getPostComments(postId);
                showCommentsModal(comments);
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Error al publicar el comentario';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
        }
    };
}



// Función para crear un comentario
async function submitComment(postId, content) {
    try {
        // Verificar que tenemos todos los datos necesarios
        if (!postId) {
            throw new Error('ID del post es requerido');
        }
        
        if (!content) {
            throw new Error('Contenido del comentario es requerido');
        }

        // Verificar CSRF token
        if (!getCsrfToken()) {
            throw new Error('CSRF token no disponible');
        }

        // Alinear los campos con el controlador
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                postId: postId,      // para el controlador
                post: postId,        // para el modelo
                content: content,    // contenido del comentario
                contentId: postId,   // requerido por el modelo
                contentType: 'Post'  // requerido por el modelo
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('Error response:', errorData); // Para debugging
            throw new Error(errorData.message || 'Error al crear el comentario');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
    }
}



// Función principal para compartir un post
async function sharePost(postId) {
    try {
        // Verificar que se haya proporcionado el ID del post
        if (!postId) {
            showError('Error: ID del post no válido.');
            return;
        }

        // Mostrar una notificación de carga
        showLoading('Compartiendo post...');

        // Enviar la solicitud al backend
        const response = await fetch(`${API_URL}/posts/${postId}/share`, {
            method: 'POST',
            headers: getHeaders2(),
            credentials: 'include',
        });

        // Manejo de errores en la respuesta
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error al compartir el post:', errorData);
            throw new Error(errorData.message || 'Error al compartir el post.');
        }

        // Obtener los datos del post actualizado
        const updatedPost = await response.json();

        // Actualizar la interfaz de usuario
        updateShareCount(postId, updatedPost.shares.length);

        // Mostrar éxito
        showSuccess('Post compartido exitosamente.');
    } catch (error) {
        console.error('Error al compartir el post:', error);
        showError(error.message || 'No se pudo compartir el post.');
    } finally {
        hideLoading(); // Ocultar la notificación de carga
    }
}

// Función para actualizar el contador de compartidos en la interfaz
function updateShareCount(postId, newShareCount) {
    const postElement = document.querySelector(`[data-id="${postId}"]`);
    if (postElement) {
        const shareCountElement = postElement.querySelector('.action-btn span');
        if (shareCountElement) {
            shareCountElement.textContent = newShareCount;
        } else {
            // Si no hay un contador visible, puedes agregar uno dinámicamente
            const newSpan = document.createElement('span');
            newSpan.textContent = newShareCount;
            postElement.querySelector('.action-btn').appendChild(newSpan);
        }
    }
}

// Funciones auxiliares (modifícalas según tu implementación)
function showError(message) {
    alert(`Error: ${message}`);
}

function showSuccess(message) {
    alert(`Éxito: ${message}`);
}

function showLoading(message) {
    console.log(message); // Puedes reemplazar esto con un spinner en tu UI
}

function hideLoading() {
    console.log('Carga completada.'); // Similar a showLoading
}




async function loadComments(postId) {
    try {
        const response = await fetch(`${API_URL}/comments/${postId}`, {
            headers: getHeaders()
        });
        const comments = await response.json();
        renderComments(postId, comments);
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}


// Friend requests
async function loadFriendRequests() {
    try {
        const response = await fetch(`${API_URL}/friends/requests`, {
            headers: getHeaders()
        });
        const requests = await response.json();
        renderFriendRequests(requests);
    } catch (error) {
        console.error('Error loading friend requests:', error);
    }
}

// Utility functions
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
}

function getCurrentUserId() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    return userData?._id;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    const token = checkAuth();
    if (!token) return;
    
    await getCsrfToken();
   // await loadUserData();
    await loadNewsFeed();
   // await loadStories();
   // await loadFriendRequests();
});


async function loadActiveFriends() {
    try {
      const response = await fetch(`${API_URL}/friends/active-friends`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
  
      const activeFriends = await response.json();
      const activeFriendsList = document.getElementById('activeFriendsList');
      activeFriendsList.innerHTML = '';
  
      activeFriends.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';
        friendItem.innerHTML = `
          <img src="${friend.profilePicture || '/assets/profile/default-profile.png'}" alt="${friend.username}" class="profile-pic">
          <span>${friend.username}</span>
        `;
        activeFriendsList.appendChild(friendItem);
      });
    } catch (error) {
      console.error('Error al cargar amigos activos:', error);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    loadActiveFriends();
  });
  


// Función para crear un post
async function createPost(content) {
    try {
        console.log('content: '+content)
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                content: content,
                privacy: 'public' // Puedes modificar esto según tus necesidades
            })
        });

        if (!response.ok) {
            throw new Error('Error al crear el post');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

 document.addEventListener('DOMContentLoaded', async () => {
    try {
        
        setupEventListeners();
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        showError('Error al inicializar la aplicación');
    }
}); 
 // Agregar esto dentro de tu función setupEventListeners
function setupEventListeners() {
    // Event listener para el botón de publicar
    const postInput = document.getElementById('post-input');
    const postButton = document.getElementById('post-submit-btn');

    postButton.addEventListener('click', async () => {
        const content = postInput.value.trim();
        
        if (!content) {
            alert('Por favor escribe algo antes de publicar');
            return;
        }

        try {
            const newPost = await createPost(content);
            // Limpiar el input después de publicar
            postInput.value = '';
            
            // Aquí puedes agregar código para mostrar el nuevo post en la interfaz
            // Por ejemplo, actualizar la lista de posts o agregar el nuevo post al DOM
            console.log('Post creado exitosamente:', newPost);
            
        } catch (error) {
            alert('Error al crear el post. Por favor intenta de nuevo.');
        }
    });

    // Mantén el código existente del logout
    



// Agrega el event listener para el botón de logout
document.getElementById('logout-btn').addEventListener('click', logoutUser);

// Definición de la función logoutUser
async function logoutUser() {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders2(),
        credentials: 'include',
    });
    const result = await response.json();

    if (result.status === 'success') {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login.html';
    } else {
      console.error('Error en el cierre de sesión:', result.message);
    }
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}
      
} 