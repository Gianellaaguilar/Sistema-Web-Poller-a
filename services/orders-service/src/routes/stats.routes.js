const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Estadísticas
router.get('/resumen', statsController.getResumen);
router.get('/ventas', statsController.getVentas);

module.exports = router;

