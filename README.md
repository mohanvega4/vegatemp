# Vega Show

Vega Show is a dynamic event management and talent coordination platform that enables seamless interactions between service providers and customers, featuring role-based dashboards for administrators, customers, and talent users.

## 🚀 Tech Stack

- **Frontend:**
  - TypeScript
  - React
  - TanStack Query
  - Tailwind CSS
  - shadcn/ui
  - Vite

- **Backend:**
  - Node.js
  - Express
  - Passport.js (Authentication)
  - TypeScript

- **Database:**
  - PostgreSQL
  - Drizzle ORM
  - AWS RDS (Production)

- **DevOps:**
  - Docker
  - Docker Compose
  - Traefik (Reverse Proxy & SSL)
  - AWS EC2 & ALB
  - AWS Route 53

## 📁 Project Structure

- `client/`: Frontend React application with Vite
- `server/`: Backend Express server
- `shared/`: Shared types and schemas (Drizzle models)
- `scripts/`: Database scripts for seeding and migrations

## 🌟 Features

- **Multi-role user system:** Administrators, Customers, Talent Providers
- **Comprehensive dashboards** tailored for each user type
- **Event management** with sophisticated booking system
- **Talent profiles** with portfolios and services
- **Review and rating system** for service quality assessment
- **Responsive design** for mobile and desktop
- **PostgreSQL database** for robust data persistence
- **AWS RDS integration** for production environments

## 🔧 Running Locally on Ubuntu

### Prerequisites

- Node.js 20.x (`sudo apt install nodejs npm`)
- PostgreSQL database (`sudo apt install postgresql postgresql-contrib`)
- npm or yarn (`sudo npm install -g yarn`)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vega-show
   ```

2. Install dependencies:
   ```bash
   npm install
   cd shared && npm install && cd ..
   ```

3. Set up the environment:
   ```bash
   # Create the environment files in the environments directory
   mkdir -p environments
   
   # Create environment file for local development
   nano environments/.local.env
   ```

4. Configure the database:
   ```bash
   # Create a PostgreSQL database
   sudo -u postgres createdb vegashow
   
   # Or use AWS RDS by setting the connection parameters in .env:
   # DATABASE_URL=postgres://username:password@host:port/database
   # AWS_RDS_HOST=your-host.region.rds.amazonaws.com
   # AWS_RDS_PORT=5432
   # AWS_RDS_DATABASE=your_database
   # AWS_RDS_USERNAME=your_username
   # AWS_RDS_PASSWORD=your_password
   ```

5. Run the database migrations:
   ```bash
   npm run db:push
   ```

6. Start the application:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

7. Access the application at http://localhost:5000

## 🐳 Running with Docker

### Prerequisites

- Docker (`sudo apt install docker.io`)
- Docker Compose (`sudo apt install docker-compose`)

### Using Docker Compose in Different Environments

The application supports multiple environment configurations with separate Docker Compose files:

#### Local Development Environment

Uses local PostgreSQL database for development:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vega-show
   ```

2. Set up the local environment:
   ```bash
   # Create the environments directory
   mkdir -p environments
   
   # Create local environment file
   nano environments/.local.env
   ```

3. Run the start script for local environment:
   ```bash
   ./start-local.sh
   ```

4. Or run Docker Compose manually:
   ```bash
   # Load local environment variables
   node load-env.js local
   
   # Build and start the containers
   docker-compose -f docker-compose.yml up -d
   
   # View logs
   docker-compose -f docker-compose.yml logs -f
   ```

#### Development Environment with AWS RDS

Uses AWS RDS database for development staging:

1. Set up the development environment:
   ```bash
   # Create the environments directory
   mkdir -p environments
   
   # Create development environment file
   nano environments/.dev.env
   ```

2. Run the start script for development environment:
   ```bash
   ./start-dev.sh
   ```

3. Or run Docker Compose manually:
   ```bash
   # Load development environment variables
   node load-env.js dev
   
   # Build and start the containers
   docker-compose -f docker-compose.dev.yml up -d
   
   # View logs
   docker-compose -f docker-compose.dev.yml logs -f
   ```

#### Production Environment with AWS RDS

Uses AWS RDS database for production with optimized settings:

1. Set up the production environment:
   ```bash
   # Create the environments directory
   mkdir -p environments
   
   # Create production environment file
   nano environments/.prod.env
   ```

2. Run the start script for production environment:
   ```bash
   ./start-prod.sh
   ```

3. Or build and deploy manually:
   ```bash
   # Build the production Docker image
   ./build-prod.sh
   
   # Load production environment variables
   node load-env.js prod
   
   # Deploy with production Docker Compose
   docker-compose -f docker-compose.prod.yml up -d
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

4. Access the application at http://localhost:5000 or http://yourdomain.com if configured with Traefik

### Using Dockerfile Directly

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vega-show
   ```

2. Build the Docker image:
   ```bash
   docker build -t vega-show .
   ```

3. Run the container:
   ```bash
   docker run -p 5000:5000 \
     -e DATABASE_URL="postgres://username:password@host:port/database" \
     -e AWS_RDS_HOST="your-host.region.rds.amazonaws.com" \
     -e AWS_RDS_PORT="5432" \
     -e AWS_RDS_DATABASE="your_database" \
     -e AWS_RDS_USERNAME="your_username" \
     -e AWS_RDS_PASSWORD="your_password" \
     -e SESSION_SECRET="your_secret" \
     -d vega-show
   ```

4. Access the application at http://localhost:5000

## 🔑 Login Credentials

The application is pre-configured with the following test accounts:

### Admin User
- Username: admin
- Password: adminpassword

### Customer Users
- Username: customer1, customer2, customer3
- Password: password123

### Talent Provider Users
- Username: dj_beats, photo_pro, dance_crew, magic_show
- Password: password123

## ⚙️ Environment Configuration

The application supports multiple environment configurations with separate environment files in the `environments` directory:

### Environment File Types

- `environments/.local.env` - Local development environment
- `environments/.dev.env` - Development/staging environment with AWS RDS
- `environments/.prod.env` - Production environment with AWS RDS

### Environment Variables

Each environment file should contain the following variables:

```
# Database Configuration
DATABASE_URL=postgres://username:password@host:port/database
AWS_RDS_HOST=your-host.region.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=your_database
AWS_RDS_USERNAME=your_username
AWS_RDS_PASSWORD=your_password

# Application Configuration
PORT=5000
NODE_ENV=development|production
SESSION_SECRET=your_secret_key
```

### Environment Loading

The application includes a helper script to load the correct environment variables:

```bash
# Load local environment
node load-env.js local

# Load development environment
node load-env.js dev

# Load production environment
node load-env.js prod
```

This is automatically handled by the environment-specific start scripts:
- `start-local.sh` - Loads environments/.local.env
- `start-dev.sh` - Loads environments/.dev.env
- `start-prod.sh` - Loads environments/.prod.env

## 🔍 Troubleshooting

- **Server won't start:**
  - Check if port 5000 is available
  - Verify that the PostgreSQL service is running
  - Ensure environment variables are correctly set

- **Database connection issues:**
  - Verify the database credentials in your environment files
  - Check if the database server is accessible from your environment
  - For AWS RDS, ensure your network allows the connection
  - Check security groups in AWS to allow traffic from your application

- **Docker issues:**
  - Check Docker logs: `docker logs <container_id>`
  - Verify Docker environment variables are passed correctly
  - Ensure no conflicting containers are using the same ports

## 🐋 Docker Compose Files

The application includes multiple Docker Compose files for different environments:

### `docker-compose.yml` (Local Development)

- Basic configuration for local development
- Uses local PostgreSQL container
- Maps source files directly for hot-reloading
- Sets up minimal container networking
- Optimized for development speed and iteration

### `docker-compose.dev.yml` (Development/Staging)

- Connects to AWS RDS development database
- Includes enhanced logging for debugging
- Sets up development-specific environment variables
- Adds health checks for services
- Better suited for team testing and QA

### `docker-compose.prod.yml` (Production)

- Connects to AWS RDS production database
- Implements Traefik reverse proxy with SSL
- Includes proper restart policies and health checks
- Sets production-specific environment variables
- Optimized for performance and reliability
- Configures automatic backup mechanisms
- Minimizes container privileges for security

### Comparison of Docker Compose Configurations

| Feature | Local | Development | Production |
|---------|-------|-------------|------------|
| Database | Local PostgreSQL | AWS RDS Dev | AWS RDS Prod |
| SSL Support | No | Optional | Yes (Traefik) |
| Hot Reloading | Yes | No | No |
| Health Checks | Basic | Enhanced | Comprehensive |
| Auto-Restart | No | Yes | Yes (always) |
| Logging | Verbose | Structured | Optimized |
| Volume Mounts | Source Code | Built Assets | Built Assets |
| Environment | environments/.local.env | environments/.dev.env | environments/.prod.env |

## 🚀 Deploying to AWS

The application is designed to be deployed on AWS infrastructure, particularly EC2 instances with RDS database support.

### Prerequisites for AWS Deployment

- AWS account with appropriate permissions
- EC2 instance (recommended: t3.medium or larger)
- AWS RDS PostgreSQL instance (recommended: db.t3.small or larger)
- AWS Route 53 for domain management (optional)
- AWS ALB for load balancing (optional for multi-container setup)

### AWS Deployment Steps

1. **Setup RDS Database:**
   - Create an RDS PostgreSQL instance
   - Configure VPC security groups to allow connections from EC2
   - Note the endpoint, port, username, password, and database name

2. **Prepare EC2 Instance:**
   - Launch an EC2 instance with Amazon Linux 2 or Ubuntu
   - Install Docker and Docker Compose:
     ```bash
     sudo yum update -y
     sudo amazon-linux-extras install docker
     sudo service docker start
     sudo usermod -a -G docker ec2-user
     sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
     sudo chmod +x /usr/local/bin/docker-compose
     ```

3. **Deploy Application:**
   - Clone the repository on the EC2 instance
   - Create environments directory: `mkdir -p environments`
   - Create production environment file: `nano environments/.prod.env` with the RDS database credentials
   - Run the production deployment script:
     ```bash
     ./start-prod.sh
     ```

4. **Configure Domain (Optional):**
   - Use Route 53 to create an A record pointing to your EC2 instance
   - Update Traefik configuration in `docker-compose.prod.yml` with your domain

5. **Setup SSL with Traefik (Optional):**
   - Ensure Traefik is configured to generate SSL certificates
   - Update Traefik labels in `docker-compose.prod.yml`

For detailed AWS deployment instructions, see the `AWS_DEPLOYMENT_GUIDE.md` in the repository.