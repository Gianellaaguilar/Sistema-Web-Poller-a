const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authMiddleware, authController.getProfile);
router.get('/verify', authMiddleware, authController.verifyToken);
router.post('/logout', authMiddleware, authController.logout);

// Rutas para gestión de trabajadores (interno)
router.get('/trabajadores', authMiddleware, authController.getTrabajadores);
router.get('/trabajadores/:id', authMiddleware, authController.getTrabajadorById);

module.exports = router;

