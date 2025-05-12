#!/usr/bin/env node

// This script sets the DATABASE_URL environment variable using AWS RDS credentials
// to be used with drizzle-kit commands for migrations

const host = process.env.AWS_RDS_HOST;
const port = process.env.AWS_RDS_PORT;
const database = process.env.AWS_RDS_DATABASE;
const username = process.env.AWS_RDS_USERNAME;
const password = process.env.AWS_RDS_PASSWORD;

if (!host || !port || !database || !username || !password) {
  console.error("Error: Missing AWS RDS credentials");
  console.error("Ensure you have set AWS_RDS_HOST, AWS_RDS_PORT, AWS_RDS_DATABASE, AWS_RDS_USERNAME, and AWS_RDS_PASSWORD");
  process.exit(1);
}

// Construct PostgreSQL connection string
const connectionString = `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

// Set DATABASE_URL environment variable and execute the command
process.env.DATABASE_URL = connectionString;

// Log success but not the actual connection string for security
console.log("Successfully set DATABASE_URL from AWS RDS credentials");

// Pass control to the next script in the chain
if (process.argv.length > 2) {
  const { spawn } = require('child_process');
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}