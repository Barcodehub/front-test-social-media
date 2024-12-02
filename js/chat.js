// Socket.IO Real-Time Chat Implementation
const API_URL = 'https://ship-connect.ddns.net/api';
const SOCKET_URL = 'https://ship-connect.ddns.net'; // Update with your actual backend URL
let socket;
let csrfToken = null;
let currentUserId = null; // Variable global

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

function getHeaders2() {
    return {
        'X-CSRF-Token': csrfToken,
        'Authorization': `${localStorage.getItem('token')}`
    };
}




async function loadCurrentUserId() { 
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: getHeaders() // Asegúrate de que getHeaders maneje la autenticación
        });
        
        if (response.ok) {
            const userData = await response.json();
            // Extraer solo el ID del usuario
            currentUserId = userData._id; // Asumiendo que el ID del usuario está en la propiedad _id
           // return currentUserId; // Puedes devolver el ID si lo necesitas en otra parte de tu código
        }
    } catch (error) {
        console.error('Error al cargar el ID del usuario:', error);
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const friendList = document.getElementById('friendList');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageButton = document.getElementById('sendMessage');

    let selectedFriendId;
    

    // Initialize Socket.IO connection
    function initSocketConnection() {
        // Ensure you've included socket.io-client in your HTML
        // <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
        socket = io(SOCKET_URL, {
            withCredentials: true,
            extraHeaders: {
                'X-CSRF-Token': csrfToken
            }
        });

        // Join the user's personal room
        socket.emit('join', currentUserId);

        // Listen for new messages
        socket.on('newMessage', (messageData) => {
            // Only add the message if it's related to the current selected friend
            if ((messageData.sender._id === selectedFriendId) || 
                (messageData.receiver === selectedFriendId)) {
                addMessageToChat(messageData);
            }
        });
    }

    // Obtener amigos y llenar la lista
    async function loadFriends() {
        try {
            const response = await fetch(`${API_URL}/friends/myfriends`, {
                method: 'GET',
                headers: getHeaders2(),
                credentials: 'include',
            });
            const friends = await response.json();

            friends.forEach(friend => {
                const friendDiv = document.createElement('div');
                friendDiv.textContent = friend.username;
                friendDiv.onclick = () => selectFriend(friend._id);
                friendList.appendChild(friendDiv);
            });
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    // Seleccionar amigo y cargar mensajes
    function selectFriend(friendId) {
        selectedFriendId = friendId;
        loadMessages(friendId);
    }

    // Cargar mensajes entre el usuario y el amigo seleccionado
    async function loadMessages(friendId) {
        try {
            const response = await fetch(`${API_URL}/chat/messages/${friendId}`, {
                method: 'GET',
                headers: getHeaders2(),
                credentials: 'include',
            });
            const messages = await response.json();

            messagesContainer.innerHTML = '';
            messages.forEach(addMessageToChat);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    // Función para agregar mensaje al chat
    function addMessageToChat(message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        // Crear el contenedor para la foto de perfil
        const profileImg = document.createElement('img');
        profileImg.src = message.sender.profilePicture || '/assets/profile/default-profile.png';
        profileImg.alt = message.sender.username;
        profileImg.classList.add('profile-picture');

        // Crear el contenedor del texto
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.textContent = `${message.sender.username}: ${message.content}`;

        // Añadir los elementos al mensaje
        messageDiv.appendChild(profileImg);
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);

        // Scroll to the bottom of messages
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Enviar mensaje
    sendMessageButton.onclick = async () => {
        const content = messageInput.value.trim();

        if (content && selectedFriendId) {
            try {
                const response = await fetch(`${API_URL}/chat/messages`, {
                    method: 'POST',
                    headers: getHeaders(),
                    credentials: 'include',
                    body: JSON.stringify({ receiverId: selectedFriendId, content }),
                });

                const newMessage = await response.json();
                messageInput.value = ''; // Limpiar el campo de entrada

                // Emitir mensaje a través de Socket.IO (optional, as the backend should handle this)
                if (socket) {
                    socket.emit('sendMessage', {
                        senderId: currentUserId,
                        receiverId: selectedFriendId,
                        content: content
                    });
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };


    

    // Initial setup
    async function initChat() {
        // Check authentication
        checkAuth();
        
        // Get CSRF Token
        await getCsrfToken();
        await loadCurrentUserId();

        // Initialize Socket Connection
        initSocketConnection();

        // Load friends
        loadFriends();
    }

    // Initialize the chat
    initChat();
});

// Handle page unload to disconnect socket
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
});