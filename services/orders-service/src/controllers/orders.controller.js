const { sql } = require('../config/db');

// Helper para reintentar operaciones de BD
async function withRetry(operation, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`⚠️ DB intento ${attempt}/${maxRetries}:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 500));
      }
    }
  }
  throw lastError;
}

/**
 * Obtener todos los pedidos (con filtros)
 */
async function getAll(req, res) {
  try {
    const { fecha, estado, limit = 100 } = req.query;
    
    let result;
    
    if (fecha && estado) {
      result = await sql`
        SELECT * FROM pedidos 
        WHERE DATE(created_at) = ${fecha} AND estado = ${estado}
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
      `;
    } else if (fecha) {
      result = await sql`
        SELECT * FROM pedidos 
        WHERE DATE(created_at) = ${fecha}
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
      `;
    } else if (estado) {
      result = await sql`
        SELECT * FROM pedidos 
        WHERE estado = ${estado}
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
      `;
    } else {
      result = await sql`
        SELECT * FROM pedidos 
        ORDER BY created_at DESC
        LIMIT ${parseInt(limit)}
      `;
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener pedido por ID con detalles
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const pedido = await sql`
      SELECT * FROM pedidos WHERE id = ${id}
    `;

    if (pedido.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    const detalles = await sql`
      SELECT * FROM detalle_pedidos WHERE pedido_id = ${id}
    `;

    res.json({
      success: true,
      data: {
        pedido: pedido[0],
        detalles
      }
    });

  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Crear nuevo pedido con boletas
 * Los items deben incluir producto_nombre (denormalizado desde frontend)
 */
async function create(req, res) {
  try {
    const {
      nombre_cliente,
      tipo_atencion,
      direccion_delivery,
      telefono_cliente,
      metodo_pago,
      monto_recibido,
      notas,
      items  // Cada item debe tener: producto_id, producto_nombre, cantidad, precio_unitario
    } = req.body;

    // Validaciones
    if (!tipo_atencion || !metodo_pago || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de atención, método de pago y productos son requeridos'
      });
    }

    if (!['salon', 'delivery', 'recojo'].includes(tipo_atencion)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de atención inválido'
      });
    }

    if (!['efectivo', 'yape'].includes(metodo_pago)) {
      return res.status(400).json({
        success: false,
        error: 'Método de pago inválido'
      });
    }

    // Validar que cada item tenga nombre del producto
    for (const item of items) {
      if (!item.producto_nombre) {
        return res.status(400).json({
          success: false,
          error: 'Cada item debe incluir el nombre del producto'
        });
      }
    }

    // Calcular totales
    const subtotal = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    const total = subtotal;
    const vuelto = monto_recibido ? monto_recibido - total : 0;

    // Generar número de pedido (con reintentos para cold start)
    const numeroPedido = await withRetry(() => sql`SELECT generar_numero_pedido() as numero`);
    const numero = numeroPedido[0].numero;

    // Crear pedido
    const pedidoResult = await sql`
      INSERT INTO pedidos (
        numero_pedido, trabajador_id, nombre_cliente, tipo_atencion, 
        direccion_delivery, telefono_cliente, metodo_pago, 
        subtotal, total, monto_recibido, vuelto, notas
      ) VALUES (
        ${numero}, ${req.user.id}, ${nombre_cliente || null}, ${tipo_atencion},
        ${direccion_delivery || null}, ${telefono_cliente || null}, ${metodo_pago},
        ${subtotal}, ${total}, ${monto_recibido || null}, ${vuelto > 0 ? vuelto : null}, ${notas || null}
      )
      RETURNING *
    `;

    const pedido = pedidoResult[0];

    // Insertar detalles (con nombre del producto denormalizado)
    for (const item of items) {
      await sql`
        INSERT INTO detalle_pedidos (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal, notas)
        VALUES (${pedido.id}, ${item.producto_id}, ${item.producto_nombre}, ${item.cantidad}, ${item.precio_unitario}, ${item.precio_unitario * item.cantidad}, ${item.notas || null})
      `;
    }

    // Obtener detalles insertados
    const detalles = await sql`
      SELECT * FROM detalle_pedidos WHERE pedido_id = ${pedido.id}
    `;

    // Crear boleta para cocina
    const numBoletaCocina = await sql`SELECT generar_numero_boleta('cocina') as numero`;
    const boletaCocina = await sql`
      INSERT INTO boletas (pedido_id, numero_boleta, tipo, contenido_json)
      VALUES (${pedido.id}, ${numBoletaCocina[0].numero}, 'cocina', ${JSON.stringify({
        numero_pedido: numero,
        tipo_atencion,
        nombre_cliente,
        items: detalles.map(d => ({
          producto: d.producto_nombre,
          cantidad: d.cantidad,
          notas: d.notas
        })),
        notas,
        fecha: new Date().toISOString()
      })})
      RETURNING *
    `;

    // Crear boleta para cliente
    const numBoletaCliente = await sql`SELECT generar_numero_boleta('cliente') as numero`;
    const boletaCliente = await sql`
      INSERT INTO boletas (pedido_id, numero_boleta, tipo, contenido_json)
      VALUES (${pedido.id}, ${numBoletaCliente[0].numero}, 'cliente', ${JSON.stringify({
        numero_pedido: numero,
        tipo_atencion,
        nombre_cliente,
        direccion: direccion_delivery,
        telefono: telefono_cliente,
        items: detalles.map(d => ({
          producto: d.producto_nombre,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal
        })),
        subtotal,
        total,
        metodo_pago,
        monto_recibido,
        vuelto: vuelto > 0 ? vuelto : 0,
        fecha: new Date().toISOString()
      })})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      data: {
        pedido,
        detalles,
        boletas: {
          cocina: boletaCocina[0],
          cliente: boletaCliente[0]
        }
      }
    });

  } catch (error) {
    console.error('Error creando pedido:', error);
    console.error('Detalle del error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
}

/**
 * Actualizar estado del pedido
 */
async function updateEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido'
      });
    }

    const result = await sql`
      UPDATE pedidos 
      SET estado = ${estado}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Cancelar pedido
 */
async function cancel(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE pedidos 
      SET estado = 'cancelado', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Pedido cancelado correctamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error cancelando pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener boletas de un pedido
 */
async function getBoletas(req, res) {
  try {
    const { id } = req.params;

    const boletas = await sql`
      SELECT * FROM boletas WHERE pedido_id = ${id}
    `;

    res.json({
      success: true,
      data: boletas
    });

  } catch (error) {
    console.error('Error obteniendo boletas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  updateEstado,
  cancel,
  getBoletas
};
