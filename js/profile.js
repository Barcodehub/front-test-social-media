// Constants
const API_BASE_URL = 'http://localhost:3000/api';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Elementos del DOM
const profileImage = document.getElementById('profileImage');
const profilePictureInput = document.getElementById('profilePictureInput');
const changeProfilePictureBtn = document.getElementById('changeProfilePicture');

// Estado global
let csrfToken = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await getCsrfToken();
        await loadCurrentProfilePicture();
        await loadCurrentCoverPicture();
        setupEventListeners();
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        showError('Error al inicializar la aplicación');
    }
});

// Obtener CSRF token
async function getCsrfToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
            method: 'GET',
            credentials: 'include',  // Importante: incluir cookies
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        csrfToken = data.csrfToken;
        
        if (!csrfToken) {
            throw new Error('No se recibió el token CSRF');
        }
    } catch (error) {
        console.error('Error al obtener el token CSRF:', error);
        throw new Error('Error al inicializar la seguridad');
    }
}

// Cargar la foto de perfil actual
async function loadCurrentProfilePicture() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.profilePicture) {
                profileImage.src = userData.profilePicture;
            }
        }
    } catch (error) {
        console.error('Error al cargar la foto de perfil:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    changeProfilePictureBtn.addEventListener('click', () => {
        profilePictureInput.click();
    });

    profilePictureInput.addEventListener('change', handleFileSelection);
}

// Manejar la selección de archivo
async function handleFileSelection(event) {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validar el archivo
    const validationError = validateFile(file);
    if (validationError) {
        showError(validationError);
        profilePictureInput.value = ''; // Limpiar input
        return;
    }

    // Mostrar preview
    showImagePreview(file);

    // Subir imagen
    await uploadProfilePicture(file);
}

// Validar archivo
function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return 'El formato de archivo no es válido. Por favor, usa JPG, PNG, GIF o WebP.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
        return 'La imagen es demasiado grande. El tamaño máximo es 5MB.';
    }

    return null;
}

// Mostrar preview de la imagen
function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        profileImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Subir la foto de perfil
async function uploadProfilePicture(file) {
    try {
        showLoader();

        if (!csrfToken) {
            await getCsrfToken(); // Intentar obtener nuevo token si no existe
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/users/profile-picture`, {
            method: 'PUT',
            credentials: 'include', // Importante: incluir cookies
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'X-CSRF-Token': csrfToken
                // No incluir Content-Type cuando se usa FormData
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al subir la imagen');
        }

        const data = await response.json();
        profileImage.src = data.profilePicture;
        showSuccess('Foto de perfil actualizada exitosamente');
        
    } catch (error) {
        console.error('Error al subir la foto de perfil:', error);
        if (error.message.includes('CSRF')) {
            // Si es un error de CSRF, intentar renovar el token y reintentar una vez
            try {
                await getCsrfToken();
                return uploadProfilePicture(file); // Reintentar la subida
            } catch (retryError) {
                showError('Error de seguridad. Por favor, recarga la página.');
            }
        } else {
            showError('Error al actualizar la foto de perfil');
        }
        await loadCurrentProfilePicture(); // Recargar la imagen anterior
    } finally {
        hideLoader();
        profilePictureInput.value = ''; // Limpiar input
    }
}

// Utilidades para los headers
function getHeaders(isFileUpload = false) {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };

    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }

    // No incluir Content-Type para subidas de archivo
    if (!isFileUpload) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
}


//CONFIGURACION PARA LA PORTADA


const coverPhoto = document.getElementById('coverPhoto');
const coverPhotoInput = document.getElementById('coverPhotoInput');
const editCoverBtn = document.getElementById('editCoverBtn');

// Configurar event listeners
editCoverBtn.addEventListener('click', () => {
  coverPhotoInput.click();
});

coverPhotoInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validar el archivo
  const validationError = validateFile(file);
  if (validationError) {
    showError(validationError);
    coverPhotoInput.value = ''; // Limpiar input
    return;
  }

  // Mostrar preview
  showCoverPhotoPreview(file);

  // Subir imagen
  await uploadCoverPicture(file);
});

async function uploadCoverPicture(file) {
  try {
    showLoader();

    if (!csrfToken) {
      await getCsrfToken(); // Intentar obtener nuevo token si no existe
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/users/cover-picture`, {
      method: 'PUT',
      credentials: 'include', // Importante: incluir cookies
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken
        // No incluir Content-Type cuando se usa FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al subir la imagen');
    }

    const data = await response.json();
    coverPhoto.src = data.coverPicture;
    showSuccess('Foto de portada actualizada exitosamente');
  } catch (error) {
    console.error('Error al subir la foto de portada:', error);
    if (error.message.includes('CSRF')) {
      // Si es un error de CSRF, intentar renovar el token y reintentar una vez
      try {
        await getCsrfToken();
        return uploadCoverPicture(file); // Reintentar la subida
      } catch (retryError) {
        showError('Error de seguridad. Por favor, recarga la página.');
      }
    } else {
      showError('Error al actualizar la foto de portada');
    }
    await loadCurrentCoverPicture(); // Recargar la imagen anterior
  } finally {
    hideLoader();
    coverPhotoInput.value = ''; // Limpiar input
  }
}

async function loadCurrentCoverPicture() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: getHeaders()
    });

    if (response.ok) {
      const userData = await response.json();
      if (userData.coverPicture) {
        coverPhoto.src = userData.coverPicture;
      }
    }
  } catch (error) {
    console.error('Error al cargar la foto de portada:', error);
  }
}


function showCoverPhotoPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    coverPhoto.src = e.target.result;
  };
  reader.readAsDataURL(file);
}









// Funciones de UI
function showLoader() {
    // Implementa tu loader aquí
    changeProfilePictureBtn.disabled = true;
    changeProfilePictureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
}

function hideLoader() {
    changeProfilePictureBtn.disabled = false;
    changeProfilePictureBtn.innerHTML = '<i class="fas fa-camera"></i> Cambiar foto';
}

function showError(message) {
    // Implementa tu sistema de notificaciones aquí
    alert(message); // Reemplaza esto con tu sistema de notificaciones
}

function showSuccess(message) {
    // Implementa tu sistema de notificaciones aquí
    alert(message); // Reemplaza esto con tu sistema de notificaciones
}


const headers = {
    'X-CSRF-Token': csrfToken,
    'Authorization': `Bearer ${localStorage.getItem('token')}`
};

const headers2 = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,  // Token CSRF obtenido
    'Authorization': `Bearer ${localStorage.getItem('token')}`
};

// DOM Elements
const profileElements = {
    username: document.getElementById('username'),
    userBio: document.getElementById('userBio'),
    postsCount: document.getElementById('postsCount'),
    friendsCount: document.getElementById('friendsCount'),
    communitiesCount: document.getElementById('communitiesCount'),
    profilePicture: document.getElementById('profilePicture'),
    coverPhoto: document.getElementById('coverPhoto'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    editProfileModal: document.getElementById('editProfileModal'),
    editProfileForm: document.getElementById('editProfileForm'),
    navButtons: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.section')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeProfile);
profileElements.editProfileBtn.addEventListener('click', openEditProfileModal);
profileElements.editProfileForm.addEventListener('submit', handleProfileUpdate);
profileElements.navButtons.forEach(button => {
    button.addEventListener('click', () => switchSection(button.dataset.section));
});

// Initialize Profile
async function initializeProfile() {
    try {
        const userProfile = await fetchUserProfile();
        updateProfileUI(userProfile);
        await loadInitialContent();
    } catch (error) {
        console.error('Error initializing profile:', error);
        showError('Error al cargar el perfil');
    }
}

// Fetch User Profile
async function fetchUserProfile() {

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers
        });
        
        if (!response.ok) throw new Error('Error fetching profile');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Update Profile UI
function updateProfileUI(profile) {
    profileElements.username.textContent = profile.username;
    profileElements.userBio.textContent = profile.bio || 'No hay biografía';
    profileElements.postsCount.textContent = profile.posts?.length || 0;
    profileElements.friendsCount.textContent = profile.friends?.length || 0;
    profileElements.communitiesCount.textContent = profile.community?.length || 0;
    
    // Update form fields
    document.getElementById('editUsername').value = profile.username;
    document.getElementById('editEmail').value = profile.email;
    document.getElementById('editBio').value = profile.bio || '';
    document.getElementById('editPrivacy').value = profile.privacy;
}

// Handle Profile Update
// Handle Profile Update
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    try {
        // Obtén el token CSRF antes de hacer la solicitud
        await getCsrfToken();
        
        // Extrae los datos del formulario
        const formData = new FormData(profileElements.editProfileForm);
        const updateData = Object.fromEntries(formData.entries());

        // Agrega el token CSRF a los encabezados
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,  // Token CSRF obtenido
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        };
        
        // Envía la solicitud de actualización
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers,
            credentials: 'include',  // Importante: incluir cookies
            body: JSON.stringify(updateData)
        });

        if (!response.ok) throw new Error('Error updating profile');
        
        // Actualiza la interfaz con el perfil actualizado
        const updatedProfile = await response.json();
        updateProfileUI(updatedProfile);
        closeEditProfileModal();
        showSuccess('Perfil actualizado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al actualizar el perfil');
    }
}


// Load Section Content
async function loadSectionContent(section) {
    const contentLoaders = {
        posts: loadUserPosts,
        reels: loadUserReels,
        friends: loadUserFriends,
        communities: loadUserCommunities
    };
    
    if (contentLoaders[section]) {
        await contentLoaders[section]();
    }
}

// Content Loaders
async function loadUserPosts() {
    const postsContainer = document.getElementById('userPosts');
    try {
        const response = await fetch(`${API_BASE_URL}/posts/user`, { headers });
        if (!response.ok) throw new Error('Error fetching posts');
        
        const posts = await response.json();
        postsContainer.innerHTML = posts.map(post => createPostHTML(post)).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p>Error al cargar las publicaciones</p>';
    }
}

async function loadUserReels() {
    const reelsContainer = document.getElementById('userReels');
    try {
        const response = await fetch(`${API_BASE_URL}/reels/user`, { headers });
        if (!response.ok) throw new Error('Error fetching reels');
        
        const reels = await response.json();
        console.log('Reels fetched:', reels); // Verifica cuántos reels se están recibiendo
        reelsContainer.innerHTML = reels.map(reel => createReelHTML(reel)).join('');
    } catch (error) {
        console.error('Error loading reels:', error);
        reelsContainer.innerHTML = '<p>Error al cargar los reels</p>';
    }
}


async function loadUserFriends() {
    const friendsContainer = document.getElementById('userFriends');
    try {
        const response = await fetch(`${API_BASE_URL}/friends/myfriends`, { headers });
        if (!response.ok) throw new Error('Error fetching friends');
        
        const friends = await response.json();
        friendsContainer.innerHTML = friends.map(friend => createFriendHTML(friend)).join('');
    } catch (error) {
        console.error('Error loading friends:', error);
        friendsContainer.innerHTML = '<p>Error al cargar los amigos</p>';
    }
}

async function loadUserCommunities() {
    const communitiesContainer = document.getElementById('userCommunities');
    try {
        const response = await fetch(`${API_BASE_URL}/communities/user`, { headers });
        if (!response.ok) throw new Error('Error fetching communities');
        
        const communities = await response.json();
        communitiesContainer.innerHTML = communities.map(community => createCommunityHTML(community)).join('');
    } catch (error) {
        console.error('Error loading communities:', error);
        communitiesContainer.innerHTML = '<p>Error al cargar las comunidades</p>';
    }
}






// profile.js

class ProfileManager {
  constructor() {
    this.profilePicture = document.getElementById('profilePicture');
    this.editProfilePicBtn = document.getElementById('editProfilePicBtn');
    this.profilePicInput = document.getElementById('profilePicInput');
    this.apiUrl = '/api/users'; // Ajusta esto según tu URL base de la API
  }



  openFileSelector() {
    this.profilePicInput.click();
  }

}

// Inicializar el gestor de perfil cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  window.profileManager = new ProfileManager();
});
// UI Helpers
function switchSection(sectionId) {
    profileElements.navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    
    profileElements.sections.forEach(section => {
        section.classList.toggle('active', section.id === `${sectionId}Section`);
    });
    
    loadSectionContent(sectionId);
}

function openEditProfileModal() {
    profileElements.editProfileModal.style.display = 'block';
}

function closeEditProfileModal() {
    profileElements.editProfileModal.style.display = 'none';
}

// HTML Generators
// Función para obtener comentarios
async function getPostComments(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${postId}`, {
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

// Función para manejar el click en el botón de comentarios
async function handleComments(postId) {
    try {
        const comments = await getPostComments(postId);
        showCommentsModal(comments);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los comentarios');
    }
}

// Modificación de la función createPostHTML para incluir el botón de ver comentarios
function createPostHTML(post) {
    return `
        <div class="post-card" data-id="${post._id}">
            <div class="post-header">
                <img src="${post.author.profilePicture || '/assets/profile/default-profile.png'}" alt="Profile" class="profile-pic">
                <div class="post-info">
                    <h4>${post.author.username}</h4>
                    <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button class="like-btn" onclick="handleLike('${post._id}', 'post')">
                    <i class="fas fa-heart"></i><span class="likes-count"> ${post.likes.length}</span>
                </button>
                <button class="comment-btn" onclick="handleComment('${post._id}')">
                    <i class="fas fa-comment"></i> ${post.comments.length}
                </button>
                <button class="view-comments-btn" onclick="handleComments('${post._id}')">
                    <i class="fas fa-eye"></i> Ver comentarios
                </button>
            </div>
        </div>
    `;
}


function createReelHTML(reel) {
    return `
        <div class="reels-item" data-id="${reel._id}">
            <p>${reel.description}</p>
            <video src="${reel.videoUrl}" controls></video>
            <span>Publicado el: ${new Date(reel.createdAt).toLocaleDateString()}</span>
            <div class="reel-info">
                <h4>${reel.author.username}</h4>
            </div>
            <!-- Agrega más detalles o controles de reel si es necesario -->
        </div>
    `;
}

function createFriendHTML(friend) {
    return `
        <div class="friend-card" data-id="${friend._id}">
            <img src="${friend.profilePicture || '/api/placeholder/100/100'}" alt="${friend.username}">
            <h4>${friend.username}</h4>
            <button class="btn-primary" onclick="viewProfile('${friend._id}')">Ver perfil</button>
        </div>
    `;
}

// ... (código anterior se mantiene igual hasta la función createCommunityHTML)

function createCommunityHTML(community) {
    return `
        <div class="community-card" data-id="${community._id}">
            <h4>${community.name}</h4>
            <p>${community.description}</p>
            <span>${community.members.length} miembros</span>
            <button class="btn-primary" onclick="viewCommunity('${community._id}')">Ver comunidad</button>
        </div>
    `;
}

// Interaction Handlers


function getHeaders2() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'X-CSRF-Token': csrfToken
    };
}
async function handleLike(contentId, type) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showError('Debes iniciar sesión para dar like');
            return;
        }
        const response = await fetch(`${API_BASE_URL}/likes/${type}/${contentId}`, {
            method: 'POST',
            headers: getHeaders2(),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al dar like');
        }

        const updatedContent = await response.json();
        updateLikeButton(contentId, updatedContent.likes.length);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al procesar el like');
    }
}

// Función auxiliar para actualizar el botón de like
function updateLikeButton(contentId, likesCount) {
    const postCard = document.querySelector(`[data-id="${contentId}"]`);
    if (postCard) {
        const likesCountSpan = postCard.querySelector('.likes-count');
        if (likesCountSpan) {
            likesCountSpan.textContent = ` ${likesCount}`;
        }
    }
}

// Función auxiliar para mostrar errores
function showError(message) {
    // Implementa aquí tu lógica de mostrar errores
    console.error(message);
    // Ejemplo: alert(message);
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
        const response = await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: getHeaders2(),
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



// Función para actualizar un comentario
async function updateComment(commentId, content) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) throw new Error('Error al actualizar el comentario');
        return await response.json();
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
}

// Función para eliminar un comentario
async function deleteComment(commentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar el comentario');
        return await response.json();
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}



// Navigation Functions
function viewProfile(userId) {
    window.location.href = `/profile.html?id=${userId}`;
}

function viewCommunity(communityId) {
    window.location.href = `/community.html?id=${communityId}`;
}

// File Upload Handlers
const fileUploadHandlers = {
    profilePic: document.getElementById('editProfilePicBtn'),
    coverPhoto: document.getElementById('editCoverBtn')
};

/* Object.entries(fileUploadHandlers).forEach(([type, button]) => {
    button.addEventListener('click', () => handleFileUpload(type));
}); */

async function handleFileUpload(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/upload/${type}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': headers['X-CSRF-Token'],
                    'Authorization': headers['Authorization']
                },
                body: formData
            });
            
            if (!response.ok) throw new Error('Error al subir la imagen');
            
            const result = await response.json();
            const imgElement = document.getElementById(type === 'profilePic' ? 'profilePicture' : 'coverPhoto');
            imgElement.src = result.url;
            
            showSuccess('Imagen actualizada exitosamente');
        } catch (error) {
            console.error('Error:', error);
            showError('Error al subir la imagen');
        }
    };
    
    input.click();
}

// Account Management
async function deleteAccount() {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/account`, {
            method: 'DELETE',
            headers
        });
        
        if (!response.ok) throw new Error('Error al eliminar la cuenta');
        
        localStorage.clear();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar la cuenta');
    }
}

// Notification Handlers
function showSuccess(message) {
    // Implementa tu sistema de notificaciones aquí
    alert(message); // Placeholder básico
}

function showError(message) {
    // Implementa tu sistema de notificaciones aquí
    alert('Error: ' + message); // Placeholder básico
}

// Initial load
async function loadInitialContent() {
    // Cargar la sección activa por defecto (posts)
    await loadSectionContent('posts');
    
    // Verificar si hay un userId en la URL para ver perfil de otro usuario
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    if (userId) {
        // Si hay un userId, cargar el perfil de ese usuario
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
                headers
            });
            
            if (!response.ok) throw new Error('Error fetching user profile');
            
            const userProfile = await response.json();
            updateProfileUI(userProfile);
            
            // Deshabilitar edición si no es el perfil propio
            profileElements.editProfileBtn.style.display = 'none';
            document.getElementById('editProfilePicBtn').style.display = 'none';
            document.getElementById('editCoverBtn').style.display = 'none';
        } catch (error) {
            console.error('Error:', error);
            showError('Error al cargar el perfil del usuario');
        }
    }
}

// Search Users Function
async function searchUsers(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
            headers
        });
        
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al buscar usuarios');
        return [];
    }
}

// Cleanup function para el modal
function setupModalCloseHandlers() {
    const modal = profileElements.editProfileModal;
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = closeEditProfileModal;
    
    window.onclick = (event) => {
        if (event.target === modal) {
            closeEditProfileModal();
        }
    };
}

// Inicializar los manejadores del modal
setupModalCloseHandlers();