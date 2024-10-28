 
// Configuración de la API
const API_URL = 'http://localhost:3000/api/auth';
let csrfToken = null;

// Función para obtener el token CSRF
async function getCsrfToken() {
    try {
        const response = await fetch(`${API_URL}/csrf-token`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.csrfToken;
        return csrfToken;
    } catch (error) {
        console.error('Error al obtener el token CSRF:', error);
    }
}

// Obtener el token CSRF al cargar la página
document.addEventListener('DOMContentLoaded', getCsrfToken);

// Funciones de redirección
function redirectToLogin() {
    window.location.href = '/login.html';
}

function redirectToRegister() {
    window.location.href = '/register.html';
}