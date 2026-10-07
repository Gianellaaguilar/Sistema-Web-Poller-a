import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi'
import { GiChickenOven } from 'react-icons/gi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await login(usuario, password)

      if (response.success) {
        toast.success(`¡Bienvenido, ${response.data.trabajador.nombre}!`)
        navigate('/')
      } else {
        toast.error(response.error || 'Error al iniciar sesión')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-pattern">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl shadow-2xl shadow-primary-500/40 mb-6 animate-float">
            <GiChickenOven className="text-5xl text-white" />
          </div>
          <p className="text-dark-500 text-lg mb-1">POLLERÍA</p>
          <h1 className="font-display text-3xl text-primary-600 font-bold">LAS DELICIAS Nº 1</h1>
          <p className="text-dark-500">Sistema de Pedidos para Trabajadores</p>
        </div>

        {/* Formulario */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-dark-700 font-medium mb-2">Usuario</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-xl" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-dark-700 font-medium mb-2">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-xl" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiLogIn className="text-xl" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-100">
            <p className="text-center text-dark-400 text-sm">
              ¿Problemas para acceder? Contacta al encargado
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-dark-400 text-sm">© 2025 Pollería Las Delicias Nº 1</p>
        </div>
      </div>
    </div>
  )
}

