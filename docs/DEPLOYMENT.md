# POLAR-EMS Deployment Guide

## Document Information

| Field | Value |
|-------|--------|
| **Document Title** | POLAR-EMS Deployment Guide |
| **Version** | 1.0 |
| **Date** | August 23, 2026 |
| **Project** | AI-Driven Smart Energy Management System for Polar Research Stations |
| **Domain** | Polar Smart Grid Energy Management |
| **Organization** | MoES – NCPOR |
| **Related Documents** | [PRD.md](./PRD.md), [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md), [TEST_PLAN.md](./TEST_PLAN.md) |

---

## 1. Deployment Overview

### 1.1 Deployment Philosophy
POLAR-EMS deployment strategy prioritizes reliability, offline operation capability, and ease of maintenance in remote polar environments. The system is designed for edge deployment with minimal external dependencies and comprehensive local redundancy.

### 1.2 Deployment Environments

#### Development Environment
- **Purpose**: Local development and unit testing
- **Infrastructure**: Developer workstations, Docker containers
- **Characteristics**: Rapid iteration, synthetic data, mocked external services

#### Staging Environment
- **Purpose**: Integration testing, user acceptance testing, training
- **Infrastructure**: Cloud-based or local test servers
- **Characteristics**: Production-like configuration, realistic data, full feature testing

#### Production Environment
- **Purpose**: Live polar research station operations
- **Infrastructure**: On-site edge computing hardware, satellite communication
- **Characteristics**: High reliability, offline-first operation, redundant systems

### 1.3 Key Deployment Principles

#### Offline-First Architecture
System must operate autonomously for extended periods without external connectivity, with automatic synchronization when communication resumes.

#### Edge Computing Focus
Primary processing occurs locally at the polar station to minimize latency and dependency on unreliable communications.

#### Containerized Deployment
All services deployed as Docker containers for consistency across environments and simplified maintenance.

#### Infrastructure as Code
All deployment configurations managed through version-controlled infrastructure definitions.

---

## 2. System Requirements

### 2.1 Hardware Requirements

#### Minimum System Specifications (Development/Testing)
```yaml
CPU: 4 cores, 2.4 GHz (Intel i5 or AMD Ryzen 5)
RAM: 16 GB DDR4
Storage: 
  - System: 256 GB SSD
  - Data: 1 TB HDD
Network: Gigabit Ethernet, Wi-Fi
Ports: 4x USB 3.0, 2x Serial (RS-485)
Operating Temperature: 0°C to +40°C
Power: <150W consumption
```

#### Recommended Production Specifications (Polar Station)
```yaml
CPU: 8 cores, 3.0 GHz (Intel i7 or AMD Ryzen 7)
RAM: 32 GB DDR4 ECC
Storage:
  - System: 512 GB NVMe SSD (RAID 1)
  - Data: 4 TB Enterprise HDD (RAID 1)
  - Backup: 2 TB External HDD
Network: Dual Gigabit Ethernet, Wi-Fi, Satellite modem
Ports: 8x USB 3.0, 4x Serial (RS-485), 8x Ethernet
I/O: Industrial I/O cards for equipment integration
UPS: 6+ hour battery backup system
Operating Temperature: -40°C to +70°C (ruggedized)
Power: <300W consumption
Enclosure: IP65-rated, EMI shielded
```

### 2.2 Software Requirements

#### Operating System
- **Primary**: Ubuntu Server 22.04 LTS (x86_64)
- **Alternative**: CentOS Stream 9, Rocky Linux 9
- **Container Runtime**: Docker Engine 24.0+
- **Orchestration**: Docker Compose 2.20+

#### System Dependencies
```bash
# Core system packages
sudo apt update && sudo apt install -y \
  curl \
  wget \
  git \
  htop \
  unzip \
  build-essential \
  python3 \
  python3-pip \
  nodejs \
  npm \
  postgresql-client \
  redis-tools \
  nginx \
  fail2ban \
  ufw \
  ntp \
  logrotate \
  rsync
```

#### Docker and Container Requirements
```bash
# Docker installation
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installation
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# User permissions
sudo usermod -aG docker $USER
```

---

## 3. Local Development Setup

### 3.1 Development Environment Setup

#### Prerequisites Installation
```bash
# Clone repository
git clone https://github.com/your-org/polar-ems.git
cd polar-ems

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install Node.js dependencies
cd frontend
npm install
cd ..

# Setup environment variables
cp .env.example .env
# Edit .env with development configuration
```

#### Environment Variables (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://polar:dev_password@localhost:5432/polar_ems_dev
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production
ENCRYPTION_KEY=dev-encryption-key-32-characters

# External Services
WEATHER_API_KEY=your-weather-api-key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Application Settings
DEBUG=true
LOG_LEVEL=DEBUG
ENVIRONMENT=development

# Equipment Simulation (Development Only)
SIMULATE_EQUIPMENT=true
EQUIPMENT_CONFIG_PATH=./config/equipment-dev.yml
```

### 3.2 Development Services

#### Docker Compose for Development
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL with TimescaleDB
  postgres:
    image: timescale/timescaledb:latest-pg14
    environment:
      POSTGRES_DB: polar_ems_dev
      POSTGRES_USER: polar
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    command: ["postgres", "-c", "log_statement=all"]

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    command: redis-server --appendonly yes

  # Equipment Simulator
  equipment-sim:
    build: ./equipment-simulator
    ports:
      - "502:502"   # Modbus TCP
      - "8080:8080" # Web interface
    environment:
      - SIMULATION_MODE=development
    volumes:
      - ./config/equipment-dev.yml:/app/config.yml

volumes:
  postgres_dev_data:
  redis_dev_data:
```

#### Starting Development Environment
```bash
# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
python manage.py migrate

# Create development superuser
python manage.py createsuperuser

# Start backend development server
python manage.py runserver 0.0.0.0:8000

# In another terminal, start frontend development server
cd frontend
npm run dev
```

### 3.3 Development Workflow

#### Code Quality Checks
```bash
# Python code formatting and linting
black src/
isort src/
flake8 src/
mypy src/

# JavaScript/TypeScript formatting and linting
cd frontend
npm run lint
npm run format
npm run type-check

# Run tests
pytest
npm run test
```

#### Git Hooks (pre-commit)
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/isort
    rev: 5.10.1
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 4.0.1
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.15.0
    hooks:
      - id: eslint
        files: \.(js|jsx|ts|tsx)$
        additional_dependencies:
          - eslint@8.15.0
          - '@typescript-eslint/parser@5.25.0'
```

---

## 4. Staging Environment Deployment

### 4.1 Staging Infrastructure

#### Cloud-Based Staging (AWS/Azure/GCP)
```yaml
# staging-infrastructure.yml (Terraform/CloudFormation)
Resources:
  # Compute Instance
  StagingInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.large
      ImageId: ami-0c02fb55956c7d316  # Ubuntu 22.04 LTS
      SecurityGroupIds:
        - !Ref StagingSecurityGroup
      KeyName: !Ref KeyPair
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          apt update && apt upgrade -y
          curl -fsSL https://get.docker.com | sh
          usermod -aG docker ubuntu

  # Security Group
  StagingSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: POLAR-EMS Staging Security Group
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # Restrict in production
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  # Database (RDS)
  StagingDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '14.7'
      MasterUsername: polar
      MasterUserPassword: !Ref DatabasePassword
      DBName: polar_ems_staging
      AllocatedStorage: 20
      StorageType: gp2
```

### 4.2 Staging Deployment Configuration

#### Docker Compose for Staging
```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/staging.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.staging
    environment:
      - REACT_APP_API_URL=https://staging-api.polar-ems.example.com
      - REACT_APP_WS_URL=wss://staging-api.polar-ems.example.com
      - REACT_APP_ENVIRONMENT=staging
    volumes:
      - frontend_build:/app/build
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${STAGING_DATABASE_URL}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${STAGING_SECRET_KEY}
      - ENVIRONMENT=staging
      - LOG_LEVEL=INFO
    depends_on:
      - redis
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped

  # AI/ML Processing Service
  ai-service:
    build:
      context: ./ai
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${STAGING_DATABASE_URL}
      - MODEL_PATH=/app/models
      - ENVIRONMENT=staging
    volumes:
      - ./models:/app/models
      - ./data:/app/data
    depends_on:
      - backend
    restart: unless-stopped

  # Data Collection Service  
  data-collector:
    build:
      context: ./collector
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${STAGING_DATABASE_URL}
      - EQUIPMENT_CONFIG=/app/config/staging-equipment.yml
    volumes:
      - ./config:/app/config
      - ./data:/app/data
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    volumes:
      - redis_staging_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    restart: unless-stopped

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  frontend_build:
  redis_staging_data:
  prometheus_data:
  grafana_data:
```

### 4.3 Staging Deployment Process

#### Automated Staging Deployment
```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "Starting POLAR-EMS Staging Deployment..."

# Environment setup
export ENVIRONMENT=staging
source .env.staging

# Pre-deployment checks
echo "Running pre-deployment checks..."
./scripts/check-prerequisites.sh staging

# Build and deploy
echo "Building application images..."
docker-compose -f docker-compose.staging.yml build

echo "Stopping existing services..."
docker-compose -f docker-compose.staging.yml down

echo "Starting new deployment..."
docker-compose -f docker-compose.staging.yml up -d

# Database migration
echo "Running database migrations..."
docker-compose -f docker-compose.staging.yml exec backend python manage.py migrate

# Health checks
echo "Performing health checks..."
./scripts/health-check.sh staging

# Smoke tests
echo "Running smoke tests..."
./scripts/smoke-tests.sh staging

echo "Staging deployment completed successfully!"
```

#### Staging Environment Variables
```bash
# .env.staging
DATABASE_URL=postgresql://polar:${DB_PASSWORD}@staging-db.internal:5432/polar_ems_staging
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0

SECRET_KEY=${STAGING_SECRET_KEY}
JWT_SECRET_KEY=${STAGING_JWT_SECRET}
ENCRYPTION_KEY=${STAGING_ENCRYPTION_KEY}

WEATHER_API_KEY=${STAGING_WEATHER_API_KEY}
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=INFO

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

# SSL/TLS
SSL_CERT_PATH=/etc/nginx/ssl/staging.crt
SSL_KEY_PATH=/etc/nginx/ssl/staging.key
```

---

## 5. Production Environment Deployment

### 5.1 Production Infrastructure Requirements

#### On-Site Hardware Configuration
```yaml
Primary System:
  CPU: Intel Xeon or AMD EPYC (8+ cores, 3.0+ GHz)
  RAM: 64 GB DDR4 ECC
  Storage:
    - Boot: 1 TB NVMe SSD (RAID 1)
    - Data: 8 TB Enterprise HDD (RAID 1)
    - Backup: 4 TB External HDD
  Network: Dual Gigabit Ethernet (redundant)
  UPS: 8+ hour battery backup
  Environmental: -40°C to +70°C operation

Secondary System (Failover):
  CPU: Intel i7 or AMD Ryzen 7 (8 cores, 3.0+ GHz)
  RAM: 32 GB DDR4 ECC
  Storage:
    - Boot: 512 GB NVMe SSD
    - Data: 4 TB Enterprise HDD
  Network: Gigabit Ethernet
  UPS: 6+ hour battery backup
  Purpose: Hot standby, backup operations
```

#### Network Architecture
```
┌─────────────────────────────────────────┐
│              Polar Station              │
│  ┌───────────────┐  ┌─────────────────┐ │
│  │ Primary System│  │Secondary System │ │
│  │   POLAR-EMS   │  │   (Standby)     │ │
│  └───────┬───────┘  └─────────────────┘ │
│          │                              │
│  ┌───────┴───────┐                      │
│  │ Local Network │                      │
│  │   Switch      │                      │
│  └───────┬───────┘                      │
│          │                              │
│  ┌───────┴───────┐                      │
│  │  Equipment    │                      │
│  │ (Generators,  │                      │
│  │ Batteries,    │                      │
│  │ Wind, etc.)   │                      │
│  └───────────────┘                      │
└─────────────┬───────────────────────────┘
              │
     ┌────────┴────────┐
     │ Satellite Modem │
     └────────┬────────┘
              │
         ┌────┴───┐
         │Internet│
         └────────┘
```

### 5.2 Production Deployment Configuration

#### Docker Compose for Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Load Balancer / Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/production.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - /var/log/nginx:/var/log/nginx
    depends_on:
      - backend
      - frontend
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=${PROD_DATABASE_URL}
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${PROD_SECRET_KEY}
      - ENVIRONMENT=production
      - LOG_LEVEL=WARNING
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
      - ./backup:/app/backup
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  # PostgreSQL Database with TimescaleDB
  postgres:
    image: timescale/timescaledb:latest-pg14
    environment:
      - POSTGRES_DB=polar_ems_prod
      - POSTGRES_USER=polar
      - POSTGRES_PASSWORD=${PROD_DB_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
      - ./backup/db:/backup
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Redis Cache and Session Store
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${PROD_REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # AI/ML Processing Service
  ai-service:
    build:
      context: ./ai
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=${PROD_DATABASE_URL}
      - MODEL_PATH=/app/models
      - ENVIRONMENT=production
    volumes:
      - ./models:/app/models
      - ./data:/app/data
    depends_on:
      - postgres
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # Data Collection Service
  data-collector:
    build:
      context: ./collector
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=${PROD_DATABASE_URL}
      - EQUIPMENT_CONFIG=/app/config/production-equipment.yml
    volumes:
      - ./config:/app/config
      - ./data:/app/data
      - ./logs:/app/logs
    privileged: true  # For hardware access
    restart: always
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  # System Monitoring
  prometheus:
    image: prom/prometheus:latest
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./monitoring/prometheus-prod.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: always

  # Metrics Visualization
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${PROD_GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_DOMAIN=polar-ems.local
    ports:
      - "127.0.0.1:3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards
    restart: always

  # Automated Backups
  backup-service:
    build:
      context: ./backup
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${PROD_DATABASE_URL}
      - BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
      - RETENTION_DAYS=30
    volumes:
      - ./backup:/backup
      - postgres_prod_data:/var/lib/postgresql/data:ro
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_prod_data:
  redis_prod_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```
### 5.3 Production Environment Variables

#### Production Environment Configuration (.env.production)
```bash
# Database Configuration
DATABASE_URL=postgresql://polar:${PROD_DB_PASSWORD}@postgres:5432/polar_ems_prod
REDIS_URL=redis://:${PROD_REDIS_PASSWORD}@redis:6379/0

# Security (Use strong, unique values in production)
SECRET_KEY=${PROD_SECRET_KEY}
JWT_SECRET_KEY=${PROD_JWT_SECRET}
ENCRYPTION_KEY=${PROD_ENCRYPTION_KEY}

# External Services
WEATHER_API_KEY=${PROD_WEATHER_API_KEY}
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Application Settings
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
ALLOWED_HOSTS=polar-ems.local,localhost,127.0.0.1

# Equipment Integration
EQUIPMENT_CONFIG_PATH=/app/config/production-equipment.yml
MODBUS_TIMEOUT=5
OPC_UA_TIMEOUT=10

# Backup and Monitoring
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=${PROD_GRAFANA_PASSWORD}

# SSL/TLS Configuration
SSL_CERT_PATH=/etc/nginx/ssl/production.crt
SSL_KEY_PATH=/etc/nginx/ssl/production.key
FORCE_HTTPS=true

# Communication Settings
SATELLITE_MODEM_ENABLED=true
OFFLINE_MODE_TIMEOUT=300  # 5 minutes
SYNC_INTERVAL=3600        # 1 hour when online
```

### 5.4 Production Deployment Process

#### Automated Production Deployment Script
```bash
#!/bin/bash
# deploy-production.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== POLAR-EMS Production Deployment ==="
echo "Deployment started at: $(date)"

# Load environment variables
if [ -f "$PROJECT_DIR/.env.production" ]; then
    source "$PROJECT_DIR/.env.production"
else
    echo "Error: .env.production file not found"
    exit 1
fi

# Pre-deployment verification
echo "Step 1: Pre-deployment verification..."
./scripts/pre-deployment-check.sh production

# Create backup of current system
echo "Step 2: Creating system backup..."
./scripts/backup-system.sh

# Build production images
echo "Step 3: Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Deploy new version
echo "Step 4: Deploying new version..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Database migration
echo "Step 5: Running database migrations..."
sleep 30  # Wait for database to be ready
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# Health checks
echo "Step 6: Performing health checks..."
./scripts/health-check.sh production

# Post-deployment tests
echo "Step 7: Running post-deployment tests..."
./scripts/smoke-tests.sh production

# Update monitoring dashboards
echo "Step 8: Updating monitoring configuration..."
docker-compose -f docker-compose.prod.yml exec -T grafana \
    curl -X POST http://admin:${PROD_GRAFANA_PASSWORD}@localhost:3000/api/dashboards/import \
    -H "Content-Type: application/json" \
    -d @/etc/grafana/provisioning/dashboards/polar-ems-dashboard.json

echo "=== Production Deployment Completed Successfully ==="
echo "Deployment finished at: $(date)"
```
---

## 6. Security and Hardening

### 6.1 System Security Configuration

#### Operating System Hardening
```bash
#!/bin/bash
# system-hardening.sh

echo "Applying system security hardening..."

# Update system packages
apt update && apt upgrade -y

# Configure firewall (UFW)
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow from 192.168.1.0/24 to any port 22  # Local SSH only
ufw --force enable

# Disable unused services
systemctl disable avahi-daemon
systemctl disable cups
systemctl disable bluetooth

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Set up automatic security updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
systemctl enable unattended-upgrades

# Configure log rotation
cat > /etc/logrotate.d/polar-ems << EOF
/opt/polar-ems/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 polar polar
    postrotate
        docker-compose -f /opt/polar-ems/docker-compose.prod.yml kill -s USR1 backend
    endscript
}
EOF

echo "System hardening completed."
```

#### SSL/TLS Configuration
```nginx
# nginx/production.conf
server {
    listen 80;
    server_name polar-ems.local;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name polar-ems.local;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/production.crt;
    ssl_certificate_key /etc/nginx/ssl/production.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Application Routes
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for long operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /ws/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.2 Application Security

#### Docker Security Configuration
```yaml
# Security-focused Docker configuration
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    user: "1000:1000"  # Non-root user
    read_only: true
    tmpfs:
      - /tmp
    volumes:
      - ./logs:/app/logs:rw
      - ./data:/app/data:rw
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    restart: always
```

#### Application Security Headers
```python
# backend/security_middleware.py
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware

def configure_security(app: FastAPI):
    # Trusted hosts
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["polar-ems.local", "localhost", "127.0.0.1"]
    )
    
    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://polar-ems.local"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    
    # Security headers middleware
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response
```

---

## 7. Monitoring and Logging

### 7.1 System Monitoring Configuration

#### Prometheus Configuration
```yaml
# monitoring/prometheus-prod.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'polar-ems-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'polar-ems-database'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Alert Rules Configuration
```yaml
# monitoring/alert_rules.yml
groups:
- name: polar-ems-alerts
  rules:
  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is above 80% for more than 2 minutes"

  - alert: DatabaseDown
    expr: up{job="polar-ems-database"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database is down"
      description: "PostgreSQL database is not responding"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High memory usage"
      description: "Memory usage is above 90%"

  - alert: DiskSpaceLow
    expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Low disk space"
      description: "Available disk space is below 10%"
```
### 7.2 Centralized Logging

#### Logging Configuration
```yaml
# docker-compose logging configuration
version: '3.8'

x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
    labels: "service,version"

services:
  backend:
    logging: *default-logging
    labels:
      - "service=backend"
      - "version=1.0"

  # Log aggregation with Loki (optional for advanced setups)
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki-config.yaml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - ./logs:/app/logs:ro
      - ./monitoring/promtail-config.yaml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
```

#### Application Logging Setup
```python
# backend/logging_config.py
import logging
import sys
from pathlib import Path
from pythonjsonlogger import jsonlogger

def setup_logging(log_level: str = "INFO", log_dir: str = "/app/logs"):
    """Configure application logging"""
    
    log_dir_path = Path(log_dir)
    log_dir_path.mkdir(exist_ok=True)
    
    # Create formatters
    json_formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler for all logs
    file_handler = logging.FileHandler(log_dir_path / "polar_ems.log")
    file_handler.setFormatter(json_formatter)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.FileHandler(log_dir_path / "errors.log")
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(json_formatter)
    root_logger.addHandler(error_handler)
    
    # Security audit logger
    security_logger = logging.getLogger('security')
    security_handler = logging.FileHandler(log_dir_path / "security.log")
    security_handler.setFormatter(json_formatter)
    security_logger.addHandler(security_handler)
    security_logger.setLevel(logging.INFO)
    security_logger.propagate = False
    
    return root_logger
```

---

## 8. Backup and Disaster Recovery

### 8.1 Automated Backup System

#### Database Backup Script
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

BACKUP_DIR="/backup/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Starting database backup..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
    -U polar \
    -h localhost \
    -d polar_ems_prod \
    --no-password \
    --format=custom \
    --verbose > "$BACKUP_DIR/polar_ems_${DATE}.backup"

# Compress backup
gzip "$BACKUP_DIR/polar_ems_${DATE}.backup"

# Remove old backups
find "$BACKUP_DIR" -name "*.backup.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
echo "Verifying backup integrity..."
gunzip -t "$BACKUP_DIR/polar_ems_${DATE}.backup.gz"

# Log backup completion
echo "Database backup completed: polar_ems_${DATE}.backup.gz"
logger "POLAR-EMS: Database backup completed successfully"
```

#### System Backup Configuration
```bash
#!/bin/bash
# scripts/backup-system.sh

set -e

BACKUP_ROOT="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
SYSTEM_BACKUP_DIR="$BACKUP_ROOT/system/$DATE"

# Create backup directories
mkdir -p "$SYSTEM_BACKUP_DIR"/{config,data,logs,models}

echo "Starting system backup..."

# Backup configuration files
rsync -av --exclude='*.log' /opt/polar-ems/config/ "$SYSTEM_BACKUP_DIR/config/"
rsync -av /opt/polar-ems/.env.production "$SYSTEM_BACKUP_DIR/"
rsync -av /opt/polar-ems/docker-compose.prod.yml "$SYSTEM_BACKUP_DIR/"

# Backup application data
rsync -av /opt/polar-ems/data/ "$SYSTEM_BACKUP_DIR/data/"

# Backup AI models
rsync -av /opt/polar-ems/models/ "$SYSTEM_BACKUP_DIR/models/"

# Backup recent logs (last 7 days)
find /opt/polar-ems/logs -name "*.log" -mtime -7 -exec cp {} "$SYSTEM_BACKUP_DIR/logs/" \;

# Create archive
cd "$BACKUP_ROOT/system"
tar -czf "system_backup_${DATE}.tar.gz" "$DATE"
rm -rf "$DATE"

# Remove old system backups (keep 7 days)
find "$BACKUP_ROOT/system" -name "system_backup_*.tar.gz" -mtime +7 -delete

echo "System backup completed: system_backup_${DATE}.tar.gz"
```

### 8.2 Disaster Recovery Procedures

#### System Recovery Script
```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

echo "=== POLAR-EMS Disaster Recovery ==="
echo "This script will restore the system from backup"
echo "WARNING: This will overwrite current system state"

read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Recovery cancelled"
    exit 1
fi

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    echo "Available backups:"
    ls /backup/system/system_backup_*.tar.gz | sed 's/.*system_backup_\(.*\).tar.gz/\1/'
    exit 1
fi

BACKUP_FILE="/backup/system/system_backup_${BACKUP_DATE}.tar.gz"
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Stop services
echo "Stopping POLAR-EMS services..."
docker-compose -f /opt/polar-ems/docker-compose.prod.yml down

# Extract backup
echo "Extracting backup..."
cd /backup/system
tar -xzf "system_backup_${BACKUP_DATE}.tar.gz"

# Restore configuration
echo "Restoring configuration..."
cp -r "${BACKUP_DATE}/config/*" /opt/polar-ems/config/
cp "${BACKUP_DATE}/.env.production" /opt/polar-ems/
cp "${BACKUP_DATE}/docker-compose.prod.yml" /opt/polar-ems/

# Restore data
echo "Restoring application data..."
rm -rf /opt/polar-ems/data/*
cp -r "${BACKUP_DATE}/data/*" /opt/polar-ems/data/

# Restore AI models
echo "Restoring AI models..."
rm -rf /opt/polar-ems/models/*
cp -r "${BACKUP_DATE}/models/*" /opt/polar-ems/models/

# Restore database
echo "Restoring database..."
DB_BACKUP_FILE="/backup/database/polar_ems_${BACKUP_DATE}.backup.gz"
if [ -f "$DB_BACKUP_FILE" ]; then
    gunzip -c "$DB_BACKUP_FILE" | docker-compose -f /opt/polar-ems/docker-compose.prod.yml \
        exec -T postgres pg_restore -U polar -d polar_ems_prod --clean --if-exists
else
    echo "Warning: Database backup for $BACKUP_DATE not found"
fi

# Restart services
echo "Starting POLAR-EMS services..."
cd /opt/polar-ems
docker-compose -f docker-compose.prod.yml up -d

# Health check
echo "Performing health check..."
sleep 30
./scripts/health-check.sh production

echo "=== Recovery completed ==="
```

---

## 9. Health Checks and Monitoring

### 9.1 Health Check Scripts

#### Application Health Check
```bash
#!/bin/bash
# scripts/health-check.sh

ENVIRONMENT=${1:-production}
BASE_URL="https://polar-ems.local"

if [ "$ENVIRONMENT" = "development" ]; then
    BASE_URL="http://localhost:8000"
elif [ "$ENVIRONMENT" = "staging" ]; then
    BASE_URL="https://staging.polar-ems.example.com"
fi

echo "Performing health checks for $ENVIRONMENT environment..."

# Check web service
echo -n "Checking web service... "
if curl -sf "$BASE_URL/health" > /dev/null; then
    echo "✓ OK"
else
    echo "✗ FAILED"
    exit 1
fi

# Check API service
echo -n "Checking API service... "
if curl -sf "$BASE_URL/api/health" > /dev/null; then
    echo "✓ OK"
else
    echo "✗ FAILED"
    exit 1
fi

# Check database connectivity
echo -n "Checking database... "
if docker-compose -f docker-compose.prod.yml exec -T backend python -c "
from sqlalchemy import create_engine
import os
engine = create_engine(os.environ['DATABASE_URL'])
conn = engine.connect()
conn.close()
print('OK')
" 2>/dev/null; then
    echo "✓ OK"
else
    echo "✗ FAILED"
    exit 1
fi

# Check Redis connectivity
echo -n "Checking Redis... "
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG; then
    echo "✓ OK"
else
    echo "✗ FAILED"
    exit 1
fi

# Check disk space
echo -n "Checking disk space... "
DISK_USAGE=$(df /opt/polar-ems | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✓ OK ($DISK_USAGE% used)"
else
    echo "✗ WARNING (${DISK_USAGE}% used)"
fi

echo "Health check completed successfully"
```

### 9.2 Automated Monitoring Alerts

#### Email Alert Configuration
```python
# monitoring/alert_notifications.py
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import os

class AlertNotificationSystem:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'localhost')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.alert_recipients = os.getenv('ALERT_RECIPIENTS', '').split(',')
    
    def send_alert(self, alert_type: str, message: str, severity: str = 'WARNING'):
        """Send alert notification via email"""
        
        subject = f"POLAR-EMS Alert [{severity}]: {alert_type}"
        
        msg = MimeMultipart()
        msg['From'] = self.smtp_username
        msg['To'] = ', '.join(self.alert_recipients)
        msg['Subject'] = subject
        
        body = f"""
        POLAR-EMS System Alert
        
        Alert Type: {alert_type}
        Severity: {severity}
        Timestamp: {datetime.utcnow().isoformat()}
        
        Details:
        {message}
        
        Please check the system status and take appropriate action.
        
        --
        POLAR-EMS Monitoring System
        """
        
        msg.attach(MimeText(body, 'plain'))
        
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"Alert sent successfully: {subject}")
        except Exception as e:
            print(f"Failed to send alert: {e}")
```

---

## 10. Troubleshooting Guide

### 10.1 Common Issues and Solutions

#### Service Won't Start
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs postgres

# Common solutions:
# 1. Check environment variables
# 2. Verify database connectivity
# 3. Check disk space
# 4. Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U polar

# Reset database connection
docker-compose -f docker-compose.prod.yml restart postgres backend

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### Performance Issues
```bash
# Check system resources
htop
df -h
iostat -x 1

# Check container resource usage
docker stats

# Analyze slow queries
docker-compose -f docker-compose.prod.yml exec postgres \
    psql -U polar -d polar_ems_prod \
    -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### 10.2 Emergency Procedures

#### Emergency System Shutdown
```bash
#!/bin/bash
# Emergency shutdown procedure

echo "EMERGENCY SHUTDOWN INITIATED"

# Stop all POLAR-EMS services
docker-compose -f /opt/polar-ems/docker-compose.prod.yml down

# Create emergency backup
./scripts/backup-system.sh

# Log emergency shutdown
logger "POLAR-EMS: Emergency shutdown completed at $(date)"

echo "System shutdown completed. Check logs for details."
```

#### Emergency Recovery Mode
```bash
#!/bin/bash
# Start system in emergency recovery mode

echo "Starting POLAR-EMS in recovery mode..."

# Start only essential services
docker-compose -f /opt/polar-ems/docker-compose.prod.yml up -d postgres redis

# Wait for database
sleep 10

# Start backend in safe mode
docker-compose -f /opt/polar-ems/docker-compose.prod.yml run --rm \
    -e SAFE_MODE=true \
    backend python manage.py check

echo "Recovery mode active. Manual intervention required."
```

---

## 11. Production Checklist

### 11.1 Pre-Deployment Checklist

#### Security Verification
- [ ] All default passwords changed to strong, unique values
- [ ] SSL/TLS certificates installed and configured
- [ ] Firewall rules configured and tested
- [ ] Security updates applied to operating system
- [ ] Application security headers configured
- [ ] Database access restricted to application only
- [ ] Backup encryption enabled and tested
- [ ] Security monitoring and alerting configured

#### System Configuration
- [ ] Hardware requirements met or exceeded
- [ ] Operating system hardened according to security guidelines
- [ ] Network configuration verified (static IP, DNS, routing)
- [ ] Time synchronization (NTP) configured
- [ ] Log rotation configured
- [ ] Monitoring system deployed and configured
- [ ] Backup system tested and verified
- [ ] Disaster recovery procedures documented and tested

#### Application Deployment
- [ ] Environment variables configured and secured
- [ ] Database migrations completed successfully
- [ ] AI models trained and deployed
- [ ] Equipment integration tested
- [ ] User accounts created with appropriate permissions
- [ ] Health checks passing
- [ ] Performance benchmarks met
- [ ] Documentation updated and accessible

### 11.2 Post-Deployment Checklist

#### Verification Tests
- [ ] All system functions tested and verified
- [ ] User authentication and authorization working
- [ ] Real-time data collection functioning
- [ ] AI forecasting generating accurate predictions
- [ ] Equipment control commands executing correctly
- [ ] Alert system generating appropriate notifications
- [ ] Backup system creating successful backups
- [ ] Monitoring dashboards displaying accurate data

#### Operational Readiness
- [ ] Operations team trained on system use
- [ ] Emergency procedures reviewed and practiced
- [ ] Support contacts and escalation procedures established
- [ ] Maintenance schedule defined and documented
- [ ] Performance baseline established
- [ ] Capacity planning completed
- [ ] Change management procedures implemented

---

*This comprehensive deployment guide provides the foundation for successful POLAR-EMS deployment across all environments, ensuring reliable, secure, and maintainable operations in polar research station environments.*