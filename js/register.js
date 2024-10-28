 
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
    }
}

// Función para registrar usuario
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar el token en localStorage
            localStorage.setItem('token', data.token);
            // Redirigir al usuario a la página principal
            window.location.href = '/home.html';
        } else {
            throw new Error(data.message || 'Error en el registro');
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
    
    const form = document.getElementById('registerForm');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', getCsrfToken);

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: password
    };
    
    await registerUser(userData);
});