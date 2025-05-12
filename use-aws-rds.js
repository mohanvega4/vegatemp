#!/usr/bin/env node

/**
 * This script constructs a DATABASE_URL using AWS RDS credentials
 * and sets it as an environment variable.
 */

// Get AWS RDS credentials from environment variables
const host = process.env.AWS_RDS_HOST;
const port = process.env.AWS_RDS_PORT;
const database = process.env.AWS_RDS_DATABASE;
const username = process.env.AWS_RDS_USERNAME;
const password = process.env.AWS_RDS_PASSWORD;

// Validate credentials
if (!host || !port || !database || !username || !password) {
  console.error("Error: Missing AWS RDS credentials");
  console.error("Ensure you have set AWS_RDS_HOST, AWS_RDS_PORT, AWS_RDS_DATABASE, AWS_RDS_USERNAME, and AWS_RDS_PASSWORD");
  process.exit(1);
}

// Construct PostgreSQL connection string
const connectionString = `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

// Set DATABASE_URL environment variable
process.env.DATABASE_URL = connectionString;

console.log("Set DATABASE_URL to AWS RDS connection string");
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`Database: ${database}`);
console.log(`Username: ${username}`);
console.log("Password: [hidden]");

// Export the connection string for use in other modules
module.exports = {
  connectionString
};