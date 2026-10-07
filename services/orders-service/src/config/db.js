const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida');
}

const sql = neon(process.env.DATABASE_URL);

// Función con reintentos automáticos para manejar cold start de Neon
async function sqlWithRetry(query, params = [], maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await query;
    } catch (error) {
      lastError = error;
      console.log(`⚠️ Intento ${attempt}/${maxRetries} falló:`, error.message);
      
      if (attempt < maxRetries) {
        // Esperar antes de reintentar (500ms, 1s, 1.5s)
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
  }
  
  throw lastError;
}

// Warmup: Despertar la base de datos al iniciar el servicio
async function warmupDatabase() {
  console.log('🔄 Despertando base de datos orders_db...');
  for (let i = 1; i <= 3; i++) {
    try {
      await sql`SELECT 1`;
      console.log('✅ Base de datos orders_db lista');
      return true;
    } catch (error) {
      console.log(`   Intento ${i}/3 - esperando...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.log('⚠️ Base de datos puede estar lenta en la primera petición');
  return false;
}

// Ejecutar warmup al cargar el módulo
warmupDatabase();

module.exports = { sql, sqlWithRetry, warmupDatabase };
