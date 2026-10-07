const API_URL = '/api'

let authToken = null

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    const data = await response.json()
    
    if (!response.ok && response.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    return data
  } catch (error) {
    console.error('Error en API:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

export const api = {
  setToken: (token) => {
    authToken = token
  },
  
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  patch: (endpoint, data) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
}

