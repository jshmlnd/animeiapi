#!/bin/bash
# Run this on your Oracle Cloud VM via SSH

# Install Docker
apt-get update
apt-get install -y docker.io docker-compose-plugin
systemctl enable docker
systemctl start docker

# Create flaresolverr directory
mkdir -p /opt/flaresolverr
cd /opt/flaresolverr

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:latest
    container_name: flaresolverr
    restart: unless-stopped
    ports:
      - "8191:8191"
    environment:
      - LOG_LEVEL=info
      - BROWSER_TIMEOUT=60000
EOF

# Start FlareSolverr
docker compose up -d

# Show status
docker compose ps
echo ""
echo "FlareSolverr is running at http://<YOUR_VM_IP>:8191"
echo "Test with: curl http://localhost:8191/"
