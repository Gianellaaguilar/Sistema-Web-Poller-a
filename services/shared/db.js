const { neon } = require('@neondatabase/serverless');

// Crear cliente de conexión a Neon
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };

