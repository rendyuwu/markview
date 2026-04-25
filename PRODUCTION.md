# Production Deployment

Deploy MarkView on a Linux VM with Docker Compose, native Nginx, and Cloudflare.

## Architecture

```
Cloudflare (DNS, SSL termination, WAF)
  └── Nginx (native, reverse proxy, rate limiting, CF-IP-only)
       └── Docker Compose
            ├── app  (Next.js on 127.0.0.1:3344)
            └── db   (PostgreSQL on 127.0.0.1:5432)
```

## Requirements

- Linux VM (Ubuntu 22+, Alma 9+, or similar)
- 1 vCPU / 1GB RAM minimum (2 vCPU / 2GB recommended)
- 20GB disk minimum
- Domain pointed to Cloudflare DNS

## 1. Server Setup

Run as root on a fresh VM:

```bash
bash deploy/setup-server.sh
```

This installs: Docker, Nginx, UFW/firewalld, fail2ban, automatic security updates. Creates a `deploy` user with Docker access.

## 2. Clone & Configure

```bash
su - deploy
git clone <repo-url> markview && cd markview
cp .env.production.example .env.production
```

Edit `.env.production`:

```env
DOMAIN="markview.yourdomain.com"
POSTGRES_USER=markview
POSTGRES_PASSWORD=<strong-random-password>
DATABASE_URL="postgresql://markview:<same-password>@db:5432/markview"
SESSION_SECRET=<openssl rand -hex 32>
ENABLE_REGISTER="false"
NEXT_PUBLIC_APP_NAME="MarkView"
NODE_ENV="production"
```

## 3. Cloudflare Setup

1. Add domain to Cloudflare, point A record to VM IP (proxied, orange cloud)
2. SSL/TLS → set mode to **Full (Strict)**
3. Origin Server → Create Certificate (RSA, 15 years)
4. Save cert and key on VM:

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/markview.yourdomain.com.pem  # paste cert
sudo nano /etc/ssl/cloudflare/markview.yourdomain.com.key  # paste key
sudo chmod 600 /etc/ssl/cloudflare/*.key
```

## 4. First Deploy

```bash
./deploy/scripts/deploy.sh --first-run
```

This builds containers, starts services, runs DB migrations, and renders Nginx config from template.

## 5. Nginx Setup

```bash
sudo cp deploy/nginx/markview.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/proxy-params.conf /etc/nginx/snippets/
sudo cp deploy/nginx/cloudflare-ips.conf /etc/nginx/snippets/
sudo ln -s /etc/nginx/sites-available/markview.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

For RHEL/Alma (no `sites-available`):

```bash
sudo cp deploy/nginx/markview.conf /etc/nginx/conf.d/
sudo cp deploy/nginx/proxy-params.conf /etc/nginx/snippets/
sudo cp deploy/nginx/cloudflare-ips.conf /etc/nginx/snippets/
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Create First User

```bash
# Temporarily enable registration
sed -i 's/ENABLE_REGISTER="false"/ENABLE_REGISTER="true"/' .env.production
docker compose -f docker-compose.prod.yml up -d app

# Visit https://markview.yourdomain.com/register and create account

# Disable registration
sed -i 's/ENABLE_REGISTER="true"/ENABLE_REGISTER="false"/' .env.production
docker compose -f docker-compose.prod.yml up -d app
```

## Subsequent Deploys

```bash
cd ~/markview
./deploy/scripts/deploy.sh
```

Pulls latest code, rebuilds containers, runs migrations. If Nginx config changed, script prints copy instructions.

## Cron Jobs

Add to `deploy` user's crontab (`crontab -e`):

```cron
# Daily DB backup at 2am, keep 7 days
0 2 * * * /home/deploy/markview/deploy/scripts/backup-db.sh

# Weekly Cloudflare IP update, Sunday 3am
0 3 * * 0 /home/deploy/markview/deploy/scripts/update-cloudflare-ips.sh
```

## Backups

Backups saved to `/var/backups/markview/` (configurable via `BACKUP_DIR`).

Restore:

```bash
gunzip < /var/backups/markview/markview_20260425_020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U markview markview
```

## Security Checklist

- [ ] Cloudflare SSL mode set to Full (Strict)
- [ ] Nginx only accepts Cloudflare IPs (`deny all` + CF allowlist)
- [ ] Firewall only opens ports 80, 443, SSH
- [ ] SSH uses key auth, password auth disabled
- [ ] fail2ban running on SSH
- [ ] Automatic security updates enabled
- [ ] `ENABLE_REGISTER=false` after account creation
- [ ] `SESSION_SECRET` is random 32+ char string
- [ ] PostgreSQL password is strong and unique
- [ ] DB backups running via cron
- [ ] Cloudflare IP list updating via cron
- [ ] Cloudflare WAF managed rulesets enabled (free tier)

## File Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Next.js build (deps → build → slim runtime) |
| `.dockerignore` | Excludes dev files from Docker build context |
| `docker-compose.prod.yml` | App + PostgreSQL services |
| `.env.production.example` | Production env var template |
| `deploy/nginx/markview.conf.template` | Nginx config template (`${DOMAIN}` substituted at deploy) |
| `deploy/nginx/proxy-params.conf` | Shared proxy header snippet |
| `deploy/nginx/cloudflare-ips.conf` | Cloudflare IP allowlist + real_ip config |
| `deploy/scripts/deploy.sh` | Build and deploy script |
| `deploy/scripts/backup-db.sh` | Database backup with rotation |
| `deploy/scripts/update-cloudflare-ips.sh` | Cloudflare IP range updater |
| `deploy/setup-server.sh` | Fresh server bootstrap |

## Troubleshooting

**App not responding:**
```bash
docker compose -f docker-compose.prod.yml logs app
docker compose -f docker-compose.prod.yml ps
```

**502 Bad Gateway:**
Check app container running on port 3344:
```bash
curl -I http://127.0.0.1:3344
```

**Database connection error:**
```bash
docker compose -f docker-compose.prod.yml logs db
docker compose -f docker-compose.prod.yml exec db pg_isready -U markview
```

**Nginx config error:**
```bash
sudo nginx -t
```

**SSL certificate issues:**
Verify cert files exist and Cloudflare SSL mode is Full (Strict):
```bash
ls -la /etc/ssl/cloudflare/
```
