#!/bin/bash

# Step 1: Generate migration SQL for new schema
echo "Generating migration SQL for new schema..."
npx drizzle-kit push:pg --config=drizzle-new-schema.config.ts --verbose

# Step 2: Run migration script to seed data
echo "Running migration script to seed data..."
node scripts/migrate-to-new-schema.js

echo "Migration complete!"