

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
                // Redirigir a la página de verificación 2FA
                window.location.href = '/2fa.html';
                return;
            }
            
            // Guardar el token en localStorage
            localStorage.setItem('token', data.token);
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
