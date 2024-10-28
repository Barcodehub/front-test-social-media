// home.js

// API Configuration
const API_URL = 'http://localhost:3000/api';
let csrfToken = null;

// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
    }
    return token;
}

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

// Load stories
async function loadStories() {
    try {
        const response = await fetch(`${API_URL}/stories`, {
            headers: getHeaders()
        });
        const stories = await response.json();
        renderStories(stories);
    } catch (error) {
        console.error('Error loading news feed:', error);
    }
}

function renderStories(stories) {
    const storiesList = document.getElementById('storiesList');
    storiesList.innerHTML = stories.map(story => `
        <div class="story-item" onclick="viewStory('${story._id}')">
            <img src="${story.mediaUrl || '/api/placeholder/120/200'}" alt="Story">
            <div class="story-info">
                <img src="/api/placeholder/30/30" alt="${story.author.username}" class="story-author-pic">
                <span>${story.author.username}</span>
            </div>
        </div>
    `).join('');
}

function renderPosts(posts) {
    const postsFeed = document.getElementById('postsFeed');
    postsFeed.innerHTML = posts.map(post => `
        <div class="post-card" data-post-id="${post._id}">
            <div class="post-header">
                <img src="/api/placeholder/40/40" alt="${post.author.username}" class="profile-pic">
                <div class="post-info">
                    <h4>${post.author.username}</h4>
                    <span class="post-time">${formatTimeAgo(post.createdAt)}</span>
                </div>
                ${post.author._id === getCurrentUserId() ? `
                    <div class="post-options">
                        <button onclick="showPostOptions('${post._id}')">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-actions">
                <button onclick="toggleLike('${post._id}')" class="action-btn ${post.likes.includes(getCurrentUserId()) ? 'liked' : ''}">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes.length}</span>
                </button>
                <button onclick="toggleComments('${post._id}')" class="action-btn">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments.length}</span>
                </button>
                <button onclick="sharePost('${post._id}')" class="action-btn">
                    <i class="fas fa-share"></i>
                </button>
            </div>
            <div class="comments-section" id="comments-${post._id}" style="display: none;">
                <div class="comments-list" id="comments-list-${post._id}"></div>
                <div class="add-comment">
                    <input type="text" placeholder="Añade un comentario..." id="comment-input-${post._id}">
                    <button onclick="addComment('${post._id}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Post interactions
async function toggleLike(postId) {
    try {
        const response = await fetch(`${API_URL}/likes/post/${postId}`, {
            method: 'POST',
            headers: getHeaders()
        });
        const result = await response.json();
        updatePostLikes(postId, result.likes);
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;

    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                contentId: postId,
                contentType: 'Post',
                content
            })
        });
        const comment = await response.json();
        appendComment(postId, comment);
        input.value = '';
    } catch (error) {
        console.error('Error adding comment:', error);
    }
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

// Create post
async function createPost(content) {
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content })
        });
        const post = await response.json();
        prependPost(post);
        closeCreatePostModal();
    } catch (error) {
        console.error('Error creating post:', error);
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
    await loadUserData();
    await loadNewsFeed();
    await loadStories();
    await loadFriendRequests();
    
    setupEventListeners();
});

function setupEventListeners() {
    // Create post modal
    const createPostBtn = document.getElementById('create-post-btn');
    const createPostModal = document.getElementById('createPostModal');
    
    createPostBtn.addEventListener('click', () => {
        createPostModal.style.display = 'block';
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/login.html';
    });
    
    // Post input
    const postInput = document.getElementById('post-input');
    postInput.addEventListener('click', () => {
        createPostModal.style.display = 'block';
    });
}

// Initialize
setupEventListeners();