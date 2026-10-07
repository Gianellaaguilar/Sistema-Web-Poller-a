const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Rutas públicas (para mostrar menú)
router.get('/', productsController.getAll);
router.get('/categoria/:categoriaId', productsController.getByCategoria);
router.get('/:id', productsController.getById);

// Rutas protegidas (gestión - para el admin en el futuro)
router.post('/', authMiddleware, productsController.create);
router.put('/:id', authMiddleware, productsController.update);
router.delete('/:id', authMiddleware, productsController.delete);

module.exports = router;

