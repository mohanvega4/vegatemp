# AWS EC2 Deployment Guide for Vega Show

This guide provides step-by-step instructions for deploying the Vega Show application on an AWS EC2 instance using Docker Compose with SSL support via AWS Certificate Manager and Application Load Balancer.

## Prerequisites

1. AWS Account with appropriate permissions
2. Registered domain (vegashow.ai) in AWS Route 53
3. AWS Certificate Manager certificate for your domain
4. EC2 instance (recommended: t3.medium or better)
5. RDS PostgreSQL database instance

## Step 1: Set Up AWS Resources

### Create EC2 Instance

1. Launch a new EC2 instance:
   - Select Amazon Linux 2 or Ubuntu Server 20.04/22.04
   - Choose t3.medium or larger (depending on expected load)
   - Configure at least 20GB of SSD storage
   - Configure security group to allow:
     - SSH (port 22) from your IP
     - HTTP (port 80) from anywhere
     - HTTPS (port 443) from anywhere

2. Create or select an existing key pair for SSH access

### Set Up Application Load Balancer

1. Create an Application Load Balancer (ALB):
   - Name it `vega-show-alb`
   - Configure both HTTP (80) and HTTPS (443) listeners
   - Select your VPC and subnets
   - Configure security group to allow HTTP and HTTPS traffic

2. Create a target group:
   - Protocol: HTTP
   - Port: 5000 (the port your application runs on)
   - Register your EC2 instance

3. Configure SSL certificate:
   - Request or select an existing certificate from AWS Certificate Manager
   - Attach it to the HTTPS listener

4. Configure HTTP to HTTPS redirection in the ALB

### Configure DNS in Route 53

1. Create A records for your domain:
   - `vegashow.ai` pointing to the ALB
   - `www.vegashow.ai` pointing to the ALB

## Step 2: Prepare EC2 Instance

1. Connect to your EC2 instance via SSH:
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

2. Update the system and install Docker:
   ```bash
   # On Amazon Linux 2
   sudo yum update -y
   sudo amazon-linux-extras install docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -a -G docker ec2-user
   
   # OR on Ubuntu
   sudo apt update
   sudo apt install -y docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -a -G docker ubuntu
   ```

3. Install Docker Compose:
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   docker-compose --version
   ```

4. Create application directory:
   ```bash
   mkdir -p ~/vega-show
   cd ~/vega-show
   ```

## Step 3: Deploy Application

1. Clone the repository:
   ```bash
   git clone <repository-url> .
   ```

2. Create environment variables file:
   ```bash
   cat > .env << EOL
   # Database Configuration
   DATABASE_URL=postgres://username:password@your-rds-instance-endpoint:5432/vegashow
   AWS_RDS_HOST=your-rds-instance-endpoint
   AWS_RDS_PORT=5432
   AWS_RDS_DATABASE=vegashow
   AWS_RDS_USERNAME=your-username
   AWS_RDS_PASSWORD=your-password
   
   # Application Configuration
   NODE_ENV=production
   PORT=5000
   SESSION_SECRET=your-secure-session-secret
   EOL
   ```

3. Update Traefik configuration:
   ```bash
   # Update email in traefik.yml
   sed -i 's/your-email@example.com/your-actual-email@example.com/' traefik/traefik.yml
   
   # Ensure acme.json has correct permissions
   chmod 600 traefik/acme.json
   ```

4. Build and start the application:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. Check if the containers are running:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

6. View logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

## Step 4: Set Up Automatic Deployment (Optional)

To enable automatic deployment when changes are pushed to your repository:

1. Install and configure a CI/CD tool like GitHub Actions or AWS CodePipeline

2. Create a deployment script:
   ```bash
   cat > ~/deploy.sh << 'EOL'
   #!/bin/bash
   
   cd ~/vega-show
   git pull
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml build --no-cache
   docker-compose -f docker-compose.prod.yml up -d
   EOL
   
   chmod +x ~/deploy.sh
   ```

3. Set up a webhook or trigger to run this script when changes are pushed

## Step 5: Set Up Monitoring and Maintenance

1. Set up AWS CloudWatch for monitoring:
   ```bash
   # Install CloudWatch agent
   sudo amazon-linux-extras install -y collectd
   sudo amazon-linux-extras install -y awscwagent
   sudo amazon-linux-extras install -y amazon-cloudwatch-agent
   
   # Configure the agent (basic example)
   cat > ~/cloudwatch-config.json << EOL
   {
     "metrics": {
       "append_dimensions": {
         "InstanceId": "${aws:InstanceId}"
       },
       "metrics_collected": {
         "mem": {
           "measurement": ["mem_used_percent"]
         },
         "disk": {
           "measurement": ["disk_used_percent"],
           "resources": ["/"]
         }
       }
     }
   }
   EOL
   
   # Start the CloudWatch agent
   sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:~/cloudwatch-config.json -s
   ```

2. Set up automated backups:
   ```bash
   # Create a backup script
   cat > ~/backup.sh << 'EOL'
   #!/bin/bash
   
   # Backup logs
   timestamp=$(date +%Y%m%d_%H%M%S)
   tar -czf ~/backups/logs_$timestamp.tar.gz ~/vega-show/logs
   
   # Upload to S3
   aws s3 cp ~/backups/logs_$timestamp.tar.gz s3://your-backup-bucket/vega-show/logs/
   
   # Keep only the last 7 days of backups locally
   find ~/backups -name "logs_*.tar.gz" -type f -mtime +7 -delete
   EOL
   
   chmod +x ~/backup.sh
   
   # Add to crontab to run daily
   (crontab -l 2>/dev/null; echo "0 2 * * * ~/backup.sh") | crontab -
   ```

## Alternative Deployment: Using AWS Certificate Manager with Traefik

If you prefer to use AWS Certificate Manager certificates directly with Traefik instead of an ALB:

1. Export your certificate from AWS Certificate Manager (including private key and certificate chain)

2. Convert to the appropriate format for Traefik

3. Update the Traefik configuration to use the certificate files

## Troubleshooting

### Application Not Accessible

1. Check if Docker containers are running:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. Check application logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs app
   ```

3. Check Traefik logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs traefik
   ```

4. Verify security groups allow traffic on required ports

5. Check that Route 53 DNS records are correctly configured

### Database Connection Issues

1. Verify RDS security group allows connections from the EC2 instance

2. Check database credentials in the .env file

3. Test database connection directly:
   ```bash
   docker exec -it vegashow_app /bin/bash -c "nc -zv $AWS_RDS_HOST $AWS_RDS_PORT"
   ```

### SSL Certificate Issues

1. If using Let's Encrypt with Traefik, check certificate status:
   ```bash
   docker exec -it traefik /bin/sh -c "cat /acme.json"
   ```

2. If using AWS Certificate Manager with ALB, verify the certificate is properly attached to the HTTPS listener

## Maintenance Tasks

### Updating the Application

```bash
cd ~/vega-show
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Updating Docker or Docker Compose

```bash
# Docker
sudo yum update -y docker

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Monitoring Disk Space

```bash
df -h
```

### Viewing Docker Resource Usage

```bash
docker stats
```