const { pool } = require('../config/database');

const addPasswordResetTable = async () => {
  try {
    console.log('🔧 Adding password_reset_tokens table...');

    // Create password reset tokens table
    const createTable = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index for faster token lookups
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
    `;

    await pool.query(createTable);
    console.log('✅ Password reset tokens table created successfully');

  } catch (error) {
    console.error('❌ Error creating password reset tokens table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  addPasswordResetTable()
    .then(() => {
      console.log('✅ Password reset table setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Password reset table setup failed:', error);
      process.exit(1);
    });
}

module.exports = { addPasswordResetTable };
