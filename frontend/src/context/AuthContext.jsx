import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay token guardado
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      api.setToken(token)
    }
    
    setLoading(false)
  }, [])

  const login = async (usuario, password) => {
    const response = await api.post('/auth/login', { usuario, password })
    
    if (response.success) {
      const { token, trabajador } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(trabajador))
      api.setToken(token)
      setUser(trabajador)
    }
    
    return response
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    api.setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

