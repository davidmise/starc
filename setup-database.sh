#!/bin/bash

# PostgreSQL Database Setup Script for Stars Corporate
# Run this script on your Contabo server to fix database authentication

echo "🔧 Setting up PostgreSQL database for Stars Corporate..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL is not running. Starting..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "✅ PostgreSQL is running"

# Create database and user
echo "🔄 Setting up database and user..."

sudo -u postgres psql << EOF
-- Drop existing user and database if they exist
DROP DATABASE IF EXISTS stars_db;
DROP USER IF EXISTS stars_user;

-- Create new user with password
CREATE USER stars_user WITH PASSWORD 'Qwerty@2024#';

-- Create database owned by the user
CREATE DATABASE stars_db OWNER stars_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE stars_db TO stars_user;
ALTER USER stars_user CREATEDB;

-- Display confirmation
\l
\du
EOF

echo "✅ Database and user created"

# Grant schema permissions
echo "🔄 Setting up schema permissions..."

sudo -u postgres psql -d stars_db << EOF
-- Grant schema permissions
GRANT ALL ON SCHEMA public TO stars_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stars_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stars_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO stars_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stars_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stars_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO stars_user;
EOF

echo "✅ Schema permissions set"

# Test connection
echo "🧪 Testing database connection..."

PGPASSWORD='Qwerty@2024#' psql -h localhost -U stars_user -d stars_db -c "SELECT current_user, current_database();" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection test successful"
else
    echo "❌ Database connection test failed"
    exit 1
fi

# Import schema if it exists
if [ -f "schema.sql" ]; then
    echo "🔄 Importing database schema..."
    PGPASSWORD='Qwerty@2024#' psql -h localhost -U stars_user -d stars_db -f schema.sql
    echo "✅ Schema imported"
elif [ -f "/var/www/Backend/starc/schema.sql" ]; then
    echo "🔄 Importing database schema..."
    PGPASSWORD='Qwerty@2024#' psql -h localhost -U stars_user -d stars_db -f /var/www/Backend/starc/schema.sql
    echo "✅ Schema imported"
else
    echo "⚠️  Schema file not found. You may need to import it manually."
fi

echo "🎉 Database setup complete!"
echo ""
echo "Database Details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: stars_db"
echo "  User: stars_user"
echo "  Password: Qwerty@2024#"
echo ""
echo "Next steps:"
echo "1. Restart your backend: pm2 restart all"
echo "2. Test the API: curl http://localhost:81/api/health"
echo "3. Check backend logs: pm2 logs stars-backend"