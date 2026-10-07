-- =====================================================
-- FIX: Arreglar números de pedido y función
-- Ejecutar en orders_db en Neon Tech
-- =====================================================

-- 1. Primero, eliminar los pedidos de prueba que tienen números incorrectos
DELETE FROM pedidos WHERE numero_pedido IN ('PED202512131300', 'PED202512131313');

-- 2. Recrear la función con el cálculo correcto
-- Formato: PED + YYYYMMDD + NNNN (15 caracteres total)
-- La secuencia empieza en posición 12

CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
    nuevo_numero TEXT;
    fecha_actual TEXT;
    secuencia INTEGER;
BEGIN
    fecha_actual := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- La secuencia son los últimos 4 caracteres
    SELECT COALESCE(MAX(CAST(RIGHT(numero_pedido, 4) AS INTEGER)), 0) + 1
    INTO secuencia
    FROM pedidos
    WHERE numero_pedido LIKE 'PED' || fecha_actual || '%';
    
    nuevo_numero := 'PED' || fecha_actual || LPAD(secuencia::TEXT, 4, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- 3. Verificar
SELECT generar_numero_pedido() as proximo_numero;
SELECT id, numero_pedido FROM pedidos ORDER BY id DESC;
