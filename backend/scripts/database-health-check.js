const { pool } = require('../config/database');

const healthCheck = async () => {
  try {
    console.log('🏥 Starting database health check...');

    // Test basic connection
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection: OK');
    console.log(`⏰ Current time: ${connectionTest.rows[0].current_time}`);

    // Check table counts (fix column names in UNION)
    const tableCounts = await pool.query(`
      SELECT 'users' AS table_name, COUNT(*) AS count FROM users
      UNION ALL
      SELECT 'live_sessions' AS table_name, COUNT(*) AS count FROM live_sessions
      UNION ALL
      SELECT 'likes' AS table_name, COUNT(*) AS count FROM likes
      UNION ALL
      SELECT 'comments' AS table_name, COUNT(*) AS count FROM comments
      UNION ALL
      SELECT 'bookings' AS table_name, COUNT(*) AS count FROM bookings
      UNION ALL
      SELECT 'gifts' AS table_name, COUNT(*) AS count FROM gifts
      UNION ALL
      SELECT 'genres' AS table_name, COUNT(*) AS count FROM genres
      UNION ALL
      SELECT 'user_sessions' AS table_name, COUNT(*) AS count FROM user_sessions
      UNION ALL
      SELECT 'notifications' AS table_name, COUNT(*) AS count FROM notifications
      UNION ALL
      SELECT 'user_stats' AS table_name, COUNT(*) AS count FROM user_stats
      UNION ALL
      SELECT 'session_stats' AS table_name, COUNT(*) AS count FROM session_stats
    `);

    console.log('\n📊 Table Statistics:');
    tableCounts.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} records`);
    });

    // Check database size
    const dbSize = await pool.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_size_pretty(pg_total_relation_size('users')) as users_size,
        pg_size_pretty(pg_total_relation_size('live_sessions')) as sessions_size
    `);

    console.log('\n💾 Database Size:');
    console.log(`   Total: ${dbSize.rows[0].database_size}`);
    console.log(`   Users table: ${dbSize.rows[0].users_size}`);
    console.log(`   Sessions table: ${dbSize.rows[0].sessions_size}`);

    // Check active connections
    const activeConnections = await pool.query(`
      SELECT 
        COUNT(*) as active_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_queries,
        COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);

    console.log('\n🔗 Connection Status:');
    console.log(`   Active connections: ${activeConnections.rows[0].active_connections}`);
    console.log(`   Active queries: ${activeConnections.rows[0].active_queries}`);
    console.log(`   Idle connections: ${activeConnections.rows[0].idle_connections}`);

    // Check index usage
    const indexUsage = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10
    `);

    console.log('\n📈 Top Index Usage:');
    indexUsage.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.tablename}.${row.indexname}: ${row.index_scans} scans`);
    });

    // Check slow queries
    const slowQueries = await pool.query(`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC
      LIMIT 5
    `);

    console.log('\n🐌 Slowest Queries:');
    slowQueries.rows.forEach((row, index) => {
      const query = row.query.length > 50 ? row.query.substring(0, 50) + '...' : row.query;
      console.log(`   ${index + 1}. ${query}`);
      console.log(`      Calls: ${row.calls}, Avg time: ${row.mean_time.toFixed(2)}ms`);
    });

    // Check for potential issues
    const issues = [];

    // Check for tables without indexes
    const tablesWithoutIndexes = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN (
        SELECT DISTINCT tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public'
      )
    `);

    if (tablesWithoutIndexes.rows.length > 0) {
      issues.push(`Tables without indexes: ${tablesWithoutIndexes.rows.map(r => r.tablename).join(', ')}`);
    }

    // Check for bloated tables
    const bloatedTables = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      WHERE n_dead_tup > n_live_tup * 0.1
    `);

    if (bloatedTables.rows.length > 0) {
      issues.push(`Tables with high dead tuple ratio: ${bloatedTables.rows.map(r => r.tablename).join(', ')}`);
    }

    // Check for long-running queries
    const longRunningQueries = await pool.query(`
      SELECT 
        pid,
        now() - pg_stat_activity.query_start AS duration,
        query
      FROM pg_stat_activity 
      WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
      AND state = 'active'
    `);

    if (longRunningQueries.rows.length > 0) {
      issues.push(`${longRunningQueries.rows.length} long-running queries detected`);
    }

    console.log('\n⚠️ Potential Issues:');
    if (issues.length === 0) {
      console.log('   ✅ No issues detected');
    } else {
      issues.forEach(issue => console.log(`   ⚠️ ${issue}`));
    }

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    if (activeConnections.rows[0].active_connections > 50) {
      console.log('   🔧 Consider increasing connection pool size');
    }
    
    if (bloatedTables.rows.length > 0) {
      console.log('   🧹 Run VACUUM on bloated tables');
    }
    
    if (slowQueries.rows.length > 0 && slowQueries.rows[0].mean_time > 100) {
      console.log('   🔍 Optimize slow queries');
    }

    console.log('\n✅ Health check completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
};

const performanceTest = async () => {
  try {
    console.log('⚡ Starting performance test...');

    const startTime = Date.now();

    // Test read performance
    const readTest = await pool.query('SELECT COUNT(*) FROM users');
    const readTime = Date.now() - startTime;

    // Test write performance
    const writeStart = Date.now();
    await pool.query('SELECT 1'); // Simple query to test write performance
    const writeTime = Date.now() - writeStart;

    // Test complex query performance
    const complexStart = Date.now();
    await pool.query(`
      SELECT 
        u.username,
        COUNT(ls.id) as session_count,
        COUNT(l.id) as like_count
      FROM users u
      LEFT JOIN live_sessions ls ON u.id = ls.user_id
      LEFT JOIN likes l ON ls.id = l.session_id
      GROUP BY u.id, u.username
      LIMIT 100
    `);
    const complexTime = Date.now() - complexStart;

    console.log('📊 Performance Results:');
    console.log(`   Read test: ${readTime}ms`);
    console.log(`   Write test: ${writeTime}ms`);
    console.log(`   Complex query: ${complexTime}ms`);

    if (readTime < 100 && writeTime < 50 && complexTime < 500) {
      console.log('✅ Performance: Excellent');
    } else if (readTime < 200 && writeTime < 100 && complexTime < 1000) {
      console.log('✅ Performance: Good');
    } else {
      console.log('⚠️ Performance: Needs optimization');
    }

  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
};

// Export functions
module.exports = {
  healthCheck,
  performanceTest
};

// Run health check if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'performance') {
    performanceTest();
  } else {
    healthCheck();
  }
} 