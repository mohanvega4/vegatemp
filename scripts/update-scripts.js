#!/usr/bin/env node

/**
 * Script to update package.json scripts for AWS RDS
 * This avoids directly editing the package.json file
 */

const fs = require('fs');
const path = require('path');

// Get the package.json path
const packageJsonPath = path.resolve(__dirname, '../package.json');

// Read the current package.json
let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Update the scripts to use our AWS RDS configuration
packageJson.scripts = {
  ...packageJson.scripts,
  "aws:migrate": "node scripts/configure-aws-rds.js npx drizzle-kit push:pg",
  "aws:dev": "node scripts/configure-aws-rds.js npm run dev",
  "aws:start": "node scripts/configure-aws-rds.js node server/index.js",
  "aws:seed": "node scripts/configure-aws-rds.js node scripts/seed-all.js"
};

// Write the updated package.json back to disk
console.log("Updating package.json with AWS RDS scripts...");
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log("✅ Updated package.json with new AWS RDS scripts");
console.log("New scripts available:");
console.log("  npm run aws:migrate - Run database migrations using AWS RDS");
console.log("  npm run aws:dev     - Start the development server using AWS RDS");
console.log("  npm run aws:start   - Start the production server using AWS RDS");
console.log("  npm run aws:seed    - Seed the database using AWS RDS");