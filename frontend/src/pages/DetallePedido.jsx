import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiPrinter, FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle, FiUser, FiMapPin, FiPhone, FiCreditCard } from 'react-icons/fi'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const estadoConfig = {
  pendiente: { icon: FiClock, label: 'Pendiente' },
  preparando: { icon: FiPackage, label: 'Preparando' },
  listo: { icon: FiCheckCircle, label: 'Listo' },
  entregado: { icon: FiTruck, label: 'Entregado' },
  cancelado: { icon: FiXCircle, label: 'Cancelado' }
}

const tipoAtencionEmoji = { salon: '🪑', delivery: '🛵', recojo: '📦' }

// ---- Helpers para impresión de boletas ----

const itemBoletaHtml = (detalle, esCliente) => `
  <div class="item">
    <span>${detalle.cantidad}x ${detalle.producto_nombre}</span>
    ${esCliente ? `<span>S/ ${Number.parseFloat(detalle.subtotal).toFixed(2)}</span>` : ''}
  </div>
`

const detallePagoHtml = (pedido) => {
  if (pedido.monto_recibido) {
    return `
      <p style="margin: 3px 0;"><strong>Recibido:</strong> S/ ${Number.parseFloat(pedido.monto_recibido).toFixed(2)}</p>
      <p style="margin: 3px 0; font-weight: bold;"><strong>VUELTO:</strong> S/ ${Number.parseFloat(pedido.vuelto || 0).toFixed(2)}</p>
    `
  }
  const texto = pedido.metodo_pago === 'yape' ? 'Pago digital' : 'Monto exacto'
  return `<p style="margin: 3px 0;"><em>${texto}</em></p>`
}

const seccionPagoHtml = (pedido) => `
  <div class="total"><span>TOTAL:</span><span>S/ ${Number.parseFloat(pedido.total).toFixed(2)}</span></div>
  <div style="border: 1px solid #000; padding: 8px; margin: 10px 0;">
    <p style="margin: 3px 0;"><strong>Pago:</strong> ${pedido.metodo_pago === 'efectivo' ? '💵 Efectivo' : '📱 Yape'}</p>
    ${detallePagoHtml(pedido)}
  </div>
`

const generarHtmlBoleta = (pedido, detalles, esCocina) => {
  const titulo = esCocina ? 'Cocina' : 'Cliente'
  const badge = esCocina ? '🍳 BOLETA COCINA' : '🧾 BOLETA CLIENTE'
  const badgeColor = esCocina ? '#fef3c7' : '#dbeafe'
  const itemWeight = esCocina ? 'bold' : 'normal'
  const clienteHtml = pedido.nombre_cliente
    ? `<p><strong>Cliente:</strong> ${pedido.nombre_cliente}</p>`
    : ''
  const itemsHtml = detalles.map(d => itemBoletaHtml(d, !esCocina)).join('')
  const pagoHtml = esCocina ? '' : seccionPagoHtml(pedido)

  return `
    <!DOCTYPE html>
    <html><head><title>Boleta ${titulo}</title>
    <style>
      body {
        font-family: 'Courier New', monospace;
        width: 80mm;
        padding: 10px;
        margin: 0 auto;
        font-size: 12px;
      }
      .header {
        text-align: center;
        border-bottom: 2px dashed #000;
        padding-bottom: 10px;
      }
      .header h2 {
        margin: 0;
        font-size: 18px;
      }
      .header p {
        font-size: 14px;
        margin: 5px 0 0 0;
      }
      .info {
        margin: 10px 0;
      }
      .info p {
        margin: 5px 0;
        font-size: 12px;
      }
      .item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        font-size: 12px;
        font-weight: ${itemWeight};
      }
      .items-container {
        border-top: 2px dashed #000;
        border-bottom: 2px dashed #000;
        padding: 10px 0;
      }
      .total {
        font-size: 16px;
        font-weight: bold;
        border-top: 2px solid #000;
        padding-top: 10px;
        display: flex;
        justify-content: space-between;
      }
      .tipo-badge {
        background: ${badgeColor};
        padding: 8px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 10px;
      }
      @media print {
        body { margin: 0; }
      }
    </style>
    </head><body>
      <div class="tipo-badge">${badge}</div>
      <div class="header">
        <h2>🍗 POLLERÍA LAS DELICIAS</h2>
        <p>${pedido.numero_pedido}</p>
      </div>
      <div class="info">
        <p><strong>Tipo:</strong> ${pedido.tipo_atencion.toUpperCase()}</p>
        ${clienteHtml}
        <p><strong>Fecha:</strong> ${new Date(pedido.created_at).toLocaleString('es-PE')}</p>
      </div>
      <div class="items-container">
        ${itemsHtml}
      </div>
      ${pagoHtml}
      <p style="text-align: center; margin-top: 20px; font-size: 10px;">¡Gracias por su preferencia!</p>
    </body></html>
  `
}

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

    printWindow.document.write(generarHtmlBoleta(pedido, detalles, tipo === 'cocina'))
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

