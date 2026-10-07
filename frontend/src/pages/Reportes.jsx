import { useState, useEffect } from 'react'
import { FiShoppingCart, FiDollarSign, FiTrendingUp, FiPieChart } from 'react-icons/fi'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function Reportes() {
  const [periodo, setPeriodo] = useState('dia')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [periodo])

  const cargarEstadisticas = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/estadisticas/resumen?periodo=${periodo}`)
      if (response.success) setStats(response.data)
    } catch (error) {
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0)
  
  const calcularPorcentaje = (valor, total) => total === 0 ? 0 : Math.round((valor / total) * 100)

  const periodoLabels = { dia: 'Hoy', semana: 'Esta Semana', mes: 'Este Mes' }

  const totalPorTipo = stats ? parseInt(stats.pedidos_salon || 0) + parseInt(stats.pedidos_delivery || 0) + parseInt(stats.pedidos_recojo || 0) : 0
  const totalPorPago = stats ? parseFloat(stats.ventas_efectivo || 0) + parseFloat(stats.ventas_yape || 0) : 0

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-950">Reportes</h1>
          <p className="text-dark-500 mt-1">Estadísticas del negocio</p>
        </div>

        <div className="flex bg-dark-100 rounded-xl p-1">
          {['dia', 'semana', 'mes'].map((p) => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${periodo === p ? 'bg-white shadow text-primary-600' : 'text-dark-500'}`}>
              {periodoLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      ) : stats && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <FiShoppingCart className="text-2xl text-white" />
              </div>
              <p className="text-4xl font-bold text-dark-950">{stats.total_pedidos || 0}</p>
              <p className="text-dark-500 mt-1">Total Pedidos</p>
            </div>

            <div className="card p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <FiDollarSign className="text-2xl text-white" />
              </div>
              <p className="text-4xl font-bold text-dark-950">{formatMoney(parseFloat(stats.total_ventas || 0))}</p>
              <p className="text-dark-500 mt-1">Ventas Totales</p>
            </div>

            <div className="card p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <FiTrendingUp className="text-2xl text-white" />
              </div>
              <p className="text-4xl font-bold text-dark-950">
                {stats.total_pedidos > 0 ? formatMoney(parseFloat(stats.total_ventas || 0) / stats.total_pedidos) : formatMoney(0)}
              </p>
              <p className="text-dark-500 mt-1">Ticket Promedio</p>
            </div>

            <div className="card p-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <FiPieChart className="text-2xl text-white" />
              </div>
              <p className="text-4xl font-bold text-dark-950">{stats.pedidos_delivery || 0}</p>
              <p className="text-dark-500 mt-1">Deliveries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por tipo */}
            <div className="card p-6">
              <h3 className="font-semibold text-dark-950 mb-6">Por Tipo de Atención</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2"><span>🪑 Salón</span><span className="font-semibold">{stats.pedidos_salon || 0}</span></div>
                  <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${calcularPorcentaje(parseInt(stats.pedidos_salon || 0), totalPorTipo)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2"><span>🛵 Delivery</span><span className="font-semibold">{stats.pedidos_delivery || 0}</span></div>
                  <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${calcularPorcentaje(parseInt(stats.pedidos_delivery || 0), totalPorTipo)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2"><span>📦 Recojo</span><span className="font-semibold">{stats.pedidos_recojo || 0}</span></div>
                  <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${calcularPorcentaje(parseInt(stats.pedidos_recojo || 0), totalPorTipo)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Por pago */}
            <div className="card p-6">
              <h3 className="font-semibold text-dark-950 mb-6">Por Método de Pago</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">💵</div>
                  <p className="text-2xl font-bold text-green-700">{formatMoney(parseFloat(stats.ventas_efectivo || 0))}</p>
                  <p className="text-green-600 text-sm">Efectivo</p>
                  <p className="text-green-500 text-xs">{calcularPorcentaje(parseFloat(stats.ventas_efectivo || 0), totalPorPago)}%</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">📱</div>
                  <p className="text-2xl font-bold text-purple-700">{formatMoney(parseFloat(stats.ventas_yape || 0))}</p>
                  <p className="text-purple-600 text-sm">Yape</p>
                  <p className="text-purple-500 text-xs">{calcularPorcentaje(parseFloat(stats.ventas_yape || 0), totalPorPago)}%</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

