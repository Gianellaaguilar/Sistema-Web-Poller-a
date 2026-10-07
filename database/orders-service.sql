-- =====================================================
-- ORDERS SERVICE - Base de Datos
-- Neon Tech: Crear base de datos "orders_db"
-- =====================================================

-- Tabla de Pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    trabajador_id INTEGER NOT NULL,           -- ID del trabajador (referencia externa)
    nombre_cliente VARCHAR(100),
    tipo_atencion VARCHAR(20) NOT NULL CHECK (tipo_atencion IN ('salon', 'delivery', 'recojo')),
    direccion_delivery TEXT,
    telefono_cliente VARCHAR(20),
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo', 'yape')),
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    monto_recibido DECIMAL(10,2),
    vuelto DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado')),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Detalle de Pedidos
CREATE TABLE detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL,              -- ID del producto (referencia externa)
    producto_nombre VARCHAR(100) NOT NULL,     -- Nombre del producto (denormalizado)
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Boletas
CREATE TABLE boletas (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    numero_boleta VARCHAR(20) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'cocina')),
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contenido_json JSONB
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_pedidos_fecha ON pedidos(created_at);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_tipo_atencion ON pedidos(tipo_atencion);
CREATE INDEX idx_pedidos_trabajador ON pedidos(trabajador_id);
CREATE INDEX idx_detalle_pedido ON detalle_pedidos(pedido_id);
CREATE INDEX idx_boletas_pedido ON boletas(pedido_id);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Generar número de pedido automático
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
    nuevo_numero TEXT;
    fecha_actual TEXT;
    secuencia INTEGER;
BEGIN
    fecha_actual := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 10) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM pedidos
    WHERE numero_pedido LIKE 'PED' || fecha_actual || '%';
    
    nuevo_numero := 'PED' || fecha_actual || LPAD(secuencia::TEXT, 4, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Generar número de boleta automático
CREATE OR REPLACE FUNCTION generar_numero_boleta(tipo_boleta VARCHAR)
RETURNS TEXT AS $$
DECLARE
    nuevo_numero TEXT;
    prefijo TEXT;
    fecha_actual TEXT;
    secuencia INTEGER;
BEGIN
    prefijo := CASE WHEN tipo_boleta = 'cocina' THEN 'COC' ELSE 'BOL' END;
    fecha_actual := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_boleta FROM 12) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM boletas
    WHERE numero_boleta LIKE prefijo || fecha_actual || '%';
    
    nuevo_numero := prefijo || fecha_actual || LPAD(secuencia::TEXT, 4, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS PARA REPORTES
-- =====================================================

CREATE OR REPLACE VIEW vista_ventas_diarias AS
SELECT 
    DATE(created_at) as fecha,
    COUNT(*) as total_pedidos,
    SUM(total) as total_ventas,
    tipo_atencion,
    metodo_pago
FROM pedidos
WHERE estado NOT IN ('cancelado')
GROUP BY DATE(created_at), tipo_atencion, metodo_pago
ORDER BY fecha DESC;

