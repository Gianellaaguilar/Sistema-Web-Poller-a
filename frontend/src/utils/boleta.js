// Utilidades compartidas para generación e impresión de boletas

const formatSoles = (monto) => `S/ ${Number.parseFloat(monto).toFixed(2)}`

export const parsearContenidoBoleta = (contenidoJson) => {
  if (typeof contenidoJson !== 'string') return contenidoJson
  try {
    return JSON.parse(contenidoJson)
  } catch (e) {
    console.error('Error parseando contenido_json:', e)
    return null
  }
}

const itemBoletaHtml = ({ cantidad, nombre, subtotal }) => `
  <div class="item">
    <span>${cantidad}x ${nombre}</span>
    ${subtotal ? `<span>${formatSoles(subtotal)}</span>` : ''}
  </div>
`

const detallePagoHtml = ({ monto_recibido, vuelto, metodo_pago }) => {
  if (monto_recibido) {
    return `
      <p style="margin: 3px 0;"><strong>Monto Recibido:</strong> ${formatSoles(monto_recibido)}</p>
      <p style="margin: 3px 0; font-size: 14px; font-weight: bold;"><strong>VUELTO:</strong> ${formatSoles(vuelto || 0)}</p>
    `
  }
  const texto = metodo_pago === 'yape' ? 'Pago digital - Sin vuelto' : 'Monto exacto'
  return `<p style="margin: 3px 0;"><em>${texto}</em></p>`
}

export const imprimirHtml = (html) => {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const printWindow = window.open(url, '_blank')
  if (!printWindow) {
    URL.revokeObjectURL(url)
    return
  }
  printWindow.onload = () => {
    printWindow.print()
    URL.revokeObjectURL(url)
  }
}

const seccionPagoHtml = (pago) => `
  <div class="total"><span>TOTAL:</span><span>${formatSoles(pago.total)}</span></div>
  <div style="border: 1px solid #000; padding: 8px; margin: 10px 0;">
    <p style="margin: 3px 0;"><strong>Método de Pago:</strong> ${pago.metodo_pago === 'efectivo' ? '💵 Efectivo' : '📱 Yape'}</p>
    ${detallePagoHtml(pago)}
  </div>
`

export const generarHtmlBoleta = ({ esCocina, documento, numeroPedido, tipoAtencion, nombreCliente, fecha, items, pago }) => {
  const titulo = esCocina ? 'Cocina' : 'Cliente'
  const badge = esCocina ? '🍳 BOLETA COCINA' : '🧾 BOLETA CLIENTE'
  const badgeColor = esCocina ? '#fef3c7' : '#dbeafe'
  const itemWeight = esCocina ? 'bold' : 'normal'
  const pedidoHtml = numeroPedido ? `<p><strong>Pedido:</strong> ${numeroPedido}</p>` : ''
  const clienteHtml = nombreCliente ? `<p><strong>Cliente:</strong> ${nombreCliente}</p>` : ''
  const itemsHtml = items.map(itemBoletaHtml).join('')
  const pagoHtml = esCocina ? '' : seccionPagoHtml(pago)

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
        margin-bottom: 10px;
      }
      .header h1 { margin: 0; font-size: 18px; }
      .header p { font-size: 14px; margin: 5px 0 0 0; }
      .info { margin: 10px 0; }
      .info p { margin: 5px 0; font-size: 12px; }
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
        margin: 10px 0;
      }
      .total {
        font-size: 16px;
        font-weight: bold;
        border-top: 2px solid #000;
        padding-top: 10px;
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .footer { text-align: center; margin-top: 20px; font-size: 10px; }
      .tipo-badge {
        background: ${badgeColor};
        padding: 8px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 10px;
      }
      @media print { body { margin: 0; } }
    </style>
    </head><body>
      <div class="tipo-badge">${badge}</div>
      <div class="header">
        <h1>🍗 POLLERÍA LAS DELICIAS</h1>
        <p><strong>${documento}</strong></p>
      </div>
      <div class="info">
        ${pedidoHtml}
        <p><strong>Tipo:</strong> ${tipoAtencion.toUpperCase()}</p>
        ${clienteHtml}
        <p><strong>Fecha:</strong> ${new Date(fecha).toLocaleString('es-PE')}</p>
      </div>
      <div class="items-container">
        ${itemsHtml}
      </div>
      ${pagoHtml}
      <div class="footer"><p>¡Gracias por su preferencia!</p></div>
    </body></html>
  `
}
