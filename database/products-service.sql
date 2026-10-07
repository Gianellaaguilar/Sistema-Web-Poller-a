-- =====================================================
-- PRODUCTS SERVICE - Base de Datos
-- Neon Tech: Crear base de datos "products_db"
-- =====================================================

-- Tabla de Categorías
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    disponible BOOLEAN DEFAULT true,
    imagen_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_disponible ON productos(disponible);
CREATE INDEX idx_categorias_activo ON categorias(activo);

-- =====================================================
-- DATOS INICIALES - CATEGORÍAS
-- =====================================================

INSERT INTO categorias (nombre, descripcion) VALUES 
('Pollos', 'Pollos a la brasa enteros y porciones'),
('Combos', 'Combos familiares y personales'),
('Bebidas', 'Gaseosas, jugos y refrescos'),
('Complementos', 'Papas, ensaladas y extras'),
('Postres', 'Postres y dulces');

-- =====================================================
-- DATOS INICIALES - PRODUCTOS
-- =====================================================

INSERT INTO productos (categoria_id, nombre, descripcion, precio) VALUES 
-- Pollos
(1, 'Pollo Entero', 'Pollo a la brasa entero con papas y ensalada', 55.00),
(1, '1/2 Pollo', 'Medio pollo a la brasa con papas y ensalada', 30.00),
(1, '1/4 Pollo', 'Cuarto de pollo a la brasa con papas y ensalada', 18.00),
(1, '1/8 Pollo', 'Octavo de pollo a la brasa con papas', 10.00),

-- Combos
(2, 'Combo Familiar', 'Pollo entero + gaseosa 1.5L + ensalada grande', 65.00),
(2, 'Combo Personal', '1/4 Pollo + gaseosa personal + ensalada', 22.00),
(2, 'Combo Dúo', '1/2 Pollo + 2 gaseosas personales', 38.00),
(2, 'Super Combo', '2 Pollos enteros + 2 gaseosas 1.5L + 2 ensaladas', 115.00),

-- Bebidas
(3, 'Inca Kola 1.5L', 'Gaseosa Inca Kola 1.5 litros', 8.00),
(3, 'Coca Cola 1.5L', 'Gaseosa Coca Cola 1.5 litros', 8.00),
(3, 'Inca Kola Personal', 'Gaseosa Inca Kola 500ml', 4.00),
(3, 'Coca Cola Personal', 'Gaseosa Coca Cola 500ml', 4.00),
(3, 'Chicha Morada 1L', 'Chicha morada natural 1 litro', 7.00),
(3, 'Limonada 1L', 'Limonada natural 1 litro', 6.00),

-- Complementos
(4, 'Papas Fritas Familiar', 'Porción familiar de papas fritas', 12.00),
(4, 'Papas Fritas Personal', 'Porción personal de papas fritas', 6.00),
(4, 'Ensalada Grande', 'Ensalada fresca grande', 8.00),
(4, 'Ensalada Personal', 'Ensalada fresca personal', 4.00),
(4, 'Cremas Adicionales', 'Paquete de cremas variadas', 2.00),

-- Postres
(5, 'Torta de Chocolate', 'Porción de torta de chocolate', 8.00),
(5, 'Flan', 'Flan casero', 5.00),
(5, 'Helado', 'Copa de helado', 6.00);

-- Ver productos
SELECT p.id, p.nombre, p.precio, c.nombre as categoria 
FROM productos p 
JOIN categorias c ON p.categoria_id = c.id
ORDER BY c.nombre, p.nombre;

