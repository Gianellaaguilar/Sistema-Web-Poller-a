-- =====================================================
-- AUTH SERVICE - Base de Datos
-- Neon Tech: Crear base de datos "auth_db"
-- =====================================================

-- Tabla de Trabajadores
CREATE TABLE IF NOT EXISTS trabajadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trabajadores_usuario ON trabajadores(usuario);
CREATE INDEX IF NOT EXISTS idx_trabajadores_activo ON trabajadores(activo);

-- =====================================================
-- DATOS INICIALES
-- Usuario: trabajador1 | Password: polleria123
-- =====================================================

-- Limpiar datos existentes (opcional)
DELETE FROM trabajadores WHERE usuario IN ('trabajador1', 'trabajador2', 'trabajador3');

-- Insertar trabajadores con hash correcto
INSERT INTO trabajadores (nombre, usuario, password_hash) VALUES 
('Carlos Mendoza', 'trabajador1', '$2a$10$z4Xrfs7rkadjwq9zj5yNFekKOz00JqrAd4HwTLR8W4yH3vAzTJDIK'),
('María García', 'trabajador2', '$2a$10$z4Xrfs7rkadjwq9zj5yNFekKOz00JqrAd4HwTLR8W4yH3vAzTJDIK'),
('Juan Pérez', 'trabajador3', '$2a$10$z4Xrfs7rkadjwq9zj5yNFekKOz00JqrAd4HwTLR8W4yH3vAzTJDIK');

-- Ver trabajadores
SELECT id, nombre, usuario, activo FROM trabajadores;
