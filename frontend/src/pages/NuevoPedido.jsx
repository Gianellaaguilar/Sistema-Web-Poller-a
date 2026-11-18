import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiMapPin, FiPhone, FiCreditCard, FiPlus, FiMinus, FiTrash2, FiShoppingCart, FiCheck, FiPrinter, FiAlertCircle, FiChevronRight } from 'react-icons/fi'
import { GiChickenOven } from 'react-icons/gi'
import { api } from '../services/api'
import { parsearContenidoBoleta, generarHtmlBoleta, imprimirHtml } from '../utils/boleta'
import toast from 'react-hot-toast'

const tipoAtencionEmoji = { salon: '🪑', delivery: '🛵', recojo: '📦' }

export default function NuevoPedido() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [carrito, setCarrito] = useState([])
  
  // Paso actual: 1 = datos cliente, 2 = productos
  const [paso, setPaso] = useState(1)
  
  const [nombreCliente, setNombreCliente] = useState('')
  const [tipoAtencion, setTipoAtencion] = useState('salon')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [notas, setNotas] = useState('')
  
  const [pedidoCreado, setPedidoCreado] = useState(null)
  const [mostrarBoletas, setMostrarBoletas] = useState(false)

  useEffect(() => {
    void cargarProductos()
  }, [])

  const cargarProductos = async () => {
    try {
      const response = await api.get('/categorias/con-productos')
      if (response.success) {
        setCategorias(response.data)
        if (response.data.length > 0) {
          setCategoriaActiva(response.data[0].id)
        }
      }
    } catch (error) {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  // Validar si los datos del cliente están completos
  const datosClienteCompletos = () => {
    // Nombre siempre obligatorio
    if (!nombreCliente.trim()) return false
    // Teléfono siempre obligatorio
    if (!telefono.trim()) return false
    // Para delivery, dirección también es obligatoria
    if (tipoAtencion === 'delivery' && !direccion.trim()) return false
    return true
  }

  const continuarAProductos = () => {
    if (!nombreCliente.trim()) return toast.error('Ingresa el nombre del cliente')
    if (!telefono.trim()) return toast.error('Ingresa el teléfono del cliente')
    if (tipoAtencion === 'delivery' && !direccion.trim()) return toast.error('Ingresa la dirección de delivery')
    setPaso(2)
  }

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === producto.id)
      if (existe) {
        return prev.map(item => 
          item.producto.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
    toast.success(`${producto.nombre} agregado`, { duration: 1500 })
  }

  const actualizarCantidad = (productoId, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.producto.id === productoId) {
        const nuevaCantidad = item.cantidad + delta
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item
      }
      return item
    }).filter(item => item.cantidad > 0))
  }

  const eliminarDelCarrito = (productoId) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== productoId))
  }

  const calcularTotal = () => carrito.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0)
  
  const calcularVuelto = () => {
    const monto = Number.parseFloat(montoRecibido) || 0
    return monto > calcularTotal() ? monto - calcularTotal() : 0
  }

  const formatMoney = (amount) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)

  const crearPedido = async () => {
    if (carrito.length === 0) return toast.error('Agrega productos al pedido')
    if (!nombreCliente.trim()) return toast.error('Ingresa el nombre del cliente')
    if (!telefono.trim()) return toast.error('Ingresa el teléfono del cliente')
    if (tipoAtencion === 'delivery' && !direccion.trim()) return toast.error('Ingresa la dirección de delivery')
    
    // Solo validar monto si se ingresó algo
    if (metodoPago === 'efectivo' && montoRecibido && Number.parseFloat(montoRecibido) < calcularTotal()) {
      return toast.error('El monto recibido es insuficiente')
    }

    setSubmitting(true)
    try {
      const response = await api.post('/pedidos', {
        nombre_cliente: nombreCliente || null,
        tipo_atencion: tipoAtencion,
        direccion_delivery: tipoAtencion === 'delivery' ? direccion : null,
        telefono_cliente: telefono || null,
        metodo_pago: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? Number.parseFloat(montoRecibido) || null : null,
        notas: notas || null,
        items: carrito.map(item => ({
          producto_id: item.producto.id,
          producto_nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio_unitario: Number.parseFloat(item.producto.precio)
        }))
      })

      if (response.success) {
        toast.success('¡Pedido creado!')
        setPedidoCreado(response.data)
        setMostrarBoletas(true)
      } else {
        toast.error(response.error || 'Error al crear pedido')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const imprimirBoleta = (tipo) => {
    if (!pedidoCreado) return
    const boleta = tipo === 'cocina' ? pedidoCreado.boletas.cocina : pedidoCreado.boletas.cliente

    const contenido = parsearContenidoBoleta(boleta.contenido_json)
    if (!contenido) return

    imprimirHtml(generarHtmlBoleta({
      esCocina: tipo === 'cocina',
      documento: boleta.numero_boleta,
      numeroPedido: contenido.numero_pedido,
      tipoAtencion: contenido.tipo_atencion,
      nombreCliente: contenido.nombre_cliente,
      fecha: contenido.fecha,
      items: contenido.items.map(i => ({ cantidad: i.cantidad, nombre: i.producto, subtotal: i.subtotal })),
      pago: contenido
    }))
  }

  const nuevoPedido = () => {
    setCarrito([])
    setNombreCliente('')
    setTipoAtencion('salon')
    setDireccion('')
    setTelefono('')
    setMetodoPago('efectivo')
    setMontoRecibido('')
    setNotas('')
    setPedidoCreado(null)
    setMostrarBoletas(false)
    setPaso(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-950">Nuevo Pedido</h1>
        <p className="text-dark-500 mt-1">Registra un nuevo pedido para el cliente</p>
      </div>

      {/* Indicador de pasos */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${paso === 1 ? 'bg-primary-500 text-white' : 'bg-green-100 text-green-700'}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">1</span>
            <span>Datos del Cliente</span>
            {paso > 1 && <FiCheck />}
          </div>
          <FiChevronRight className="text-dark-300" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${paso === 2 ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-400'}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">2</span>
            <span>Seleccionar Productos</span>
          </div>
        </div>
      </div>

      {/* PASO 1: Datos del Cliente */}
      {paso === 1 && (
        <div className="max-w-2xl animate-fade-in">
          <div className="card p-6">
            <h3 className="font-semibold text-dark-950 text-lg mb-6 flex items-center gap-2">
              <FiUser className="text-primary-500" />
              <span>Información del Pedido</span>
            </h3>
            
            <div className="space-y-5">
              {/* Tipo de atención */}
              <div>
                <p className="block text-dark-700 font-medium mb-3">Tipo de Atención *</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'salon', emoji: '🪑', label: 'Salón' },
                    { id: 'delivery', emoji: '🛵', label: 'Delivery' },
                    { id: 'recojo', emoji: '📦', label: 'Recojo' }
                  ].map((tipo) => (
                    <button
                      key={tipo.id}
                      onClick={() => setTipoAtencion(tipo.id)}
                      className={`py-4 px-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${
                        tipoAtencion === tipo.id 
                          ? 'bg-primary-500 text-white shadow-lg scale-105' 
                          : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                      }`}
                    >
                      <span className="text-2xl">{tipo.emoji}</span>
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre del cliente - OBLIGATORIO */}
              <div>
                <label htmlFor="nombreCliente" className="block text-dark-700 font-medium mb-2">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    id="nombreCliente"
                    type="text"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    placeholder="Ingresa el nombre del cliente"
                    className={`input-field pl-12 py-3 ${!nombreCliente.trim() ? 'border-red-200 focus:border-red-400' : 'border-green-200'}`}
                  />
                </div>
                {!nombreCliente.trim() && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FiAlertCircle className="text-xs" /> Campo obligatorio
                  </p>
                )}
              </div>

              {/* Teléfono - OBLIGATORIO para todos */}
              <div>
                <label htmlFor="telefono" className="block text-dark-700 font-medium mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Número de contacto del cliente"
                    className={`input-field pl-12 py-3 ${!telefono.trim() ? 'border-red-200 focus:border-red-400' : 'border-green-200'}`}
                  />
                </div>
                {!telefono.trim() && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <FiAlertCircle className="text-xs" /> Campo obligatorio
                  </p>
                )}
              </div>

              {/* Dirección - SOLO para delivery */}
              {tipoAtencion === 'delivery' && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <label htmlFor="direccion" className="block text-dark-700 font-medium mb-2">
                    Dirección de Entrega <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      id="direccion"
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Dirección completa para delivery"
                      className={`input-field pl-12 py-3 ${!direccion.trim() ? 'border-red-200 focus:border-red-400' : 'border-green-200'}`}
                    />
                  </div>
                  {!direccion.trim() && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <FiAlertCircle className="text-xs" /> Campo obligatorio para delivery
                    </p>
                  )}
                </div>
              )}

              {/* Método de pago */}
              <div>
                <p className="block text-dark-700 font-medium mb-3">Método de Pago *</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMetodoPago('efectivo')}
                    className={`py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      metodoPago === 'efectivo' 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    <span className="text-xl">💵</span> Efectivo
                  </button>
                  <button
                    onClick={() => setMetodoPago('yape')}
                    className={`py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      metodoPago === 'yape' 
                        ? 'bg-purple-500 text-white shadow-lg' 
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    <span className="text-xl">📱</span> Yape
                  </button>
                </div>
              </div>

              {/* Notas - OPCIONAL */}
              <div>
                <label htmlFor="notas" className="block text-dark-700 font-medium mb-2">
                  Notas <span className="text-dark-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Instrucciones especiales, alergias, etc."
                  rows={3}
                  className="input-field py-3 resize-none"
                />
              </div>

              {/* Resumen de validación */}
              {!datosClienteCompletos() && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                    <FiAlertCircle /> Completa todos los campos obligatorios para continuar
                  </p>
                </div>
              )}

              {/* Botón continuar */}
              <button
                onClick={continuarAProductos}
                disabled={!datosClienteCompletos()}
                className={`w-full py-4 flex items-center justify-center gap-2 text-lg rounded-xl font-semibold transition-all ${
                  datosClienteCompletos()
                    ? 'btn-primary'
                    : 'bg-dark-200 text-dark-400 cursor-not-allowed'
                }`}
              >
                <span>Continuar a Productos</span>
                <FiChevronRight className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: Productos */}
      {paso === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* Resumen del cliente */}
            <div className="card p-4 bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {tipoAtencionEmoji[tipoAtencion]}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-950">
                      {nombreCliente || 'Cliente'} - {tipoAtencion.charAt(0).toUpperCase() + tipoAtencion.slice(1)}
                    </p>
                    <p className="text-sm text-dark-600">
                      {metodoPago === 'efectivo' ? '💵 Efectivo' : '📱 Yape'}
                      {tipoAtencion === 'delivery' && direccion && ` • 📍 ${direccion}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPaso(1)}
                  className="px-4 py-2 bg-white rounded-xl text-primary-600 font-medium hover:bg-primary-50"
                >
                  Editar
                </button>
              </div>
            </div>

            {/* Categorías */}
            <div className="card p-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaActiva(cat.id)}
                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                      categoriaActiva === cat.id
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Productos */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categorias.find(c => c.id === categoriaActiva)?.productos.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => agregarAlCarrito(producto)}
                  className="card-hover p-4 text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <GiChickenOven className="text-2xl text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-dark-950 text-sm mb-1 line-clamp-2">{producto.nombre}</h3>
                  <p className="text-primary-600 font-bold">{formatMoney(producto.precio)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Carrito */}
          <div className="space-y-6">
            <div className="card sticky top-4">
              <div className="p-4 border-b border-dark-100 flex items-center justify-between">
                <h3 className="font-semibold text-dark-950 flex items-center gap-2">
                  <FiShoppingCart className="text-primary-500" /> Pedido
                </h3>
                <span className="bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-1 rounded-full">
                  {carrito.reduce((acc, item) => acc + item.cantidad, 0)} items
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {carrito.length === 0 ? (
                  <div className="p-8 text-center text-dark-400">
                    <FiShoppingCart className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>Agrega productos</p>
                  </div>
                ) : (
                  <div className="divide-y divide-dark-100">
                    {carrito.map((item) => (
                      <div key={item.producto.id} className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark-950 text-sm truncate">{item.producto.nombre}</p>
                          <p className="text-primary-600 text-sm">{formatMoney(item.producto.precio * item.cantidad)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => actualizarCantidad(item.producto.id, -1)} className="w-7 h-7 bg-dark-100 rounded-lg flex items-center justify-center"><FiMinus className="text-sm" /></button>
                          <span className="w-6 text-center font-semibold text-sm">{item.cantidad}</span>
                          <button onClick={() => actualizarCantidad(item.producto.id, 1)} className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600"><FiPlus className="text-sm" /></button>
                          <button onClick={() => eliminarDelCarrito(item.producto.id)} className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-red-600 ml-1"><FiTrash2 className="text-sm" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monto recibido (solo para efectivo) */}
              {metodoPago === 'efectivo' && carrito.length > 0 && (
                <div className="p-4 border-t border-dark-100 bg-green-50">
                  <label htmlFor="montoRecibido" className="block text-dark-700 text-sm font-medium mb-2">
                    Monto Recibido <span className="text-dark-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      id="montoRecibido"
                      type="number"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      placeholder="Para calcular vuelto"
                      className="input-field pl-10 py-2 text-sm"
                    />
                  </div>
                  {calcularVuelto() > 0 && (
                    <p className="text-green-600 text-sm mt-2 font-medium">
                      💰 Vuelto: {formatMoney(calcularVuelto())}
                    </p>
                  )}
                  {montoRecibido && Number.parseFloat(montoRecibido) < calcularTotal() && (
                    <p className="text-orange-600 text-sm mt-2 flex items-center gap-1">
                      <FiAlertCircle /> El monto no cubre el total
                    </p>
                  )}
                </div>
              )}

              <div className="p-4 border-t border-dark-100 space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-dark-600 font-medium">Total a Pagar</span>
                  <span className="text-2xl font-bold text-primary-600">{formatMoney(calcularTotal())}</span>
                </div>
                
                {/* Resumen de pago para efectivo */}
                {metodoPago === 'efectivo' && montoRecibido && Number.parseFloat(montoRecibido) >= calcularTotal() && (
                  <div className="bg-green-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-600">Cliente paga con:</span>
                      <span className="font-semibold text-dark-950">{formatMoney(Number.parseFloat(montoRecibido))}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-600">Vuelto a entregar:</span>
                      <span className="font-bold text-green-600 text-lg">{formatMoney(calcularVuelto())}</span>
                    </div>
                  </div>
                )}
                
                {/* Indicador Yape */}
                {metodoPago === 'yape' && (
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <span className="text-purple-700 font-medium">📱 Pago con Yape - Sin vuelto</span>
                  </div>
                )}
                
                <button
                  onClick={crearPedido}
                  disabled={carrito.length === 0 || submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCheck className="text-xl" /> Confirmar Pedido
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal boletas */}
      {mostrarBoletas && pedidoCreado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-dark-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-dark-950">¡Pedido Creado!</h3>
                <p className="text-dark-500 text-sm">{pedidoCreado.pedido.numero_pedido}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="text-2xl text-green-600" />
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-dark-600 text-sm text-center">Imprime las boletas para continuar</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => imprimirBoleta('cocina')} className="flex flex-col items-center gap-2 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl border-2 border-yellow-200">
                  <FiPrinter className="text-2xl text-yellow-600" />
                  <span className="font-medium text-yellow-700">Boleta Cocina</span>
                </button>
                <button onClick={() => imprimirBoleta('cliente')} className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200">
                  <FiPrinter className="text-2xl text-blue-600" />
                  <span className="font-medium text-blue-700">Boleta Cliente</span>
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-dark-100 flex gap-3">
              <button onClick={() => navigate(`/pedidos/${pedidoCreado.pedido.id}`)} className="flex-1 py-3 px-4 bg-dark-100 text-dark-700 rounded-xl font-medium hover:bg-dark-200">Ver Pedido</button>
              <button onClick={nuevoPedido} className="flex-1 btn-primary">Nuevo Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
