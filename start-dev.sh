#!/bin/bash

# Create environments directory if it doesn't exist
mkdir -p environments

# Check if the environment file exists
if [ ! -f environments/.dev.env ]; then
  echo "Development environment file not found. Creating a template..."
  cat > environments/.dev.env << EOL
# Database Configuration
DATABASE_URL=postgres://username:password@host:port/database
AWS_RDS_HOST=vegadevvemsdb.cbw0ei0cqj16.me-south-1.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=vegadevvemsdb
AWS_RDS_USERNAME=vega
AWS_RDS_PASSWORD=your_password_here

# Application Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_session_secret
EOL
  echo "Please edit environments/.dev.env with your actual credentials."
  echo "Then run this script again."
  exit 1
fi

# Load development environment variables
echo "Loading development environment variables..."
export $(cat environments/.dev.env | grep -v '^#' | xargs)

# Start the application in development mode
echo "Starting application in development mode..."
NODE_ENV=development npx tsx server/index.ts