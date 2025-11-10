const { Pool } = require('pg');
require('dotenv').config();

// Environment-specific configurations
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'stars_corporate',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Qwerty@2024#',
  
  // Connection pool settings
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  
  // SSL configuration for production
  ssl: isProduction ? {
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false,
  
  // Statement timeout to prevent long-running queries
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  
  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
  
  // Application name for monitoring
  application_name: 'stars_corporate_app'
});

// Enhanced connection event handling
pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
  
  // Set session-level configurations
  client.query('SET timezone = \'UTC\'');
  client.query('SET application_name = \'stars_corporate_app\'');
  
  if (isDevelopment) {
    client.query('SET log_statement = \'all\'');
  }
});

pool.on('error', (err, client) => {
  console.error('❌ Database connection error:', err);
  
  // Log additional error details in development
  if (isDevelopment) {
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position,
      internalPosition: err.internalPosition,
      where: err.where,
      schema: err.schema,
      table: err.table,
      column: err.column,
      dataType: err.dataType,
      constraint: err.constraint,
      file: err.file,
      line: err.line,
      routine: err.routine
    });
  }
});

pool.on('acquire', (client) => {
  if (isDevelopment) {
    console.log('🔗 Client acquired from pool');
  }
});

pool.on('release', (client) => {
  if (isDevelopment) {
    console.log('🔗 Client released to pool');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Shutting down database pool...');
  pool.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Shutting down database pool...');
  pool.end();
  process.exit(0);
});

// Database health check function
const healthCheck = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version.split(' ')[0]
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Enhanced query function with error handling
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (isDevelopment) {
      console.log('📊 Query executed:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Query error:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
};

// Get pool statistics
const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

module.exports = {
  pool,
  query,
  healthCheck,
  getPoolStats
}; 