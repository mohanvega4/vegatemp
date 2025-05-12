#!/bin/bash

# Step 1: Apply new schema migrations
echo "Applying new schema migrations..."
npx drizzle-kit push:pg --config=drizzle-new-schema.config.ts --verbose

# Step 2: Run migration script to seed data
echo "Running migration script to seed data..."
node scripts/migrate-to-new-schema.js

# Step 3: Start the server with new schema
echo "Starting server with new schema..."
NODE_ENV=development tsx server/new-index.ts