

// Configuración de la API
const API_URL = 'http://localhost:3000/api/auth';
let csrfToken = null;

// Obtener el token CSRF al cargar la página
async function getCsrfToken() {
    try {
        const response = await fetch(`${API_URL}/csrf-token`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.csrfToken;
    } catch (error) {
        console.error('Error al obtener el token CSRF:', error);
        showError('Error al conectar con el servidor');
    }
}

// Función para iniciar sesión
async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            if (data.requiresTwoFactor) {
                localStorage.setItem('userId', data.user._id); // Guardar userId temporalmente
                // Redirigir a la página de verificación 2FA
                window.location.href = '/2fa.html';
                return;
            }
            
            // Guardar el token en localStorage
            localStorage.setItem('token', data.token);
           // console.log('Token guardado:', data.token); // Verificar el token
            // Redirigir al usuario a la página principal
            window.location.href = '/home.html';
        } else {
            throw new Error(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        showError(error.message);
    }
}

// Función para mostrar errores
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.getElementById('loginForm');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', getCsrfToken);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const credentials = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    await loginUser(credentials);
});

function getHeaders2() {
    return {
        'X-CSRF-Token': csrfToken,
    };
}


document.getElementById('googleLoginBtn').addEventListener('click', initiateGoogleLogin);

function initiateGoogleLogin() {
    // Construct the Google OAuth URL on your backend
    const googleAuthURL = `${API_URL}/google`;
    
    // Redirect to the backend's Google authentication endpoint
    window.location.href = googleAuthURL;
}


function storeTokenAndRedirect(token) {
    try {
        // Store the token in localStorage
        localStorage.setItem('token', token);
        
        // Redirect to home page
        window.location.href = '/home.html';
    } catch (error) {
        console.error('Error storing token:', error);
        showError('Error al iniciar sesión. Por favor, inténtelo de nuevo.');
    }
}

// Modify your existing code to handle token from URL
document.addEventListener('DOMContentLoaded', () => {
    // Check for token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Store token and redirect
        storeTokenAndRedirect(token);
        return;
    }

    // Existing CSRF token retrieval
    getCsrfToken();
});











/* 

// Esta función debe llamarse cuando se recibe la respuesta de Google
function handleTokenResponse(token) {
    // Guardar el token en localStorage
    localStorage.setItem('token', token);
    console.log('Token guardado:', token);
    // Redirigir al usuario a home.html
    window.location.href = '/home.html';
}

// Manejo de la respuesta después de la autenticación
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('code')) {
    // Aquí puedes hacer una solicitud al backend para intercambiar el código por un token
    fetch(`${API_URL}/auth/google/callback?code=${urlParams.get('code')}`, {
        method: 'GET' // o 'POST', según tu implementación
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la autenticación');
        }
        return response.json();
    })
    .then(data => {
        // Llama a la función para manejar la respuesta y guardar el token
        if (data.token) {
            handleTokenResponse(data.token);
        } else {
            console.error('No se recibió un token');
        }
    })
    .catch(error => {
        console.error('Error al manejar la autenticación:', error);
        // Manejo de errores
    });
} */














/* // In your dashboard.js or login handling script
document.addEventListener('DOMContentLoaded', () => {
    // Check for token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log("token es: "+token)

    if (token) {
        // Store the token securely (e.g., in localStorage or httpOnly cookie)
        localStorage.setItem('token', token);
        
        // Remove the token from the URL
        window.history.replaceState({}, document.title, "/home.html");

        // Optionally, verify the token or fetch user data
        fetchUserProfile();
    }
});

function fetchUserProfile() {
    const token = localStorage.getItem('token');
    
    console.log("tokeen es: "+token)
    if (token) {
        fetch(`${API_URL}/user/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(user => {
            // Update UI with user profile
            console.log('User profile:', user);
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            // Handle token expiration or invalid token
        });
    }
}
 */


// Add this to your existing login.js

// Optional: Add a function to handle Google login errors
function handleGoogleLoginError() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error === 'authentication_failed') {
        showError('La autenticación con Google ha fallado. Por favor, inténtelo de nuevo.');
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    getCsrfToken();
    handleGoogleLoginError();
});