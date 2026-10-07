const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'polleria-las-delicias-secret-key-2024';

/**
 * Middleware para verificar autenticación
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token no proporcionado' 
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token inválido o expirado' 
    });
  }
}

module.exports = { authMiddleware };

