# Production Deployment Guide

## Architecture Overview

This application is designed for **horizontal scaling** across multiple server instances using:

- **Socket.IO Redis Adapter** - Cross-server WebSocket broadcasting
- **Kafka** - Message queue for reliable delivery
- **Redis** - Distributed presence tracking & leader election
- **PostgreSQL** - Primary database
- **Load Balancer** - Traffic distribution with sticky sessions

```
┌─────────────────┐
│  Load Balancer  │
│ (Sticky Sessions)│
└────────┬─────────┘
         │
┌────────┼────────────────┐
│        │                │
┌───▼────┐  ┌────▼────┐  ┌────▼────┐
│Server 1│  │Server 2 │  │Server 3 │
└───┬────┘  └────┬────┘  └────┬────┘
    │            │            │
    └────────┬───┴────────────┘
             │
    ┌────────▼────────┐
    │  Redis Cluster  │
    │  (Pub/Sub +     │
    │   Presence)     │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Kafka Cluster   │
    │ (Message Queue) │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │   PostgreSQL    │
    │  (Primary DB)   │
    └─────────────────┘
```

## 1. Load Balancer Configuration

### Nginx Example (Sticky Sessions)

```nginx
upstream backend_servers {
    # IP hash ensures same client goes to same server
    ip_hash;
    
    server server1.example.com:5000;
    server server2.example.com:5000;
    server server3.example.com:5000;
}

server {
    listen 80;
    server_name api.example.com;

    # Health check endpoint
    location /health {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # Health check specific settings
        proxy_connect_timeout 2s;
        proxy_read_timeout 2s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # API routes
    location / {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### AWS Application Load Balancer (ALB)

```yaml
# Target Group Configuration
TargetGroup:
  Protocol: HTTP
  Port: 5000
  HealthCheck:
    Path: /health
    Interval: 30
    Timeout: 5
    HealthyThreshold: 2
    UnhealthyThreshold: 3
  
  # Enable sticky sessions
  Stickiness:
    Enabled: true
    Type: lb_cookie
    DurationSeconds: 86400  # 24 hours

# Listener Rules
Listener:
  Protocol: HTTP
  Port: 80
  DefaultActions:
    - Type: forward
      TargetGroupArn: !Ref TargetGroup
```

### HAProxy Example

```haproxy
frontend http_front
    bind *:80
    default_backend backend_servers

backend backend_servers
    balance roundrobin
    
    # Sticky sessions using cookie
    cookie SERVERID insert indirect nocache
    
    # Health checks
    option httpchk GET /health
    http-check expect status 200
    
    server server1 server1.example.com:5000 check cookie server1
    server server2 server2.example.com:5000 check cookie server2
    server server3 server3.example.com:5000 check cookie server3
```

## 2. Environment Configuration

### Server 1 (.env)
```env
SERVER_ID=server-1
PORT=5000
DATABASE_URL=postgresql://user:pass@db-cluster.example.com:5432/quibly
REDIS_STRING=redis-cluster.example.com
REDIS_PORT_NO=6379
REDIS_PASSWORD=your_redis_password
KAFKA_BROKERS=kafka1.example.com:9092,kafka2.example.com:9092,kafka3.example.com:9092
FRONTEND_URL=https://app.example.com
```

### Server 2 (.env)
```env
SERVER_ID=server-2
PORT=5000
# ... same as Server 1 except SERVER_ID
```

### Server 3 (.env)
```env
SERVER_ID=server-3
PORT=5000
# ... same as Server 1 except SERVER_ID
```

## 3. Redis Configuration

### Managed Redis (Recommended)

**AWS ElastiCache:**
```bash
# Cluster mode enabled for high availability
REDIS_STRING=clustercfg.my-cluster.abc123.use1.cache.amazonaws.com
REDIS_PORT_NO=6379
REDIS_PASSWORD=your_password
```

**Redis Cloud:**
```bash
REDIS_STRING=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT_NO=12345
REDIS_PASSWORD=your_password
```

### Self-Hosted Redis Cluster

```bash
# redis.conf
bind 0.0.0.0
protected-mode yes
requirepass your_redis_password
maxmemory 2gb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000
```

## 4. Kafka Configuration

### Managed Kafka (Recommended)

**Confluent Cloud:**
```env
KAFKA_BROKERS=pkc-abc123.us-east-1.aws.confluent.cloud:9092
KAFKA_USERNAME=your_api_key
KAFKA_PASSWORD=your_api_secret
```

**AWS MSK:**
```env
KAFKA_BROKERS=b-1.mycluster.abc123.kafka.us-east-1.amazonaws.com:9092,b-2.mycluster.abc123.kafka.us-east-1.amazonaws.com:9092
```

### Self-Hosted Kafka Cluster

```properties
# server.properties
broker.id=1
listeners=PLAINTEXT://0.0.0.0:9092
advertised.listeners=PLAINTEXT://kafka1.example.com:9092
zookeeper.connect=zk1.example.com:2181,zk2.example.com:2181,zk3.example.com:2181

# Replication
default.replication.factor=3
min.insync.replicas=2
```

## 5. Database Configuration

### PostgreSQL High Availability

**AWS RDS:**
```env
DATABASE_URL=postgresql://admin:password@my-cluster.cluster-abc123.us-east-1.rds.amazonaws.com:5432/quibly
```

**Connection Pooling (PgBouncer):**
```ini
[databases]
quibly = host=postgres-primary.example.com port=5432 dbname=quibly

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

## 6. Monitoring & Health Checks

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T12:00:00.000Z",
  "serverId": "server-1",
  "uptime": 86400,
  "services": {
    "redis": true,
    "kafka": true,
    "database": true,
    "socketio": true
  },
  "batchWriterLeader": true
}
```

### Monitoring Endpoints

- `GET /health` - Overall health status
- `GET /metrics` - Prometheus metrics (if implemented)

### Recommended Monitoring

1. **Application Metrics:**
   - WebSocket connections per server
   - Message throughput (messages/sec)
   - Kafka lag (consumer group lag)
   - Redis memory usage
   - Database connection pool usage

2. **Infrastructure Metrics:**
   - CPU usage per server
   - Memory usage per server
   - Network I/O
   - Disk I/O

3. **Alerts:**
   - Health check failures
   - Redis connection failures
   - Kafka consumer lag > 1000
   - Database connection pool exhaustion
   - High error rates

## 7. Deployment Process

### Zero-Downtime Deployment

```bash
# 1. Deploy to Server 1
ssh server1
git pull
npm install
pm2 reload app

# Wait for health check to pass
curl http://server1:5000/health

# 2. Deploy to Server 2
ssh server2
git pull
npm install
pm2 reload app

# Wait for health check to pass
curl http://server2:5000/health

# 3. Deploy to Server 3
ssh server3
git pull
npm install
pm2 reload app
```

### Using PM2 Ecosystem

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'discord-backend',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      SERVER_ID: process.env.SERVER_ID
    },
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

## 8. Scaling Guidelines

### When to Scale Horizontally

- CPU usage consistently > 70%
- WebSocket connections > 10,000 per server
- Message latency > 100ms
- Redis memory usage > 80%

### Scaling Steps

1. **Add new server instance:**
   ```bash
   # Set unique SERVER_ID
   export SERVER_ID=server-4
   npm start
   ```

2. **Register with load balancer:**
   ```bash
   # Nginx
   vim /etc/nginx/nginx.conf
   # Add: server server4.example.com:5000;
   nginx -s reload
   ```

3. **Verify health:**
   ```bash
   curl http://server4:5000/health
   ```

4. **Monitor metrics:**
   - Check Redis adapter is working
   - Verify messages reach all servers
   - Monitor Kafka consumer lag

## 9. Troubleshooting

### Messages not reaching all servers

**Check Redis adapter:**
```bash
# On each server
curl http://localhost:5000/health | jq '.services.redis'
# Should return: true
```

**Check Socket.IO logs:**
```bash
# Should see: "Socket.IO Redis adapter enabled"
pm2 logs discord-backend | grep "Redis adapter"
```

### Batch writer running on multiple servers

**Check leader election:**
```bash
# On each server
curl http://localhost:5000/health | jq '.batchWriterLeader'
# Only ONE server should return: true
```

### WebSocket disconnections

**Check sticky sessions:**
```bash
# Test with curl
curl -H "Cookie: SERVERID=server1" http://api.example.com/health
# Should always hit same server
```

## 10. Cost Optimization

### Development Environment
- Single server
- Local Redis (Docker)
- Local Kafka (Docker)
- Local PostgreSQL (Docker)

**Estimated Cost:** $0/month (local only)

### Small Production (< 1000 users)
- 2 servers (t3.small)
- AWS ElastiCache (cache.t3.micro)
- AWS MSK (kafka.t3.small x2)
- AWS RDS (db.t3.small)

**Estimated Cost:** ~$200/month

### Medium Production (< 10,000 users)
- 3-5 servers (t3.medium)
- AWS ElastiCache (cache.r6g.large)
- AWS MSK (kafka.m5.large x3)
- AWS RDS (db.r6g.large)

**Estimated Cost:** ~$800/month

### Large Production (> 10,000 users)
- 10+ servers (c6i.xlarge)
- AWS ElastiCache Cluster (cache.r6g.xlarge x3)
- AWS MSK (kafka.m5.2xlarge x3)
- AWS RDS Aurora (db.r6g.2xlarge)

**Estimated Cost:** ~$3,000+/month

## 11. Security Checklist

- [ ] Enable Redis authentication (REDIS_PASSWORD)
- [ ] Use TLS for Redis connections
- [ ] Enable Kafka SASL authentication
- [ ] Use TLS for Kafka connections
- [ ] Enable PostgreSQL SSL
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules (only allow load balancer → servers)
- [ ] Use environment variables (never commit secrets)
- [ ] Enable audit logging
- [ ] Set up intrusion detection
- [ ] Regular security updates

## 12. Backup & Disaster Recovery

### Database Backups
```bash
# Automated daily backups
pg_dump -h db.example.com -U admin quibly > backup_$(date +%Y%m%d).sql

# Restore
psql -h db.example.com -U admin quibly < backup_20260207.sql
```

### Redis Backups
```bash
# RDB snapshots (automatic)
save 900 1
save 300 10

# Manual backup
redis-cli --rdb /backup/dump.rdb
```

### Kafka Backups
- Enable topic replication (factor >= 3)
- Use MirrorMaker for cross-region replication
- Regular snapshots of Zookeeper data

## Support

For issues or questions:
- GitHub Issues: [your-repo]/issues
- Documentation: [your-docs-url]
- Email: support@example.com
