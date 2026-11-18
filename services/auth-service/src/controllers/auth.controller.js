const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

/**
 * Login de trabajador
 */
async function login(req, res) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar trabajador
    const result = await sql`
      SELECT * FROM trabajadores WHERE usuario = ${usuario} AND activo = true
    `;

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    const trabajador = result[0];

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, trabajador.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    // Generar token
    const token = jwt.sign(
      {
        id: trabajador.id,
        usuario: trabajador.usuario,
        nombre: trabajador.nombre
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        trabajador: {
          id: trabajador.id,
          nombre: trabajador.nombre,
          usuario: trabajador.usuario
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener perfil del trabajador autenticado
 */
async function getProfile(req, res) {
  try {
    const result = await sql`
      SELECT id, nombre, usuario, activo, created_at 
      FROM trabajadores 
      WHERE id = ${req.user.id}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trabajador no encontrado'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Verificar token válido
 */
async function verifyToken(req, res) {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user
    }
  });
}

/**
 * Logout (invalidar en cliente)
 */
async function logout(req, res) {
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
}

/**
 * Obtener lista de trabajadores
 */
async function getTrabajadores(req, res) {
  try {
    const result = await sql`
      SELECT id, nombre, usuario, activo, created_at 
      FROM trabajadores 
      WHERE activo = true
      ORDER BY nombre
    `;

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo trabajadores:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener trabajador por ID
 */
async function getTrabajadorById(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT id, nombre, usuario, activo, created_at 
      FROM trabajadores 
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trabajador no encontrado'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error obteniendo trabajador:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  login,
  getProfile,
  verifyToken,
  logout,
  getTrabajadores,
  getTrabajadorById
};

