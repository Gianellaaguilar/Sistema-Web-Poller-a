const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD de pedidos
router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);
router.post('/', ordersController.create);
router.patch('/:id/estado', ordersController.updateEstado);
router.delete('/:id', ordersController.cancel);

// Boletas
router.get('/:id/boletas', ordersController.getBoletas);

module.exports = router;

