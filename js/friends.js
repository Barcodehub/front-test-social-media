// Función para obtener el token
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  
  // Función para verificar si el token existe
  function checkAuth() {
    const token = getAuthToken();
    if (!token) {
      showError('No hay sesión activa. Por favor, inicia sesión.');
      return false;
    }
    return true;
  }
  
  // Función para cargar las solicitudes de amistad
  async function loadFriendRequests() {
    if (!checkAuth()) return;
  
    try {
      const response = await fetch(`${API_BASE_URL}/friends/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Incluir cookies si las usas
      });
      
      if (response.status === 403) {
        showError('No tienes permiso para ver las solicitudes. Por favor, vuelve a iniciar sesión.');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const requests = await response.json();
      displayFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      showError('No se pudieron cargar las solicitudes de amistad');
    }
  }
  
  // Función para mostrar las solicitudes de amistad
  function displayFriendRequests(requests) {
    const container = document.getElementById('friendRequests');
    if (!container) {
      console.error('Element #friendRequests not found');
      return;
    }
  
    container.innerHTML = '';
  
    if (!Array.isArray(requests) || requests.length === 0) {
      container.innerHTML = '<div class="no-requests">No tienes solicitudes de amistad pendientes.</div>';
      return;
    }
  
    requests.forEach(request => {
      if (!request || !request.sender || !request.sender.username) {
        console.error('Invalid request data:', request);
        return;
      }
  
      const requestElement = document.createElement('div');
      requestElement.className = 'friend-request';
      requestElement.innerHTML = `
        <div>
          <strong>${request.sender.username}</strong> quiere ser tu amigo
          <div class="friend-request-buttons">
            <button class="accept-btn" data-request-id="${request._id}" data-action="accepted">
              Aceptar
            </button>
            <button class="reject-btn" data-request-id="${request._id}" data-action="rejected">
              Rechazar
            </button>
          </div>
        </div>
      `;
      container.appendChild(requestElement);
    });
  
    // Agregar event listeners usando delegación de eventos
    container.addEventListener('click', async (e) => {
      const button = e.target.closest('button');
      if (!button) return;
  
      const requestId = button.dataset.requestId;
      const action = button.dataset.action;
      if (requestId && action) {
        await respondToRequest(requestId, action);
      }
    });
  }
  
  // Función para responder a una solicitud de amistad
  async function respondToRequest(requestId, status) {
    if (!checkAuth()) return;
  
    try {
      const response = await fetch(`${API_BASE_URL}/friends/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include', // Incluir cookies si las usas
        body: JSON.stringify({ requestId, status })
      });
  
      if (response.status === 403) {
        showError('No tienes permiso para realizar esta acción. Por favor, vuelve a iniciar sesión.');
        return;
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
  
      const result = await response.json();
      
      // Recargar las solicitudes después de responder
      await loadFriendRequests();
      
      // Mostrar mensaje de éxito
      showMessage(status === 'accepted' ? 'Solicitud aceptada con éxito' : 'Solicitud rechazada');
    } catch (error) {
      console.error('Error responding to friend request:', error);
      showError(error.message || 'No se pudo procesar la solicitud');
    }
  }
  
  // Función para mostrar mensajes de éxito
  function showMessage(message) {
    // Implementa tu sistema de notificaciones aquí
    // Por ahora, usaremos una alerta básica
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // Función para mostrar errores
  function showError(error) {
    // Implementa tu sistema de notificaciones de error aquí
    // Por ahora, usaremos una alerta básica
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = error;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // Cargar las solicitudes al cargar la página
  document.addEventListener('DOMContentLoaded', loadFriendRequests);