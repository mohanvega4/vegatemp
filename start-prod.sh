#!/bin/bash

# Create environments directory if it doesn't exist
mkdir -p environments

# Check if the environment file exists
if [ ! -f environments/.prod.env ]; then
  echo "Production environment file not found. Creating a template..."
  cat > environments/.prod.env << EOL
# Database Configuration
DATABASE_URL=postgres://username:password@host:port/database
AWS_RDS_HOST=your-aws-rds-host.region.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=your_production_database
AWS_RDS_USERNAME=your_username
AWS_RDS_PASSWORD=your_secure_password

# Application Configuration
PORT=5000
NODE_ENV=production
SESSION_SECRET=your_secure_session_secret

# Domain Configuration (for Traefik)
DOMAIN=yourdomain.com
EOL
  echo "Please edit environments/.prod.env with your actual production credentials."
  echo "Then run this script again."
  exit 1
fi

# Check if the build exists
if [ ! -d "dist" ]; then
  echo "Production build not found. Building the application..."
  npm run build
fi

# Load production environment variables
echo "Loading production environment variables..."
export $(cat environments/.prod.env | grep -v '^#' | xargs)

# Start the application in production mode
echo "Starting application in production mode..."
NODE_ENV=production node dist/index.js