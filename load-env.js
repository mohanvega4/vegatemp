#!/usr/bin/env node

/**
 * Environment Variables Loader
 * ----------------------------
 * This script loads environment variables from the appropriate .env file
 * based on the NODE_ENV value or command line arguments.
 * 
 * Usage:
 *   - Default: NODE_ENV is used to determine which file to load
 *   - Command line: node load-env.js local|dev|prod
 * 
 * Example:
 *   - NODE_ENV=production node load-env.js
 *   - node load-env.js prod
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the current file's directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define environment mapping
const ENV_MAP = {
  'local': '.local.env',
  'development': '.dev.env',
  'dev': '.dev.env',
  'production': '.prod.env',
  'prod': '.prod.env'
};

// Get environment from command line or NODE_ENV
let environment = process.argv[2] || process.env.NODE_ENV || 'local';
environment = environment.toLowerCase();

// Map to actual file name
const envFileName = ENV_MAP[environment] || '.local.env';
const envFilePath = path.join(__dirname, 'environments', envFileName);

// Check if the environment file exists
if (!fs.existsSync(envFilePath)) {
  console.error(`Error: Environment file ${envFilePath} not found.`);
  console.error(`Available environments: ${Object.keys(ENV_MAP).join(', ')}`);
  process.exit(1);
}

// Load environment variables
const result = dotenv.config({ path: envFilePath });

if (result.error) {
  console.error(`Error loading environment variables from ${envFilePath}:`, result.error);
  process.exit(1);
}

// Print loaded environment (without sensitive data)
console.log(`Loaded environment: ${environment} (${envFileName})`);
console.log('Environment variables loaded successfully.');

// Ensure DATABASE_URL is properly set from AWS RDS credentials if available
if (process.env.AWS_RDS_HOST && 
    process.env.AWS_RDS_USERNAME && 
    process.env.AWS_RDS_PASSWORD && 
    process.env.AWS_RDS_DATABASE) {
  
  const port = process.env.AWS_RDS_PORT || '5432';
  const awsDbUrl = `postgres://${process.env.AWS_RDS_USERNAME}:${encodeURIComponent(process.env.AWS_RDS_PASSWORD)}@${process.env.AWS_RDS_HOST}:${port}/${process.env.AWS_RDS_DATABASE}`;
  
  // Only override if DATABASE_URL doesn't already point to the same AWS RDS instance
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes(process.env.AWS_RDS_HOST)) {
    process.env.DATABASE_URL = awsDbUrl;
    console.log('DATABASE_URL overridden with AWS RDS connection string');
  }
}

// Add NODE_ENV if it wasn't already set
if (!process.env.NODE_ENV) {
  // Convert short names to standard NODE_ENV values
  let nodeEnv = environment;
  if (environment === 'local' || environment === 'dev') {
    nodeEnv = 'development';
  } else if (environment === 'prod') {
    nodeEnv = 'production';
  }
  
  process.env.NODE_ENV = nodeEnv;
  console.log(`NODE_ENV set to ${nodeEnv}`);
}

// Export variables to be used in subsequent commands
Object.entries(process.env).forEach(([key, value]) => {
  // Skip sensitive variables in logs
  const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY'];
  const isSensitive = sensitiveKeys.some(sensitive => key.includes(sensitive));
  
  if (!isSensitive) {
    console.log(`${key}=${value}`);
  } else {
    console.log(`${key}=********`);
  }
  
  // Export variables to be used by the shell
  // This will only work if this script is sourced, not executed
  if (typeof process.stdout.write === 'function') {
    process.stdout.write(`export ${key}=${value.replace(/"/g, '\\"')}\n`);
  }
});

// In ES modules, there's no direct equivalent to require.main === module
// Instead, we can check if the import.meta.url is the same as the executed file
if (import.meta.url.startsWith('file:')) {
  console.log('\nNote: To export these variables to your shell, use:');
  console.log('  source <(node load-env.js [environment])');
}