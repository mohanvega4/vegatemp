#!/usr/bin/env node

/**
 * AWS RDS Configuration Script
 * ----------------------------
 * This script:
 * 1. Constructs a DATABASE_URL from AWS RDS credentials
 * 2. Sets the environment variable for use in other scripts
 * 3. Can be run before any script that needs DATABASE_URL
 */

const fs = require('fs');
const path = require('path');

// Get AWS RDS credentials from environment variables
const host = process.env.AWS_RDS_HOST;
const port = process.env.AWS_RDS_PORT || '5432';
const database = process.env.AWS_RDS_DATABASE;
const username = process.env.AWS_RDS_USERNAME;
const password = process.env.AWS_RDS_PASSWORD;

// Validate credentials
if (!host || !database || !username || !password) {
  console.error("Error: Missing AWS RDS credentials");
  console.error("Ensure you have set AWS_RDS_HOST, AWS_RDS_PORT, AWS_RDS_DATABASE, AWS_RDS_USERNAME, and AWS_RDS_PASSWORD");
  process.exit(1);
}

// Construct PostgreSQL connection string
const connectionString = `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

// Set DATABASE_URL environment variable
process.env.DATABASE_URL = connectionString;

console.log("🔧 AWS RDS Configuration");
console.log("=======================");
console.log(`📊 Host: ${host}`);
console.log(`🔌 Port: ${port}`);
console.log(`💾 Database: ${database}`);
console.log(`👤 Username: ${username}`);
console.log("🔑 Password: [hidden]");
console.log("✅ Successfully set DATABASE_URL from AWS RDS credentials");

// Pass control to the next script in the chain if arguments provided
if (process.argv.length > 2) {
  const { spawn } = require('child_process');
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  console.log(`\n🚀 Executing: ${command} ${commandArgs.join(' ')}\n`);

  const child = spawn(command, commandArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}