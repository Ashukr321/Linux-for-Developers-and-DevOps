# Ubuntu par Node.js App Deploy Karo

Naye Ubuntu VPS ya EC2 server ko Nginx aur HTTPS ke peeche chalne wale secure, monitored aur backed-up Node.js app tak le jaane ki poori walkthrough.

![Deployed Node.js app on an Ubuntu server](server-setup.svg)

Setup: ek naya Ubuntu 24.04 (ya 22.04) server jiska public IP hai, us par point karta domain `app.example.com`, aur Git repo mein ek Node.js app jo port 3000 par listen karta hai aur PostgreSQL use karta hai.

## Step 1: Pehla Login aur Updates

```bash
ssh root@203.0.113.10          # on EC2: ssh -i key.pem ubuntu@203.0.113.10
apt-get update && apt-get upgrade -y
timedatectl set-timezone Asia/Kolkata    # or keep UTC on servers
```

## Step 2: Sudo User Banao aur SSH Lock Karo

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # copy authorized_keys
```

`/etc/ssh/sshd_config` (ya `/etc/ssh/sshd_config.d/` mein koi file) edit karo:

```ini
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

`sudo sshd -t && sudo systemctl reload ssh` chalao, phir root session band karne se pehle doosre terminal mein `ssh deploy@203.0.113.10` test karo. Details: [users and sudo](../07_System_Administration/users-and-groups.md).

## Step 3: ufw se Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"      # 80 + 443; needs nginx installed (else: 80,443/tcp)
sudo ufw enable
```

EC2 par Security Group mein bhi 22/80/443 kholo.

## Step 4: Runtime Install Karo

Native: Node.js LTS aur PostgreSQL [install dev tools](install-dev-tools.md) ke hisaab se install karo. Containers: Docker [install Docker](install-docker.md) ke hisaab se install karo aur wahan ki Compose file use karo.

## Step 5: Code Lao

```bash
sudo mkdir -p /srv/myapp && sudo chown deploy:deploy /srv/myapp
git clone https://github.com/you/myapp.git /srv/myapp
cd /srv/myapp && npm ci --omit=dev
sudo install -m 600 /dev/null /etc/myapp.env      # empty secrets file, root-only
echo 'DATABASE_URL=postgres://app:secret@127.0.0.1:5432/app' | sudo tee /etc/myapp.env > /dev/null
```

## Step 6: App Chalao

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

`/srv/myapp` mein `docker compose up -d` chalao. App ko `127.0.0.1:3000:3000` ki tarah publish karo taaki sirf Nginx us tak pahunch sake (Docker ke port rules ufw ko bypass kar dete hain).

## Step 7: Nginx Reverse Proxy aur HTTPS

[install Nginx](install-nginx.md) ki tarah `proxy_pass http://127.0.0.1:3000;` wala `server` block banao, phir:

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

journald apna size khud limit rakhta hai (`/etc/systemd/journald.conf` mein `SystemMaxUse=`). File logs ke liye `/etc/logrotate.d/myapp` add karo:

```ini
/var/log/myapp/*.log {
    daily
    rotate 14
    compress
    missingok
    copytruncate
}
```

## Step 10: cron se Raat ka Backup

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

DB password ko `/root/.pgpass` (mode 600) mein rakho, backups ko server se bahar copy karo, aur restore test karo. Dekho [cron](../03_Processes/scheduling.md).

## Step 11: Monitoring Basics

`uptime`, `free -h`, `df -h`, `systemctl --failed` aur `sudo ss -tulpn` check karo (sirf 22, 80 aur 443 public hone chahiye). `https://app.example.com/health` par ek external uptime check aur disk 80% se upar jaane par alert lagao. Zyada info [monitoring and security](../07_System_Administration/monitoring-and-security.md) mein.

## Go-Live Checklist

| Check | Command / proof |
| :--- | :--- |
| Root aur password SSH band | `sudo sshd -T \| grep -E 'permitroot\|passwordauth'` |
| Firewall active | `sudo ufw status` |
| Reboot ke baad app wapas chalta hai | `sudo reboot`, phir `systemctl is-active myapp` |
| HTTPS valid, HTTP redirect hota hai | `curl -I http://app.example.com` 301 return karta hai |
| DB public nahi | `ss -tulpn` mein `127.0.0.1:5432` dikhta hai |
| Backups chalte hain aur restore hote hain | `/backups` mein file, restore test ho chuka |

## Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| `502 Bad Gateway` | App down hai ya doosre port par hai: `systemctl status myapp`, `curl localhost:3000` |
| SSH change ke baad lock out | Cloud console use karo; hamesha pehle doosre session mein test karo |
| certbot fail hota hai | DNS server ki taraf point hona chahiye aur port 80 open hona chahiye |

## Interview Questions

**Q1. Node.js ke aage Nginx kyun rakhein?**
Ye TLS terminate karta hai, static files serve karta hai, slow clients ko buffer karta hai, aur app ko high port par non-root user ki tarah chalne deta hai.

**Q2. `Restart=on-failure` kya karta hai?**
Agar service error ke saath exit ho ya kisi signal se kill ho jaaye, to systemd `RestartSec` ke baad use dobara start karta hai.

**Q3. Docker ke published ports ufw ko bypass kyun kar sakte hain?**
Docker apne iptables rules aisi chains mein likhta hai jo ufw se pehle evaluate hoti hain, isliye internal services ko `127.0.0.1` par bind karo.

**Q4. Kaise pakka karein ki backups sach mein kaam ke hain?**
Unhe server se bahar rakho, retention lagao, job chala ya nahi uski monitoring karo, aur regularly restore test karo.
