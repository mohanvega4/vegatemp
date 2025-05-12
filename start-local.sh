#!/bin/bash

# Create environments directory if it doesn't exist
mkdir -p environments

# Check if the environment file exists
if [ ! -f environments/.local.env ]; then
  echo "Local environment file not found. Creating a template..."
  cat > environments/.local.env << EOL
# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/vegashow
# Local PostgreSQL configuration - comment out AWS settings if using local DB
# AWS_RDS_HOST=localhost
# AWS_RDS_PORT=5432
# AWS_RDS_DATABASE=vegashow
# AWS_RDS_USERNAME=postgres
# AWS_RDS_PASSWORD=postgres

# Application Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=local_development_secret
EOL
  echo "Please edit environments/.local.env with your actual credentials."
  echo "Then run this script again."
  exit 1
fi

# Load local environment variables
echo "Loading local environment variables..."
export $(cat environments/.local.env | grep -v '^#' | xargs)

# Start the application in development mode
echo "Starting application in local development mode..."
NODE_ENV=development npx tsx server/index.ts