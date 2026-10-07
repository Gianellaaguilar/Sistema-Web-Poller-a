const { sql } = require('../config/db');

/**
 * Obtener todos los productos disponibles
 */
async function getAll(req, res) {
  try {
    const result = await sql`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      WHERE p.disponible = true 
      ORDER BY c.nombre, p.nombre
    `;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener productos por categoría
 */
async function getByCategoria(req, res) {
  try {
    const { categoriaId } = req.params;

    const result = await sql`
      SELECT * FROM productos 
      WHERE categoria_id = ${categoriaId} AND disponible = true 
      ORDER BY nombre
    `;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo productos por categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener producto por ID
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT p.*, c.nombre as categoria_nombre 
      FROM productos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      WHERE p.id = ${id}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Crear nuevo producto
 */
async function create(req, res) {
  try {
    const { categoria_id, nombre, descripcion, precio, disponible = true } = req.body;

    if (!nombre || !precio || !categoria_id) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, precio y categoría son requeridos'
      });
    }

    const result = await sql`
      INSERT INTO productos (categoria_id, nombre, descripcion, precio, disponible)
      VALUES (${categoria_id}, ${nombre}, ${descripcion || null}, ${precio}, ${disponible})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Actualizar producto
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { categoria_id, nombre, descripcion, precio, disponible } = req.body;

    const result = await sql`
      UPDATE productos 
      SET 
        categoria_id = COALESCE(${categoria_id}, categoria_id),
        nombre = COALESCE(${nombre}, nombre),
        descripcion = COALESCE(${descripcion}, descripcion),
        precio = COALESCE(${precio}, precio),
        disponible = COALESCE(${disponible}, disponible),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Eliminar producto (soft delete)
 */
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE productos 
      SET disponible = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  getAll,
  getByCategoria,
  getById,
  create,
  update,
  delete: deleteProduct
};

