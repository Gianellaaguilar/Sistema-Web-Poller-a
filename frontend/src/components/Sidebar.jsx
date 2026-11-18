import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiHome, FiShoppingCart, FiList, FiBarChart2, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { GiChickenOven } from 'react-icons/gi'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const menuItems = [
  { href: '/', icon: FiHome, label: 'Inicio' },
  { href: '/nuevo-pedido', icon: FiShoppingCart, label: 'Nuevo Pedido' },
  { href: '/pedidos', icon: FiList, label: 'Pedidos' },
  { href: '/reportes', icon: FiBarChart2, label: 'Reportes' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-dark-950 text-white rounded-xl shadow-lg"
      >
        {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 bg-black/50 z-40 cursor-default"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-dark-950 flex flex-col
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <GiChickenOven className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="font-display text-sm text-white">POLLERÍA</h1>
              <h2 className="font-display text-primary-400 text-lg -mt-1">LAS DELICIAS</h2>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <item.icon className="text-xl" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-dark-800">
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-dark-800 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user?.nombre?.charAt(0).toUpperCase() || 'T'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user?.nombre || 'Trabajador'}</p>
              <p className="text-dark-400 text-xs">Trabajador</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <FiLogOut className="text-xl" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

