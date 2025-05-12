import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Checking notifications in database...');
    
    // Query all notifications
    const { rows: allNotifications } = await pool.query('SELECT * FROM notifications');
    console.log('All notifications:', allNotifications);
    
    // Check if any notifications exist for customer1 (ID 7)
    const { rows: customer1Notifications } = await pool.query('SELECT * FROM notifications WHERE user_id = $1', [7]);
    console.log('Notifications for customer1 (ID 7):', customer1Notifications);
    
    // Check the notifications table structure
    const { rows: tableInfo } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
    `);
    console.log('Notifications table structure:', tableInfo);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
