import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Attempting to add missing columns to notifications table...');
    
    const client = await pool.connect();
    try {
      // Check if entity_id column exists
      const entityIdCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'notifications' AND column_name = 'entity_id'
        )
      `);
      
      // Check if entity_type column exists
      const entityTypeCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'notifications' AND column_name = 'entity_type'
        )
      `);
      
      // Check if read_at column exists
      const readAtCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'notifications' AND column_name = 'read_at'
        )
      `);
      
      console.log('Column checks:', {
        entityIdExists: entityIdCheck.rows[0].exists,
        entityTypeExists: entityTypeCheck.rows[0].exists,
        readAtExists: readAtCheck.rows[0].exists
      });
      
      // Add missing columns
      if (!entityIdCheck.rows[0].exists) {
        console.log('Adding entity_id column...');
        await client.query(`
          ALTER TABLE notifications 
          ADD COLUMN entity_id INTEGER
        `);
      }
      
      if (!entityTypeCheck.rows[0].exists) {
        console.log('Adding entity_type column...');
        await client.query(`
          ALTER TABLE notifications 
          ADD COLUMN entity_type TEXT
        `);
      }
      
      if (!readAtCheck.rows[0].exists) {
        console.log('Adding read_at column...');
        await client.query(`
          ALTER TABLE notifications 
          ADD COLUMN read_at TIMESTAMP
        `);
      }
      
      console.log('Finished adding columns. Checking final structure...');
      
      // Verify the table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'notifications'
      `);
      console.log('Notifications table structure:', columnsResult.rows);
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
