
const API_URL = 'https://ship-connect.ddns.net/api/auth';
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
// Event Listeners
document.addEventListener('DOMContentLoaded', getCsrfToken);


function getHeaders() { 
    return {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    };
}

document.addEventListener('DOMContentLoaded', async () => {

    await getCsrfToken();

});


document.getElementById('twoFactorForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevenir el envío del formulario

    const token = document.getElementById('token').value;
    const userId = localStorage.getItem('userId'); // Guardar el userId temporalmente
    console.log(userId);
    console.log(getHeaders());
    try {
        const response = await fetch(`${API_URL}/verifyTwoFactor`, {
            method: 'POST',
            headers: getHeaders(),
            credentials: 'include',
            body: JSON.stringify({ token, userId }) // Enviar el userId
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar el nuevo token en localStorage y redirigir a la página principal
            localStorage.setItem('token', data.token);
            console.log('Token guardado después de 2FA:', data.token); // Verificar el token
            window.location.href = '/home.html';
        } else {
            // Mostrar error si el código 2FA es inválido
            document.getElementById('error').innerText = data.message || 'Error al verificar el código';
        }
    } catch (error) {
        document.getElementById('error').innerText = error.message;
    }
});


