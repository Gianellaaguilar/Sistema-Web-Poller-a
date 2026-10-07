require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de servicios
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  products: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002',
  orders: process.env.ORDERS_SERVICE_URL || 'http://localhost:3003'
};

// Middlewares globales
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Health check del Gateway
app.get('/health', (req, res) => {
  res.json({ 
    service: 'api-gateway', 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: SERVICES
  });
});

// Función helper para hacer proxy manual
async function proxyRequest(serviceUrl, req, res) {
  try {
    const url = `${serviceUrl}${req.originalUrl}`;
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Pasar Authorization header si existe
    if (req.headers.authorization) {
      options.headers['Authorization'] = req.headers.authorization;
    }
    
    // Agregar body para POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(503).json({ 
      success: false, 
      error: 'Servicio no disponible' 
    });
  }
}

// Rutas Auth Service
app.all('/api/auth/*', (req, res) => {
  proxyRequest(SERVICES.auth, req, res);
});

// Rutas Products Service
app.all('/api/productos/*', (req, res) => {
  proxyRequest(SERVICES.products, req, res);
});

app.all('/api/productos', (req, res) => {
  proxyRequest(SERVICES.products, req, res);
});

app.all('/api/categorias/*', (req, res) => {
  proxyRequest(SERVICES.products, req, res);
});

app.all('/api/categorias', (req, res) => {
  proxyRequest(SERVICES.products, req, res);
});

// Rutas Orders Service
app.all('/api/pedidos/*', (req, res) => {
  proxyRequest(SERVICES.orders, req, res);
});

app.all('/api/pedidos', (req, res) => {
  proxyRequest(SERVICES.orders, req, res);
});

app.all('/api/estadisticas/*', (req, res) => {
  proxyRequest(SERVICES.orders, req, res);
});

app.all('/api/estadisticas', (req, res) => {
  proxyRequest(SERVICES.orders, req, res);
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Ruta no encontrada' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en puerto ${PORT}`);
  console.log('📡 Servicios configurados:');
  console.log(`   - Auth:     ${SERVICES.auth}`);
  console.log(`   - Products: ${SERVICES.products}`);
  console.log(`   - Orders:   ${SERVICES.orders}`);
});
