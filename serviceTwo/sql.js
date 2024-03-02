
const api = require('@opentelemetry/api');
const mysql = require('mysql2');


// Create a connection pool
const pool = mysql.createPool({
  host: 'your-mysql-container',
  user: 'any_user',
  password: 'your_mysql_password',
  database: 'test',
  connectionLimit: 10, // Adjust according to your needs
});

// Export the pool for reuse in different modules
module.exports = pool;