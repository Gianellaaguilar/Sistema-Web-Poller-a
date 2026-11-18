require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ordersRoutes = require('./routes/orders.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'orders-service', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/pedidos', ordersRoutes);
app.use('/api/estadisticas', statsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🍗 Orders Service corriendo en puerto ${PORT}`);
});

