const { sql } = require('../config/db');

/**
 * Obtener todas las categorías activas
 */
async function getAll(req, res) {
  try {
    const result = await sql`
      SELECT * FROM categorias WHERE activo = true ORDER BY nombre
    `;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener categorías con sus productos
 */
async function getAllWithProducts(req, res) {
  try {
    const categorias = await sql`
      SELECT * FROM categorias WHERE activo = true ORDER BY nombre
    `;

    const productos = await sql`
      SELECT * FROM productos WHERE disponible = true ORDER BY nombre
    `;

    // Agrupar productos por categoría
    const categoriasConProductos = categorias.map(cat => ({
      ...cat,
      productos: productos.filter(p => p.categoria_id === cat.id)
    }));

    res.json({
      success: true,
      data: categoriasConProductos
    });

  } catch (error) {
    console.error('Error obteniendo categorías con productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener categoría por ID
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT * FROM categorias WHERE id = ${id}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Crear nueva categoría
 */
async function create(req, res) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: 'El nombre es requerido'
      });
    }

    const result = await sql`
      INSERT INTO categorias (nombre, descripcion)
      VALUES (${nombre}, ${descripcion || null})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: 'Categoría creada correctamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Actualizar categoría
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const result = await sql`
      UPDATE categorias 
      SET 
        nombre = COALESCE(${nombre}, nombre),
        descripcion = COALESCE(${descripcion}, descripcion),
        activo = COALESCE(${activo}, activo)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría actualizada correctamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Eliminar categoría (soft delete)
 */
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE categorias SET activo = false WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  getAll,
  getAllWithProducts,
  getById,
  create,
  update,
  delete: deleteCategory
};

