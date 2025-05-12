FROM node:20-slim

# Set the working directory
WORKDIR /app

# Install PostgreSQL client and additional tools
RUN apt-get update && apt-get install -y \
    postgresql-client \
    wget \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Set build arguments
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/

# Install dependencies (including dev dependencies)
RUN npm install --include=dev
RUN cd shared && npm install --include=dev

# Copy the rest of the application
COPY . .

# Build shared library
RUN cd shared && npm run build

# Build the application if in production mode
RUN if [ "$NODE_ENV" = "production" ]; then \
    npm run build; \
    fi

# Create logs directory
RUN mkdir -p logs

# Expose port 5000
EXPOSE 5000

# The actual command will be provided by docker-compose based on environment
CMD ["npm", "run", "dev"]