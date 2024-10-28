// Constants
const API_BASE_URL = 'http://localhost:3000/api';
const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': localStorage.getItem('csrfToken'),
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
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData(profileElements.editProfileForm);
    const updateData = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Error updating profile');
        
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


// Abre el modal de edición de foto de perfil
document.getElementById('editProfilePicBtn').addEventListener('click', () => {
    document.getElementById('editProfilePictureModal').style.display = 'block';
});

// Cierra el modal al hacer clic en la "x"
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('editProfilePictureModal').style.display = 'none';
});

// Maneja el envío del formulario para la foto de perfil
document.getElementById('editProfilePictureForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = checkAuth(); // Obtiene el token de autenticación

    try {
        const response = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Error al actualizar la foto de perfil');

        const data = await response.json();
        document.getElementById('profilePicture').src = data.imageUrl; // Actualiza la imagen de perfil en la interfaz
        document.getElementById('editProfilePictureModal').style.display = 'none'; // Cierra el modal
        alert('Foto de perfil actualizada exitosamente');
    } catch (error) {
        console.error('Error al actualizar la foto de perfil:', error);
        alert('Hubo un error al actualizar la foto de perfil');
    }
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
function createPostHTML(post) {
    return `
        <div class="post-card" data-id="${post._id}">
            <div class="post-header">
                <img src="${post.author.profilePicture || '/api/placeholder/40/40'}" alt="Profile" class="profile-pic">
                <div class="post-info">
                    <h4>${post.author.username}</h4>
                    <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button class="like-btn" onclick="handleLike('${post._id}', 'post')">
                    <i class="fas fa-heart"></i> ${post.likes.length}
                </button>
                <button class="comment-btn" onclick="handleComment('${post._id}')">
                    <i class="fas fa-comment"></i> ${post.comments.length}
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
async function handleLike(contentId, type) {
    try {
        const response = await fetch(`${API_BASE_URL}/${type}s/${contentId}/like`, {
            method: 'POST',
            headers
        });
        
        if (!response.ok) throw new Error('Error al dar like');
        
        const updatedContent = await response.json();
        const likeButton = document.querySelector(`[data-id="${contentId}"] .like-btn`);
        if (likeButton) {
            const likesCount = likeButton.querySelector('i + span') || likeButton;
            likesCount.textContent = ` ${updatedContent.likes.length}`;
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al procesar el like');
    }
}

async function handleComment(contentId) {
    const commentText = prompt('Escribe tu comentario:');
    if (!commentText) return;

    try {
        const response = await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                contentId,
                content: commentText,
                contentType: 'Post' // Por defecto asumimos que es un post
            })
        });
        
        if (!response.ok) throw new Error('Error al comentar');
        
        const newComment = await response.json();
        const commentButton = document.querySelector(`[data-id="${contentId}"] .comment-btn`);
        if (commentButton) {
            const commentsCount = commentButton.querySelector('i + span') || commentButton;
            const currentCount = parseInt(commentsCount.textContent);
            commentsCount.textContent = ` ${currentCount + 1}`;
        }
        
        showSuccess('Comentario agregado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al agregar el comentario');
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

Object.entries(fileUploadHandlers).forEach(([type, button]) => {
    button.addEventListener('click', () => handleFileUpload(type));
});

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