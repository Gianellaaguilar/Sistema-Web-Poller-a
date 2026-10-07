const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Rutas públicas
router.get('/', categoriesController.getAll);
router.get('/con-productos', categoriesController.getAllWithProducts);
router.get('/:id', categoriesController.getById);

// Rutas protegidas
router.post('/', authMiddleware, categoriesController.create);
router.put('/:id', authMiddleware, categoriesController.update);
router.delete('/:id', authMiddleware, categoriesController.delete);

module.exports = router;

