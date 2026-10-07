# 🍗 Pollería Las Delicias - Sistema de Pedidos

Sistema de gestión de pedidos para trabajadores, desarrollado con **Arquitectura de Microservicios**.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                          │
│                              Puerto: 5173                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY (Express)                           │
│                             Puerto: 3000                                 │
└─────────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   AUTH SERVICE  │  │PRODUCTS SERVICE │  │ ORDERS SERVICE  │
│   Puerto: 3001  │  │   Puerto: 3002  │  │   Puerto: 3003  │
│                 │  │                 │  │                 │
│   📦 auth_db    │  │ 📦 products_db  │  │  📦 orders_db   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   NEON TECH     │  │   NEON TECH     │  │   NEON TECH     │
│   auth_db       │  │   products_db   │  │   orders_db     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🗄️ Bases de Datos (Separadas por Servicio)

| Servicio | Base de Datos | Script SQL | Tablas |
|----------|---------------|------------|--------|
| Auth Service | `auth_db` | `database/auth-service.sql` | `trabajadores` |
| Products Service | `products_db` | `database/products-service.sql` | `categorias`, `productos` |
| Orders Service | `orders_db` | `database/orders-service.sql` | `pedidos`, `detalle_pedidos`, `boletas` |

## 📦 Estructura del Proyecto

```
polleria-las-delicias/
├── database/
│   ├── auth-service.sql        # BD para Auth Service
│   ├── products-service.sql    # BD para Products Service
│   └── orders-service.sql      # BD para Orders Service
├── services/
│   ├── api-gateway/            # Punto de entrada (puerto 3000)
│   ├── auth-service/           # Autenticación (puerto 3001)
│   ├── products-service/       # Productos (puerto 3002)
│   ├── orders-service/         # Pedidos (puerto 3003)
│   └── shared/                 # Código compartido
├── frontend/                   # React + Vite (puerto 5173)
└── package.json
```

## 🚀 Instalación

### 1. Crear 3 Bases de Datos en Neon Tech

En [console.neon.tech](https://console.neon.tech), crea **3 bases de datos separadas**:

1. **auth_db** - Ejecuta `database/auth-service.sql`
2. **products_db** - Ejecuta `database/products-service.sql`  
3. **orders_db** - Ejecuta `database/orders-service.sql`

> En Neon Tech puedes crear múltiples bases de datos en un mismo proyecto.

### 2. Configurar Variables de Entorno

**services/auth-service/.env**
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@host.neon.tech/auth_db?sslmode=require
JWT_SECRET=polleria-las-delicias-secret-key-2024
```

**services/products-service/.env**
```env
PORT=3002
DATABASE_URL=postgresql://user:pass@host.neon.tech/products_db?sslmode=require
JWT_SECRET=polleria-las-delicias-secret-key-2024
```

**services/orders-service/.env**
```env
PORT=3003
DATABASE_URL=postgresql://user:pass@host.neon.tech/orders_db?sslmode=require
JWT_SECRET=polleria-las-delicias-secret-key-2024
```

**services/api-gateway/.env**
```env
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
PRODUCTS_SERVICE_URL=http://localhost:3002
ORDERS_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:5173
```

### 3. Instalar Dependencias

```bash
npm install
npm run install:all
```

### 4. Iniciar Servicios

```bash
# Todos a la vez
npm run dev

# O individualmente
npm run dev:gateway   # Terminal 1
npm run dev:auth      # Terminal 2
npm run dev:products  # Terminal 3
npm run dev:orders    # Terminal 4
npm run dev:frontend  # Terminal 5
```

### 5. Acceder

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000/health/all

## 🔐 Credenciales

```
Usuario: trabajador1
Contraseña: polleria123
```

## 🔄 Comunicación entre Servicios

Como cada servicio tiene su propia base de datos, la comunicación es así:

```
Frontend
    │
    ▼ (1) Obtiene productos de Products Service
┌─────────────┐
│  Products   │ → Devuelve: {id, nombre, precio}
│  Service    │
└─────────────┘
    │
    ▼ (2) Crea pedido en Orders Service
┌─────────────┐
│   Orders    │ ← Recibe: {producto_id, producto_nombre, precio}
│  Service    │   (datos denormalizados)
└─────────────┘
```

**Denormalización**: El frontend envía el `nombre` del producto junto con el pedido, ya que Orders Service no puede consultar Products DB.

## 📡 Endpoints

### Auth Service
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/me | Obtener perfil |

### Products Service
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/productos | Listar productos |
| GET | /api/categorias/con-productos | Categorías con productos |

### Orders Service
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/pedidos | Listar pedidos |
| POST | /api/pedidos | Crear pedido |
| PATCH | /api/pedidos/:id/estado | Cambiar estado |
| GET | /api/estadisticas/resumen | Estadísticas |

## 🛠️ Tecnologías

| Componente | Tecnología |
|------------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| API Gateway | Express.js + http-proxy-middleware |
| Microservicios | Node.js + Express.js |
| Bases de datos | PostgreSQL (Neon Tech) x3 |
| Autenticación | JWT |

---

Desarrollado para **Pollería Las Delicias** 🍗
