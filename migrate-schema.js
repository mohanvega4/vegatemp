/*
 * Script to push database schema changes without interactive prompt
 */
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary Drizzle config file that forces non-interactive mode
const tempConfigPath = path.join(__dirname, 'temp-drizzle.config.ts');
const originalConfigPath = path.join(__dirname, 'drizzle.config.ts');

// Read the original config
const originalConfig = fs.readFileSync(originalConfigPath, 'utf8');

// Create a modified config with push option to force non-interactive mode
const tempConfig = originalConfig.replace(
  'export default {', 
  `export default {
  // Force non-interactive mode for CI/CD
  force: true,`
);

// Write to temp file
fs.writeFileSync(tempConfigPath, tempConfig);

console.log('Running schema migration with --force flag...');

// Execute drizzle-kit push with the temporary config
exec(`npx drizzle-kit push --config=${tempConfigPath}`, (error, stdout, stderr) => {
  // Clean up the temporary config
  try {
    fs.unlinkSync(tempConfigPath);
  } catch (err) {
    console.error(`Error deleting temp file: ${err.message}`);
  }
  
  if (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('Schema migration completed successfully');
});