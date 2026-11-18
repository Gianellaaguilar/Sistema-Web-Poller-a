require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productsRoutes = require('./routes/products.routes');
const categoriesRoutes = require('./routes/categories.routes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'products-service', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/productos', productsRoutes);
app.use('/api/categorias', categoriesRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`📦 Products Service corriendo en puerto ${PORT}`);
});

