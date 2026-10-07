/**
 * Respuestas estandarizadas para todos los microservicios
 */

function success(res, data, message = 'Operación exitosa', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function error(res, message = 'Error interno del servidor', statusCode = 500, details = null) {
  const response = {
    success: false,
    error: message
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
}

function notFound(res, message = 'Recurso no encontrado') {
  return error(res, message, 404);
}

function badRequest(res, message = 'Datos inválidos') {
  return error(res, message, 400);
}

function unauthorized(res, message = 'No autorizado') {
  return error(res, message, 401);
}

module.exports = {
  success,
  error,
  notFound,
  badRequest,
  unauthorized
};

