import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle, FiEye, FiRefreshCw } from 'react-icons/fi'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const estadoConfig = {
  pendiente: { icon: FiClock, color: 'yellow', label: 'Pendiente' },
  preparando: { icon: FiPackage, color: 'blue', label: 'Preparando' },
  listo: { icon: FiCheckCircle, color: 'green', label: 'Listo' },
  entregado: { icon: FiTruck, color: 'gray', label: 'Entregado' },
  cancelado: { icon: FiXCircle, color: 'red', label: 'Cancelado' }
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarPedidos()
  }, [filtroEstado, filtroFecha])

  const cargarPedidos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroFecha) params.append('fecha', filtroFecha)
      if (filtroEstado) params.append('estado', filtroEstado)

      const response = await api.get(`/pedidos?${params.toString()}`)
      if (response.success) setPedidos(response.data)
    } catch (error) {
      toast.error('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstado = async (pedidoId, nuevoEstado) => {
    try {
      const response = await api.patch(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado })
      if (response.success) {
        toast.success('Estado actualizado')
        cargarPedidos()
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const formatMoney = (amount) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })

  const pedidosFiltrados = pedidos.filter(p => {
    if (!busqueda) return true
    return p.numero_pedido.toLowerCase().includes(busqueda.toLowerCase()) ||
           (p.nombre_cliente && p.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()))
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-950">Pedidos</h1>
        <p className="text-dark-500 mt-1">Gestiona los pedidos del día</p>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="input-field pl-10 py-2" />
          </div>
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="input-field py-2" />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input-field py-2">
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="preparando">Preparando</option>
            <option value="listo">Listo</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button onClick={cargarPedidos} className="px-4 py-2 bg-dark-100 rounded-xl hover:bg-dark-200 flex items-center gap-2">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(estadoConfig).map(([estado, config]) => {
          const count = pedidos.filter(p => p.estado === estado).length
          const Icon = config.icon
          return (
            <button key={estado} onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
              className={`card p-4 text-center transition-all ${filtroEstado === estado ? 'ring-2 ring-primary-500' : ''}`}>
              <Icon className={`text-2xl mx-auto mb-2 text-${config.color}-500`} />
              <p className="text-2xl font-bold text-dark-950">{count}</p>
              <p className="text-dark-500 text-sm">{config.label}</p>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="card p-12 text-center">
          <FiPackage className="text-5xl text-dark-300 mx-auto mb-4" />
          <p className="text-dark-500">No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => {
            const estadoConf = estadoConfig[pedido.estado]
            const EstadoIcon = estadoConf.icon

            return (
              <div key={pedido.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-dark-950">{pedido.numero_pedido}</span>
                      <span className={`badge-${pedido.estado}`}>
                        <EstadoIcon className="mr-1" /> {estadoConf.label}
                      </span>
                      <span className="text-sm text-dark-400">
                        {pedido.tipo_atencion === 'salon' ? '🪑' : pedido.tipo_atencion === 'delivery' ? '🛵' : '📦'} {pedido.tipo_atencion}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500">
                      <span>👤 {pedido.nombre_cliente || 'Sin nombre'}</span>
                      <span>💳 {pedido.metodo_pago}</span>
                      <span>🕐 {formatTime(pedido.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-primary-600">{formatMoney(pedido.total)}</p>

                  <div className="flex items-center gap-2">
                    {pedido.estado === 'pendiente' && (
                      <button onClick={() => actualizarEstado(pedido.id, 'preparando')} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-200">Preparar</button>
                    )}
                    {pedido.estado === 'preparando' && (
                      <button onClick={() => actualizarEstado(pedido.id, 'listo')} className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200">Listo</button>
                    )}
                    {pedido.estado === 'listo' && (
                      <button onClick={() => actualizarEstado(pedido.id, 'entregado')} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Entregar</button>
                    )}
                    <Link to={`/pedidos/${pedido.id}`} className="px-3 py-2 bg-dark-100 text-dark-700 rounded-xl text-sm font-medium hover:bg-dark-200 flex items-center gap-1">
                      <FiEye /> Ver
                    </Link>
                    {!['entregado', 'cancelado'].includes(pedido.estado) && (
                      <button onClick={() => confirm('¿Cancelar?') && actualizarEstado(pedido.id, 'cancelado')} className="px-3 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200">
                        <FiXCircle />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

