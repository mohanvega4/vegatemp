import pg from 'pg';

const { Pool } = pg;

const dbConfig = {
  host: process.env.AWS_RDS_HOST || process.env.PGHOST || 'vegadevvemsdb.cbw0ei0cqj16.me-south-1.rds.amazonaws.com',
  port: parseInt(process.env.AWS_RDS_PORT || process.env.PGPORT || '5432'),
  database: process.env.AWS_RDS_DATABASE || process.env.PGDATABASE || 'vegadevvemsdb',
  user: process.env.AWS_RDS_USERNAME || process.env.PGUSER || 'vega',
  password: process.env.AWS_RDS_PASSWORD || process.env.PGPASSWORD,
  ssl: false
};

console.log("Using database configuration:", {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  hasPassword: !!dbConfig.password
});

const pool = new Pool(dbConfig);

async function checkEnumValues(enumName) {
  try {
    const result = await pool.query(`
      SELECT e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = $1
      ORDER BY e.enumsortorder;
    `, [enumName]);
    
    console.log(`Values for enum '${enumName}':`);
    result.rows.forEach(row => {
      console.log(`- ${row.enumlabel}`);
    });
    
  } catch (error) {
    console.error(`Error checking enum '${enumName}':`, error);
  }
}

async function checkTableColumns(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    console.log(`Columns for table '${tableName}':`);
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}${row.udt_name !== row.data_type ? ` (${row.udt_name})` : ''}`);
    });
    
  } catch (error) {
    console.error(`Error checking table columns for '${tableName}':`, error);
  }
}

async function main() {
  try {
    console.log('Checking enum values in the database...');
    
    await checkEnumValues('event_type');
    await checkEnumValues('event_location_type');
    await checkEnumValues('event_vibe');
    
    console.log('\nChecking table columns...');
    await checkTableColumns('events');
    
    console.log('\nEnum check completed.');
    
  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    await pool.end();
  }
}

main();