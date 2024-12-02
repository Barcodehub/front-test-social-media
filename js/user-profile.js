const API_BASE_URL = 'https://ship-connect.ddns.net/api';

function showError(message) {
    // Implementa tu sistema de notificaciones aquí
    alert(message); // Reemplaza esto con tu sistema de notificaciones
}
let csrfToken = null;
let currentProfileUserId = null;

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

    async function loadUserReels(userId) {
        const reelsContainer = document.getElementById('userReels');
        try {
            // Si no se proporciona userId, usar el endpoint original para reels propios
            const endpoint = userId 
                ? `${API_BASE_URL}/reels/user/${userId}`
                : `${API_BASE_URL}/reels/user`;
                
            const response = await fetch(endpoint, { headers });
            if (!response.ok) throw new Error('Error fetching reels');
            
            const reels = await response.json();
            reelsContainer.innerHTML = reels.map(reel => createReelHTML(reel)).join('');
        } catch (error) {
            console.error('Error loading reels:', error);
            reelsContainer.innerHTML = '<p>Error al cargar los reels</p>';
        }
    }



async function loadUserFriends(userId) {
    const friendsContainer = document.getElementById('userFriends');
    try {
        // Si no se proporciona userId, usar el endpoint original para friends propios
        const endpoint = userId 
            ? `${API_BASE_URL}/friends/user/${userId}`
            : `${API_BASE_URL}/friends/user`;
            
        const response = await fetch(endpoint, { headers });
        if (!response.ok) throw new Error('Error fetching friends');
        
        const friends = await response.json();
        console.log(friends);
        friendsContainer.innerHTML = friends.map(friend => createFriendHTML(friend)).join('');
    } catch (error) {
        console.error('Error loading friends:', error);
        friendsContainer.innerHTML = '<p>Error al cargar los friends</p>';
    }
}


async function loadUserCommunities(userId) {
    const communitiesContainer = document.getElementById('userCommunities');
    try {
        // Si no se proporciona userId, usar el endpoint original para communities propios
        const endpoint = userId 
            ? `${API_BASE_URL}/communities/user/${userId}`
            : `${API_BASE_URL}/communities/user`;
            
        const response = await fetch(endpoint, { headers });
        if (!response.ok) throw new Error('Error fetching reels');
        
        const communities = await response.json();
        communitiesContainer.innerHTML = communities.map(community => createCommunityHTML(community)).join('');
    } catch (error) {
        console.error('Error loading communities:', error);
        communitiesContainer.innerHTML = '<p>Error al cargar los communities</p>';
    }
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

function displayProfile(user) {
    // Ocultar el perfil actual del usuario para mostrar el perfil del amigo
    document.querySelector('.profile-content').style.display = 'none';

    const profileContainer = document.getElementById('profileContainer');
    profileContainer.style.display = 'block'; // Mostrar el contenedor del amigo

    profileContainer.innerHTML = `
        <div class="profile-card">
            <img src="${user.profilePicture || '/assets/profile/default-profile.png'}" alt="${user.username}" class="profile-pic">
            <h2>${user.username}</h2>
            ${user.bio ? `<p>${user.bio}</p>` : ''}
            <div class="profile-stats">
                <div class="stat">Posts: ${user.posts ? user.posts.length : 0}</div>
                <div class="stat">Friends: ${user.friends ? user.friends.length : 0}</div>
                <div class="stat">Communities: ${user.community ? user.community.length : 0}</div>
            </div>
            <button onclick="backToMainProfile()">Regresar a mi perfil</button>
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
            <img src="${friend.profilePicture || '/assets/profile/default-profile.png'}" alt="${friend.username}" class="profile-pic">
            <h4>${friend.username}</h4>
            <button class="btn-primary" onclick="viewfriend('${friend.slug}')">Ver perfil</button>
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

function viewfriend(slug) {
    window.location.href = `/user-profile.html?slug=${slug}`;
}


function viewCommunity(communityId) {
    window.location.href = `/community.html?id=${communityId}`;
}














// user-profile.js - Para ver perfiles de otros usuarios
const profileElements = {
    username: document.getElementById('username'),
    userBio: document.getElementById('userBio'),
    postsCount: document.getElementById('postsCount'),
    friendsCount: document.getElementById('friendsCount'),
    communitiesCount: document.getElementById('communitiesCount'),
    profileImage: document.getElementById('profileImage'),
    coverPhoto: document.getElementById('coverPhoto'),
    friendActionBtn: document.getElementById('friendActionBtn'),
    messageBtn: document.getElementById('messageBtn'),
    privateProfileMessage: document.getElementById('privateProfileMessage'),
    navButtons: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.section')
};


profileElements.navButtons.forEach(button => {
    button.addEventListener('click', () => switchSection(button.dataset.section));
});
function switchSection(sectionId) {
    profileElements.navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    
    profileElements.sections.forEach(section => {
        section.classList.toggle('active', section.id === `${sectionId}Section`);
    });
    
    loadSectionContent(sectionId);
}



// Inicialización para perfil de usuario
// Frontend: Modificar la función loadUserPosts para aceptar un userId
async function loadUserPosts(userId) {
    const postsContainer = document.getElementById('userPosts');
    try {
        // Ahora siempre usamos el userId proporcionado
        const endpoint = userId 
            ? `${API_BASE_URL}/posts/user/${userId}`
            : `${API_BASE_URL}/posts/user`; // fallback para el perfil propio
            
        const response = await fetch(endpoint, { headers });
        if (!response.ok) throw new Error('Error fetching posts');
        
        const posts = await response.json();
        postsContainer.innerHTML = posts.map(post => createPostHTML(post)).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p>Error al cargar las publicaciones</p>';
    }
}

// Modificar la función initializeUserProfile para cargar los posts del usuario correcto
async function initializeUserProfile() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const userSlug = urlParams.get('slug');
        
        if (!userSlug) {
            throw new Error('No se especificó un usuario');
        }
        
        const userProfile = await fetchUserProfileBySlug(userSlug);
        // Guardar el ID del usuario del perfil
        currentProfileUserId = userProfile.data._id;
        
        updateUserProfileUI(userProfile.data);
        await loadUserPosts(currentProfileUserId);
        setupFriendshipStatus(userProfile.data);
    } catch (error) {
        console.error('Error initializing profile:', error);
        showError(error.message);
    }
}

// Modificar loadSectionContent para usar el ID guardado
async function loadSectionContent(sectionId) {
    const contentContainer = document.getElementById(`${sectionId}Section`);
    if (!contentContainer) return;

    try {
        switch (sectionId) {
            case 'posts':
                await loadUserPosts(currentProfileUserId);
                break;
            case 'reels':
                await loadUserReels(currentProfileUserId);
                break;    
            case 'friends':
                await loadUserFriends(currentProfileUserId);
                break;
            case 'communities':
                await loadUserCommunities(currentProfileUserId);
                break;
            // ... otros casos según necesites
        }
    } catch (error) {
        console.error(`Error loading ${sectionId}:`, error);
        contentContainer.innerHTML = `<p>Error al cargar ${sectionId}</p>`;
    }
}

// Obtener perfil por slug
async function fetchUserProfileBySlug(slug) {
    const response = await fetch(`${API_BASE_URL}/users/${slug}`, {
        headers: getHeaders()
    });
    
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Este perfil es privado');
        }
        if (response.status === 404) {
            throw new Error('No se encontró el perfil de usuario');
        }
        throw new Error('Error al cargar el perfil');
    }
    
    return await response.json();
}

// Actualizar UI del perfil de usuario
function updateUserProfileUI(profile) {
    // Si el perfil es privado y no somos amigos
    if (profile.privacy === 'private' || (profile.privacy === 'friends' && !profile.isFriend)) {
        showPrivateProfile(profile);
        return;
    }

    profileElements.username.textContent = profile.username;
    profileElements.userBio.textContent = profile.bio || 'No hay biografía';
    profileElements.postsCount.textContent = profile.posts?.length || 0;
    profileElements.friendsCount.textContent = profile.friends?.length || 0;
    profileElements.communitiesCount.textContent = profile.community?.length || 0;
    
    if (profile.profilePicture) {
        profileElements.profileImage.src = profile.profilePicture;
    }
    if (profile.coverPicture) {
        profileElements.coverPhoto.src = profile.coverPicture;
    }
}

// Mostrar perfil privado
function showPrivateProfile(profile) {
    // Mostrar información básica
    profileElements.username.textContent = profile.username;
    profileElements.userBio.textContent = 'Perfil privado';
    
    // Ocultar estadísticas y contenido
    document.querySelector('.profile-stats').style.display = 'none';
    document.querySelector('.profile-content-container').style.display = 'none';
    
    // Mostrar mensaje de perfil privado
    profileElements.privateProfileMessage.style.display = 'block';
}

// Configurar estado de amistad
function setupFriendshipStatus(profile) {
    const friendActionBtn = profileElements.friendActionBtn;
    
    if (profile.isFriend) {
        friendActionBtn.innerHTML = '<i class="fas fa-user-minus"></i> Eliminar amigo';
        friendActionBtn.classList.add('is-friend');
    } else if (profile.friendRequestSent) {
        friendActionBtn.innerHTML = '<i class="fas fa-clock"></i> Solicitud enviada';
        friendActionBtn.disabled = true;
    } else if (profile.friendRequestReceived) {
        friendActionBtn.innerHTML = '<i class="fas fa-user-check"></i> Aceptar solicitud';
    }
    
    friendActionBtn.addEventListener('click', () => handleFriendAction(profile._id));
}

// Manejar acciones de amistad
async function handleFriendAction(userId) {
    const friendActionBtn = profileElements.friendActionBtn;
    
    try {
        if (friendActionBtn.classList.contains('is-friend')) {
            // Eliminar amigo
            await fetch(`${API_BASE_URL}/friends/remove/${userId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            
            friendActionBtn.innerHTML = '<i class="fas fa-user-plus"></i> Agregar amigo';
            friendActionBtn.classList.remove('is-friend');
        } else {
            // Enviar solicitud de amistad
            await fetch(`${API_BASE_URL}/friends/request/${userId}`, {
                method: 'POST',
                headers: getHeaders()
            });
            
            friendActionBtn.innerHTML = '<i class="fas fa-clock"></i> Solicitud enviada';
            friendActionBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al procesar la acción');
    }
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', initializeUserProfile);