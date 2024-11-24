 
 // Configuración de la API
//const API_URL = 'http://localhost:3000/api';
//let csrfToken = null;

// Función para obtener el token CSRF
/* async function getCsrfToken() {
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
} */

// Obtener el token CSRF al cargar la página
/* document.addEventListener('DOMContentLoaded', getCsrfToken); */



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



// En el JavaScript, actualiza el código para usar querySelectorAll
// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadCurrentProfilePicture();
        setupEventListeners();
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        showError('Error al inicializar la aplicación');
    }
});

// Cargar la foto de perfil actual
async function loadCurrentProfilePicture() {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.profilePicture) {
                // Actualizar todas las imágenes de perfil
                document.querySelectorAll('.profile-image').forEach(img => {
                    img.src = userData.profilePicture;
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar la foto de perfil:', error);
    }
}

// Mostrar preview de la imagen
function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        // Actualizar todas las imágenes de perfil
        document.querySelectorAll('.profile-image').forEach(img => {
            img.src = e.target.result;
        });
    };
    reader.readAsDataURL(file);
}




/* // Exportar funciones y variables
export default {
    profileImage,
    profilePictureInput,
    loadCurrentProfilePicture,
    showImagePreview,
    setupEventListeners,
}; */