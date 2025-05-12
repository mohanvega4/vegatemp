# AWS RDS Configuration Guide

This document provides instructions for using AWS RDS PostgreSQL with the Vega Show Platform.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Connection Configuration](#connection-configuration)
3. [Available Scripts](#available-scripts)
4. [Troubleshooting](#troubleshooting)

## Environment Variables

The application requires the following environment variables to connect to AWS RDS:

```
AWS_RDS_HOST=your-instance.region.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=dbname
AWS_RDS_USERNAME=username
AWS_RDS_PASSWORD=password
```

These variables are automatically loaded from the appropriate environment file in the `environments` directory:

- `.dev.env` - Development environment (default)
- `.local.env` - Local development
- `.prod.env` - Production environment

## Connection Configuration

The application uses AWS RDS as its primary database. The connection is configured in the following files:

1. `server/db.ts` - Main database connection
2. `server/new-db.ts` - New schema database connection
3. `scripts/configure-aws-rds.js` - Script to configure AWS RDS connection
4. `start-with-aws.sh` - Shell script to start the application with AWS RDS

### SSL Configuration

SSL is disabled for RDS connections as configured in RDS parameter groups. If your AWS RDS instance requires SSL, update the `ssl` option in the connection configuration.

## Available Scripts

### Start with AWS RDS

Start the application with AWS RDS:

```bash
./start-with-aws.sh [environment]
```

Where `environment` is one of: `development`, `production` (defaults to `development`).

### Check AWS Connection

Verify the AWS RDS connection:

```bash
node scripts/check-aws-connection.js
```

This script will:
- Test the connection to AWS RDS
- Check database size
- List all tables
- Show database users
- Display active connections

### Configure AWS RDS

Set DATABASE_URL based on AWS RDS credentials:

```bash
node scripts/configure-aws-rds.js [command]
```

This will set the DATABASE_URL environment variable and then execute the optional command.

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify AWS RDS credentials in your environment file
2. Ensure your EC2 security group allows connections to the RDS instance
3. Check network connectivity with:
   ```bash
   nc -zv your-instance.region.rds.amazonaws.com 5432
   ```
4. Run the connection check script:
   ```bash
   node scripts/check-aws-connection.js
   ```

### Database Migration Issues

If you encounter migration issues:

1. Ensure AWS RDS credentials are correct
2. Verify that you have appropriate permissions on the database
3. Check that your RDS instance has sufficient storage

For additional help, consult the AWS RDS documentation or contact your database administrator.