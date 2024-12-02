
const API_URL = 'https://ship-connect.ddns.net/api';
let csrfToken = null;


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
      'Authorization': `Bearer ${localStorage.getItem('token')}`
  };
}







document.addEventListener("DOMContentLoaded", () => {
    const reelsContainer = document.getElementById("reels-container");
  
    // Función para formatear los reels en HTML
    const createReelHTML = (reel) => {
      return `
        <div class="reel">
          <div class="reel-header">
            <img class="profile-picture" src="${reel.author.profilePicture || 'default-profile.png'}" alt="${reel.author.username}">
            <span class="username">${reel.author.username}</span>
          </div>
          <video class="reel-video" controls>
            <source src="${reel.videoUrl}" type="video/mp4">
            Tu navegador no soporta videos HTML5.
          </video>
          <p class="reel-description">${reel.description || ''}</p>
          <div class="reel-actions">
            <span class="likes">❤️ ${reel.likes.length} Me gusta</span>
            <span class="comments">💬 ${reel.comments.length} Comentarios</span>
          </div>
        </div>
      `;
    };
  
    // Función para cargar los reels desde el backend
    const loadReels = async () => {
      try {
       const response = await fetch(`${API_URL}/reels`, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include', // Para enviar cookies o tokens
        });
  
        if (!response.ok) throw new Error("Error al cargar los reels");
  
        const reels = await response.json();
        if (reels.length === 0) {
          reelsContainer.innerHTML = "<p>No hay reels disponibles.</p>";
          return;
        }
  
        reelsContainer.innerHTML = reels.map(createReelHTML).join("");
      } catch (error) {
        console.error("Error:", error);
        reelsContainer.innerHTML = "<p>No se pudieron cargar los reels.</p>";
      }
    };
  
    // Cargar reels al inicializar la página
    loadReels();
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    const openReelModal = document.getElementById('openReelModal');
    const closeReelModal = document.getElementById('closeReelModal');
    const reelModal = document.getElementById('reelModal');
    const reelForm = document.getElementById('reelForm');

 

    // Abrir el modal
    openReelModal.addEventListener('click', () => {
        console.log('Abriendo el modal');
        reelModal.classList.remove('hidden');
    });

    // Cerrar el modal
    closeReelModal.addEventListener('click', () => {
        console.log('Cerrando el modal');
        reelModal.classList.add('hidden');
    });

    // Manejar la subida del reel
    reelForm.addEventListener('submit', handleReelCreation);
});

/**
 * Función para manejar la creación de un reel
 * @param {Event} e - Evento del formulario
 */
async function handleReelCreation(e) {
    e.preventDefault();

    const reelForm = e.target;
    const formData = new FormData(reelForm);

    const video = formData.get('video');
    const description = formData.get('description');
    const privacy = formData.get('privacy');

    // Validación adicional si es necesario
    if (!video || video.size === 0) {
        alert('Por favor, selecciona un video.');
        return;
    }

    try {

      console.log("header: "+csrfToken+ getHeaders2)
        // Llamada al backend
        const response = await fetch(`${API_URL}/reels`, {
            method: 'POST',
            headers: getHeaders2(),
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Error al subir el reel');
        }

        const result = await response.json();
        console.log('Reel creado:', result);

        // Cerrar el modal y reiniciar el formulario
        document.getElementById('reelModal').classList.add('hidden');
        reelForm.reset();
        alert('¡Reel subido con éxito!');
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al subir el reel. Por favor, intenta nuevamente.');
    }
}