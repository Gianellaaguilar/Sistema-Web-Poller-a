import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiPrinter, FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle, FiUser, FiMapPin, FiPhone, FiCreditCard } from 'react-icons/fi'
import { api } from '../services/api'
import { generarHtmlBoleta } from '../utils/boleta'
import toast from 'react-hot-toast'

const estadoConfig = {
  pendiente: { icon: FiClock, label: 'Pendiente' },
  preparando: { icon: FiPackage, label: 'Preparando' },
  listo: { icon: FiCheckCircle, label: 'Listo' },
  entregado: { icon: FiTruck, label: 'Entregado' },
  cancelado: { icon: FiXCircle, label: 'Cancelado' }
}

const tipoAtencionEmoji = { salon: '🪑', delivery: '🛵', recojo: '📦' }

export default function DetallePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [detalles, setDetalles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void cargarPedido()
  }, [id])

  const cargarPedido = async () => {
    try {
      const response = await api.get(`/pedidos/${id}`)
      if (response.success) {
        setPedido(response.data.pedido)
        setDetalles(response.data.detalles)
      } else {
        toast.error('Pedido no encontrado')
        navigate('/pedidos')
      }
    } catch (error) {
      toast.error('Error al cargar pedido')
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstado = async (nuevoEstado) => {
    try {
      const response = await api.patch(`/pedidos/${id}/estado`, { estado: nuevoEstado })
      if (response.success) {
        toast.success('Estado actualizado')
        setPedido(response.data)
      }
    } catch (error) {
      toast.error('Error')
    }
  }

  const imprimirBoleta = (tipo) => {
    if (!pedido) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const esCocina = tipo === 'cocina'
    const html = generarHtmlBoleta({
      esCocina,
      documento: pedido.numero_pedido,
      tipoAtencion: pedido.tipo_atencion,
      nombreCliente: pedido.nombre_cliente,
      fecha: pedido.created_at,
      items: detalles.map(d => ({ cantidad: d.cantidad, nombre: d.producto_nombre, subtotal: esCocina ? null : d.subtotal })),
      pago: pedido
    })
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }

  const formatMoney = (amount) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div></div>
  }

  if (!pedido) return <div className="text-center py-12"><p>No encontrado</p><Link to="/pedidos" className="text-primary-500">Volver</Link></div>

  const estadoConf = estadoConfig[pedido.estado]
  const EstadoIcon = estadoConf?.icon || FiClock

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/pedidos" className="w-10 h-10 bg-dark-100 rounded-xl flex items-center justify-center hover:bg-dark-200"><FiArrowLeft /></Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-dark-950">{pedido.numero_pedido}</h1>
          <p className="text-dark-500">{new Date(pedido.created_at).toLocaleString('es-PE')}</p>
        </div>
        <span className={`badge-${pedido.estado} text-lg px-4 py-2`}><EstadoIcon className="mr-2" />{estadoConf?.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Productos */}
          <div className="card">
            <div className="p-6 border-b border-dark-100"><h3 className="font-semibold text-dark-950">Productos</h3></div>
            <div className="divide-y divide-dark-100">
              {detalles.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-600">{item.cantidad}</div>
                  <div className="flex-1">
                    <p className="font-medium text-dark-950">{item.producto_nombre}</p>
                    <p className="text-sm text-dark-500">{formatMoney(item.precio_unitario)} c/u</p>
                  </div>
                  <p className="font-bold text-dark-950">{formatMoney(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-dark-100 bg-dark-50 flex items-center justify-between">
              <span className="font-semibold text-dark-700">Total</span>
              <span className="text-2xl font-bold text-primary-600">{formatMoney(pedido.total)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="card p-6">
            <h3 className="font-semibold text-dark-950 mb-4">Acciones</h3>
            <div className="flex flex-wrap gap-3">
              {pedido.estado === 'pendiente' && <button onClick={() => actualizarEstado('preparando')} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2"><FiPackage /> Preparar</button>}
              {pedido.estado === 'preparando' && <button onClick={() => actualizarEstado('listo')} className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium flex items-center gap-2"><FiCheckCircle /> Listo</button>}
              {pedido.estado === 'listo' && <button onClick={() => actualizarEstado('entregado')} className="px-4 py-2 bg-gray-500 text-white rounded-xl font-medium flex items-center gap-2"><FiTruck /> Entregar</button>}
              <button onClick={() => imprimirBoleta('cocina')} className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-medium flex items-center gap-2"><FiPrinter /> Cocina</button>
              <button onClick={() => imprimirBoleta('cliente')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium flex items-center gap-2"><FiPrinter /> Cliente</button>
              {!['entregado', 'cancelado'].includes(pedido.estado) && <button onClick={() => confirm('¿Cancelar?') && actualizarEstado('cancelado')} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium flex items-center gap-2"><FiXCircle /> Cancelar</button>}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="card p-6">
          <h3 className="font-semibold text-dark-950 mb-4">Información</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center"><FiUser className="text-primary-600" /></div>
              <div><p className="text-dark-500 text-sm">Cliente</p><p className="font-medium text-dark-950">{pedido.nombre_cliente || 'Sin nombre'}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
                {tipoAtencionEmoji[pedido.tipo_atencion]}
              </div>
              <div><p className="text-dark-500 text-sm">Tipo</p><p className="font-medium text-dark-950 capitalize">{pedido.tipo_atencion}</p></div>
            </div>
            {pedido.direccion_delivery && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><FiMapPin className="text-green-600" /></div>
                <div><p className="text-dark-500 text-sm">Dirección</p><p className="font-medium text-dark-950">{pedido.direccion_delivery}</p></div>
              </div>
            )}
            {pedido.telefono_cliente && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><FiPhone className="text-purple-600" /></div>
                <div><p className="text-dark-500 text-sm">Teléfono</p><p className="font-medium text-dark-950">{pedido.telefono_cliente}</p></div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center"><FiCreditCard className="text-accent-600" /></div>
              <div><p className="text-dark-500 text-sm">Pago</p><p className="font-medium text-dark-950">{pedido.metodo_pago === 'efectivo' ? '💵 Efectivo' : '📱 Yape'}</p></div>
            </div>
            {pedido.monto_recibido && (
              <div className="bg-dark-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-dark-500">Recibido</span><span className="font-medium">{formatMoney(pedido.monto_recibido)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-dark-500">Vuelto</span><span className="font-medium text-green-600">{formatMoney(pedido.vuelto || 0)}</span></div>
              </div>
            )}
            {pedido.notas && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"><p className="text-yellow-800 text-sm font-medium">📝 {pedido.notas}</p></div>}
          </div>
        </div>
      </div>
    </div>
  )
}

