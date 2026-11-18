const { sql } = require('../config/db');

/**
 * Obtener resumen de estadísticas por período
 */
async function getResumen(req, res) {
  try {
    const { periodo = 'dia' } = req.query;
    
    let fechaInicio;
    const hoy = new Date();
    
    switch (periodo) {
      case 'dia':
        fechaInicio = hoy.toISOString().split('T')[0];
        break;
      case 'semana': {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        fechaInicio = inicioSemana.toISOString().split('T')[0];
        break;
      }
      case 'mes':
        fechaInicio = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      default:
        fechaInicio = hoy.toISOString().split('T')[0];
    }

    const result = await sql`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as total_ventas,
        COALESCE(SUM(CASE WHEN tipo_atencion = 'salon' THEN 1 ELSE 0 END), 0) as pedidos_salon,
        COALESCE(SUM(CASE WHEN tipo_atencion = 'delivery' THEN 1 ELSE 0 END), 0) as pedidos_delivery,
        COALESCE(SUM(CASE WHEN tipo_atencion = 'recojo' THEN 1 ELSE 0 END), 0) as pedidos_recojo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as ventas_efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'yape' THEN total ELSE 0 END), 0) as ventas_yape
      FROM pedidos
      WHERE DATE(created_at) >= ${fechaInicio}
      AND estado NOT IN ('cancelado')
    `;

    res.json({
      success: true,
      data: {
        periodo,
        fecha_inicio: fechaInicio,
        ...result[0]
      }
    });

  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener ventas por fecha
 */
async function getVentas(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const hoy = new Date().toISOString().split('T')[0];
    const inicio = fecha_inicio || hoy;
    const fin = fecha_fin || hoy;

    const result = await sql`
      SELECT 
        DATE(created_at) as fecha,
        COUNT(*) as total_pedidos,
        SUM(total) as total_ventas,
        SUM(CASE WHEN tipo_atencion = 'salon' THEN 1 ELSE 0 END) as pedidos_salon,
        SUM(CASE WHEN tipo_atencion = 'delivery' THEN 1 ELSE 0 END) as pedidos_delivery,
        SUM(CASE WHEN tipo_atencion = 'recojo' THEN 1 ELSE 0 END) as pedidos_recojo
      FROM pedidos
      WHERE DATE(created_at) BETWEEN ${inicio} AND ${fin}
      AND estado NOT IN ('cancelado')
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
    `;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  getResumen,
  getVentas
};

