# Deploy a Node.js App on Ubuntu

A complete walkthrough to take a fresh Ubuntu VPS or EC2 server to a secure, monitored, backed-up Node.js app behind Nginx with HTTPS.

![Deployed Node.js app on an Ubuntu server](server-setup.svg)

The setup: a fresh Ubuntu 24.04 (or 22.04) server with a public IP, a domain `app.example.com` pointing to it, and a Node.js app in a Git repo that listens on port 3000 and uses PostgreSQL.

## Step 1: First Login and Updates

```bash
ssh root@203.0.113.10          # on EC2: ssh -i key.pem ubuntu@203.0.113.10
apt-get update && apt-get upgrade -y
timedatectl set-timezone Asia/Kolkata    # or keep UTC on servers
```

## Step 2: Create a Sudo User and Lock Down SSH

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # copy authorized_keys
```

Edit `/etc/ssh/sshd_config` (or a file in `/etc/ssh/sshd_config.d/`):

```ini
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Run `sudo sshd -t && sudo systemctl reload ssh`, then test `ssh deploy@203.0.113.10` in a second terminal before closing the root session. Details: [users and sudo](../07_System_Administration/users-and-groups.md).

## Step 3: Firewall with ufw

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"      # 80 + 443; needs nginx installed (else: 80,443/tcp)
sudo ufw enable
```

On EC2, also open 22/80/443 in the Security Group.

## Step 4: Install the Runtime

Native: install Node.js LTS and PostgreSQL as in [install dev tools](install-dev-tools.md). Containers: install Docker as shown in [install Docker](install-docker.md) and use the Compose file there.

## Step 5: Get the Code

```bash
sudo mkdir -p /srv/myapp && sudo chown deploy:deploy /srv/myapp
git clone https://github.com/you/myapp.git /srv/myapp
cd /srv/myapp && npm ci --omit=dev
sudo install -m 600 /dev/null /etc/myapp.env      # empty secrets file, root-only
echo 'DATABASE_URL=postgres://app:secret@127.0.0.1:5432/app' | sudo tee /etc/myapp.env > /dev/null
```

## Step 6: Run the App

### Option A: systemd

`/etc/systemd/system/myapp.service`:

```ini
[Unit]
Description=My Node.js app
After=network.target postgresql.service

[Service]
User=deploy
WorkingDirectory=/srv/myapp
EnvironmentFile=/etc/myapp.env
Environment=NODE_ENV=production PORT=3000
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now myapp
journalctl -u myapp -f           # logs go to journald
```

### Option B: Docker Compose

Run `docker compose up -d` in `/srv/myapp`. Publish the app as `127.0.0.1:3000:3000` so only Nginx can reach it (Docker port rules bypass ufw).

## Step 7: Nginx Reverse Proxy and HTTPS

Set up the `server` block with `proxy_pass http://127.0.0.1:3000;` as in [install Nginx](install-nginx.md), then:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com
sudo certbot renew --dry-run          # renewal runs from a systemd timer
```

## Step 8: Automatic Security Updates

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades    # writes /etc/apt/apt.conf.d/20auto-upgrades
```

## Step 9: Log Rotation

journald limits its own size (`SystemMaxUse=` in `/etc/systemd/journald.conf`). For file logs, add `/etc/logrotate.d/myapp`:

```ini
/var/log/myapp/*.log {
    daily
    rotate 14
    compress
    missingok
    copytruncate
}
```

## Step 10: Nightly Backup with cron

`/usr/local/bin/backup-myapp.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
DEST=/backups
STAMP=$(date +%F_%H%M)
mkdir -p "$DEST"
pg_dump -h 127.0.0.1 -U app app | gzip > "$DEST/db_$STAMP.sql.gz"
tar -czf "$DEST/files_$STAMP.tar.gz" -C /srv/myapp uploads
find "$DEST" -type f -mtime +7 -delete      # keep 7 days
```

```bash
sudo chmod 700 /usr/local/bin/backup-myapp.sh
sudo crontab -e    # add: 30 2 * * * /usr/local/bin/backup-myapp.sh >> /var/log/backup-myapp.log 2>&1
```

Put the DB password in `/root/.pgpass` (mode 600), copy backups off the server, and test a restore. See [cron](../03_Processes/scheduling.md).

## Step 11: Monitoring Basics

Check `uptime`, `free -h`, `df -h`, `systemctl --failed` and `sudo ss -tulpn` (only 22, 80 and 443 should be public). Add an external uptime check on `https://app.example.com/health` and alerts for disk above 80%. More in [monitoring and security](../07_System_Administration/monitoring-and-security.md).

## Go-Live Checklist

| Check | Command / proof |
| :--- | :--- |
| Root and password SSH disabled | `sudo sshd -T \| grep -E 'permitroot\|passwordauth'` |
| Firewall active | `sudo ufw status` |
| App restarts on reboot | `sudo reboot`, then `systemctl is-active myapp` |
| HTTPS valid, HTTP redirects | `curl -I http://app.example.com` returns 301 |
| DB not public | `ss -tulpn` shows `127.0.0.1:5432` |
| Backups run and restore | file in `/backups`, test restore done |

## Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| `502 Bad Gateway` | App is down or on another port: `systemctl status myapp`, `curl localhost:3000` |
| Locked out after SSH change | Use the cloud console; always test in a second session first |
| certbot fails | DNS must point to the server and port 80 must be open |

## Interview Questions

**Q1. Why put Nginx in front of Node.js?**
It terminates TLS, serves static files, buffers slow clients, and lets the app run as a non-root user on a high port.

**Q2. What does `Restart=on-failure` do?**
systemd restarts the service if it exits with an error or is killed by a signal, after `RestartSec`.

**Q3. Why can Docker-published ports bypass ufw?**
Docker writes its own iptables rules in chains evaluated before ufw's, so bind to `127.0.0.1` for internal services.

**Q4. How do you make sure backups are useful?**
Keep them off the server, apply retention, monitor that the job ran, and regularly test a restore.
