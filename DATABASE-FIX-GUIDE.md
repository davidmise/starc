# Database Setup Fix - PostgreSQL Authentication

The error shows: `password authentication failed for user "stars_user"`

This means either:
1. The user `stars_user` doesn't exist in PostgreSQL
2. The password is incorrect
3. The user doesn't have the right permissions

## Quick Fix Commands

### Step 1: Connect to PostgreSQL as superuser
```bash
# On your Contabo server
sudo -u postgres psql
```

### Step 2: Create/Fix the Database User
```sql
-- Drop existing user if it exists (to reset permissions)
DROP USER IF EXISTS stars_user;

-- Create the user with the correct password
CREATE USER stars_user WITH PASSWORD 'Qwerty@2024#';

-- Grant necessary permissions
ALTER USER stars_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE stars_db TO stars_user;

-- Connect to the stars_db database
\c stars_db

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO stars_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stars_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stars_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO stars_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stars_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stars_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO stars_user;

-- Exit PostgreSQL
\q
```

### Step 3: Test Database Connection
```bash
# Test connection with the user
psql -h localhost -U stars_user -d stars_db -W

# Enter password when prompted: Qwerty@2024#
# If successful, you should see the postgres prompt
# Exit with: \q
```

### Step 4: Restart Backend Service
```bash
# Restart the backend
pm2 restart all

# Or if not using PM2:
cd /var/www/Backend/starc/backend
npm start
```

## Alternative: Complete Database Recreation

If the above doesn't work, here's a complete database setup:

```bash
# 1. Connect as postgres superuser
sudo -u postgres psql

# 2. Drop and recreate everything
DROP DATABASE IF EXISTS stars_db;
DROP USER IF EXISTS stars_user;

CREATE USER stars_user WITH PASSWORD 'Qwerty@2024#';
CREATE DATABASE stars_db OWNER stars_user;

GRANT ALL PRIVILEGES ON DATABASE stars_db TO stars_user;

# 3. Exit PostgreSQL
\q

# 4. Import schema as the new user
psql -h localhost -U stars_user -d stars_db -f /path/to/schema.sql

# Enter password: Qwerty@2024#
```

## Verify Environment Configuration

Make sure your `.env` file on the server has the correct database settings:

```bash
# Check current .env
cat .env

# Should contain:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stars_db
DB_USER=stars_user
DB_PASSWORD=Qwerty@2024#
```

## Troubleshooting Commands

```bash
# Check if PostgreSQL is running
systemctl status postgresql

# Check PostgreSQL version
sudo -u postgres psql -c "SELECT version();"

# List all databases
sudo -u postgres psql -l

# List all users
sudo -u postgres psql -c "\du"

# Check if user can connect
psql -h localhost -U stars_user -d stars_db -c "SELECT current_user;"
```

## Security Notes

For production, consider:
1. Using a more secure password
2. Restricting user permissions to only what's needed
3. Using connection pooling limits
4. Setting up SSL for database connections

## Expected Result

After running these commands, you should see:
- No more "password authentication failed" errors
- Backend starts successfully
- API endpoints respond correctly
- Sessions route works without database errors