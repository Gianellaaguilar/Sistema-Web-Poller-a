import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingCart, FiDollarSign, FiTruck, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [pedidosPendientes, setPedidosPendientes] = useState([])
  const [pedidosPreparando, setPedidosPreparando] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [statsRes, pendientesRes, preparandoRes] = await Promise.all([
        api.get('/estadisticas/resumen?periodo=dia'),
        api.get('/pedidos?estado=pendiente'),
        api.get('/pedidos?estado=preparando')
      ])

      if (statsRes.success) setStats(statsRes.data)
      if (pendientesRes.success) setPedidosPendientes(pendientesRes.data)
      if (preparandoRes.success) setPedidosPreparando(preparandoRes.data)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-950">
            ¡Hola, {user?.nombre}! 👋
          </h1>
          <p className="text-dark-500 mt-1">
            Bienvenido a Pollería Las Delicias - Resumen del día
          </p>
        </div>
        <Link to="/nuevo-pedido" className="btn-primary inline-flex items-center gap-2">
          <FiShoppingCart className="text-xl" />
          <span>Nuevo Pedido</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FiShoppingCart className="text-2xl text-primary-600" />
            </div>
            <span className="text-xs font-medium text-dark-400 bg-dark-100 px-2 py-1 rounded-full">HOY</span>
          </div>
          <p className="text-3xl font-bold text-dark-950">{stats?.total_pedidos || 0}</p>
          <p className="text-dark-500 text-sm mt-1">Pedidos realizados</p>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <FiDollarSign className="text-2xl text-accent-600" />
            </div>
            <span className="text-xs font-medium text-dark-400 bg-dark-100 px-2 py-1 rounded-full">HOY</span>
          </div>
          <p className="text-3xl font-bold text-dark-950">{formatMoney(Number.parseFloat(stats?.total_ventas || 0))}</p>
          <p className="text-dark-500 text-sm mt-1">Ventas totales</p>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiUsers className="text-2xl text-blue-600" />
            </div>
            <span className="text-xs font-medium text-dark-400 bg-dark-100 px-2 py-1 rounded-full">HOY</span>
          </div>
          <p className="text-3xl font-bold text-dark-950">{stats?.pedidos_salon || 0}</p>
          <p className="text-dark-500 text-sm mt-1">Pedidos salón</p>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiTruck className="text-2xl text-purple-600" />
            </div>
            <span className="text-xs font-medium text-dark-400 bg-dark-100 px-2 py-1 rounded-full">HOY</span>
          </div>
          <p className="text-3xl font-bold text-dark-950">
            {(Number.parseInt(stats?.pedidos_delivery || 0) + Number.parseInt(stats?.pedidos_recojo || 0))}
          </p>
          <p className="text-dark-500 text-sm mt-1">Delivery + Recojo</p>
        </div>
      </div>

      {/* Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendientes */}
        <div className="card">
          <div className="p-6 border-b border-dark-100 flex items-center justify-between">
            <h3 className="font-semibold text-dark-950 flex items-center gap-2">
              <FiClock className="text-yellow-500" />
              <span>Pedidos Pendientes</span>
            </h3>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
              {pedidosPendientes.length}
            </span>
          </div>
          <div className="divide-y divide-dark-100 max-h-80 overflow-y-auto">
            {pedidosPendientes.length === 0 ? (
              <div className="p-6 text-center text-dark-400">No hay pedidos pendientes</div>
            ) : (
              pedidosPendientes.slice(0, 5).map((pedido) => (
                <Link 
                  key={pedido.id} 
                  to={`/pedidos/${pedido.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-dark-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FiClock className="text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-950 truncate">{pedido.numero_pedido}</p>
                    <p className="text-sm text-dark-500">
                      {pedido.nombre_cliente || 'Cliente'} • {pedido.tipo_atencion}
                    </p>
                  </div>
                  <p className="font-semibold text-dark-950">{formatMoney(pedido.total)}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Preparando */}
        <div className="card">
          <div className="p-6 border-b border-dark-100 flex items-center justify-between">
            <h3 className="font-semibold text-dark-950 flex items-center gap-2">
              <FiCheckCircle className="text-blue-500" />
              <span>En Preparación</span>
            </h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
              {pedidosPreparando.length}
            </span>
          </div>
          <div className="divide-y divide-dark-100 max-h-80 overflow-y-auto">
            {pedidosPreparando.length === 0 ? (
              <div className="p-6 text-center text-dark-400">No hay pedidos en preparación</div>
            ) : (
              pedidosPreparando.slice(0, 5).map((pedido) => (
                <Link 
                  key={pedido.id} 
                  to={`/pedidos/${pedido.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-dark-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-950 truncate">{pedido.numero_pedido}</p>
                    <p className="text-sm text-dark-500">
                      {pedido.nombre_cliente || 'Cliente'} • {pedido.tipo_atencion}
                    </p>
                  </div>
                  <p className="font-semibold text-dark-950">{formatMoney(pedido.total)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="card p-6">
        <h3 className="font-semibold text-dark-950 mb-4">Métodos de Pago - Hoy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">💵</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {formatMoney(Number.parseFloat(stats?.ventas_efectivo || 0))}
              </p>
              <p className="text-green-600 text-sm">Efectivo</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">📱</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {formatMoney(Number.parseFloat(stats?.ventas_yape || 0))}
              </p>
              <p className="text-purple-600 text-sm">Yape</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

