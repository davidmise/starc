#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = require('./setup-database');
const { backupDatabase, restoreDatabase } = require('./database-backup');
const { healthCheck, performanceTest } = require('./database-health-check');
const seedData = require('./seed-data');

const commands = {
  setup: 'Setup database tables, indexes, and triggers',
  backup: 'Create a database backup',
  restore: 'Restore database from backup file',
  health: 'Run database health check',
  performance: 'Run performance tests',
  seed: 'Seed database with sample data',
  full: 'Run complete setup (setup + seed)',
  status: 'Show database connection status'
};

const showHelp = () => {
  console.log('🗄️ Stars Corporate Database Management');
  console.log('=====================================\n');
  console.log('Usage: node manage-database.js <command> [options]\n');
  console.log('Commands:');
  
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });
  
  console.log('\nExamples:');
  console.log('  node manage-database.js setup');
  console.log('  node manage-database.js backup');
  console.log('  node manage-database.js restore backups/stars_corporate_backup_2024-01-01.sql');
  console.log('  node manage-database.js health');
  console.log('  node manage-database.js seed');
  console.log('  node manage-database.js full');
};

const checkDatabaseConnection = async () => {
  try {
    const { healthCheck } = require('./database-health-check');
    const result = await healthCheck();
    return result;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

const runCommand = async (command, args = []) => {
  console.log(`🚀 Running command: ${command}`);
  console.log('=====================================\n');

  try {
    switch (command) {
      case 'setup':
        console.log('🔧 Setting up database...');
        await setupDatabase();
        break;

      case 'backup':
        console.log('📦 Creating backup...');
        await backupDatabase();
        break;

      case 'restore':
        if (!args[0]) {
          console.error('❌ Please provide backup file path');
          console.log('Example: node manage-database.js restore backups/stars_corporate_backup_2024-01-01.sql');
          process.exit(1);
        }
        console.log('📦 Restoring from backup...');
        await restoreDatabase(args[0]);
        break;

      case 'health':
        console.log('🏥 Running health check...');
        await healthCheck();
        break;

      case 'performance':
        console.log('⚡ Running performance tests...');
        await performanceTest();
        break;

      case 'seed':
        console.log('🌱 Seeding database...');
        await seedData();
        break;

      case 'full':
        console.log('🎯 Running complete setup...');
        console.log('\n1️⃣ Setting up database...');
        await setupDatabase();
        console.log('\n2️⃣ Seeding with sample data...');
        await seedData();
        console.log('\n3️⃣ Running health check...');
        await healthCheck();
        console.log('\n🎉 Complete setup finished successfully!');
        break;

      case 'status':
        console.log('📊 Checking database status...');
        const isConnected = await checkDatabaseConnection();
        if (isConnected) {
          console.log('✅ Database is connected and healthy');
        } else {
          console.log('❌ Database connection failed');
        }
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }

    console.log('\n✅ Command completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  }
};

// Main execution
const main = () => {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  runCommand(command, args);
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runCommand,
  checkDatabaseConnection
}; 