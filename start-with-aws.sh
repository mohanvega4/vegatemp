#!/bin/bash

# =============================================
# Vega Show AWS RDS Startup Script
# =============================================
# This script starts the application with AWS RDS connection
# by dynamically setting the DATABASE_URL based on AWS_RDS_* variables.

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗"
echo -e "║                  Vega Show AWS RDS Launcher                  ║"
echo -e "╚════════════════════════════════════════════════════════════╝${NC}"

# Verify environment variables
echo -e "${YELLOW}Checking AWS RDS environment variables...${NC}"
MISSING_VARS=0

# Check for required variables
if [ -z "$AWS_RDS_HOST" ]; then
  echo -e "${RED}Error: AWS_RDS_HOST environment variable is not set${NC}"
  MISSING_VARS=1
fi

if [ -z "$AWS_RDS_PORT" ]; then
  echo -e "${YELLOW}Warning: AWS_RDS_PORT not set, using default 5432${NC}"
  export AWS_RDS_PORT=5432
fi

if [ -z "$AWS_RDS_DATABASE" ]; then
  echo -e "${RED}Error: AWS_RDS_DATABASE environment variable is not set${NC}"
  MISSING_VARS=1
fi

if [ -z "$AWS_RDS_USERNAME" ]; then
  echo -e "${RED}Error: AWS_RDS_USERNAME environment variable is not set${NC}"
  MISSING_VARS=1
fi

if [ -z "$AWS_RDS_PASSWORD" ]; then
  echo -e "${RED}Error: AWS_RDS_PASSWORD environment variable is not set${NC}"
  MISSING_VARS=1
fi

# Exit if any required variables are missing
if [ $MISSING_VARS -eq 1 ]; then
  echo -e "${RED}Cannot proceed due to missing environment variables${NC}"
  echo -e "${YELLOW}Please set all required AWS RDS environment variables:${NC}"
  echo "export AWS_RDS_HOST=your-rds-host"
  echo "export AWS_RDS_PORT=your-rds-port"
  echo "export AWS_RDS_DATABASE=your-rds-database"
  echo "export AWS_RDS_USERNAME=your-rds-username"
  echo "export AWS_RDS_PASSWORD=your-rds-password"
  exit 1
fi

# Construct DATABASE_URL from AWS RDS credentials
export DATABASE_URL="postgres://$AWS_RDS_USERNAME:$AWS_RDS_PASSWORD@$AWS_RDS_HOST:$AWS_RDS_PORT/$AWS_RDS_DATABASE"

echo -e "${GREEN}✓ AWS RDS connection configured${NC}"
echo -e "${BLUE}Host:${NC} $AWS_RDS_HOST"
echo -e "${BLUE}Port:${NC} $AWS_RDS_PORT"
echo -e "${BLUE}Database:${NC} $AWS_RDS_DATABASE"
echo -e "${BLUE}Username:${NC} $AWS_RDS_USERNAME"
echo -e "${BLUE}Password:${NC} [HIDDEN]"

# Determine environment and command
ENV="${1:-development}"
COMMAND="dev"

if [ "$ENV" == "production" ]; then
  COMMAND="start"
fi

echo -e "${GREEN}Starting application in $ENV mode...${NC}"
NODE_ENV=$ENV npm run $COMMAND