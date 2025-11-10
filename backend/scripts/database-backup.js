const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const backupDatabase = async () => {
  try {
    console.log('🔄 Starting database backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const backupFile = `stars_corporate_backup_${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupFile);

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Database connection parameters
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5433;
    const dbName = process.env.DB_NAME || 'stars_corporate';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'Qwerty@2024#';

    // Create backup command
    const backupCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --verbose --clean --no-owner --no-privileges > "${backupPath}"`;

    console.log('📦 Creating backup...');
    
    exec(backupCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error);
        return;
      }

      console.log('✅ Backup created successfully');
      console.log(`📁 Backup saved to: ${backupPath}`);

      // Compress the backup file
      const compressedFile = `${backupPath}.gz`;
      const compressCommand = `gzip "${backupPath}"`;

      exec(compressCommand, (compressError) => {
        if (compressError) {
          console.error('❌ Compression failed:', compressError);
          return;
        }

        console.log('🗜️ Backup compressed successfully');
        console.log(`📦 Compressed backup: ${compressedFile}`);

        // Clean up old backups (keep last 7 days)
        cleanupOldBackups(backupDir);
      });
    });

  } catch (error) {
    console.error('❌ Backup process failed:', error);
  }
};

const cleanupOldBackups = (backupDir) => {
  try {
    const files = fs.readdirSync(backupDir);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    });

    console.log('🧹 Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

const restoreDatabase = async (backupFile) => {
  try {
    console.log('🔄 Starting database restore...');

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 5433;
    const dbName = process.env.DB_NAME || 'stars_corporate';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'Qwerty@2024#';

    // Check if backup file exists
    if (!fs.existsSync(backupFile)) {
      console.error('❌ Backup file not found:', backupFile);
      return;
    }

    // Restore command
    const restoreCommand = `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} < "${backupFile}"`;

    console.log('📦 Restoring from backup...');
    
    exec(restoreCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Restore failed:', error);
        return;
      }

      console.log('✅ Database restored successfully');
    });

  } catch (error) {
    console.error('❌ Restore process failed:', error);
  }
};

// Export functions for use in other scripts
module.exports = {
  backupDatabase,
  restoreDatabase,
  cleanupOldBackups
};

// Run backup if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'restore' && process.argv[3]) {
    restoreDatabase(process.argv[3]);
  } else {
    backupDatabase();
  }
} 