# Ubuntu पर Node.js App Deploy करें

नए Ubuntu VPS या EC2 server को Nginx और HTTPS के पीछे चलने वाले सुरक्षित, monitored और backed-up Node.js app तक ले जाने की पूरी walkthrough।

![Deployed Node.js app on an Ubuntu server](server-setup.svg)

Setup: एक नया Ubuntu 24.04 (या 22.04) server जिसका public IP है, उस पर point करता domain `app.example.com`, और Git repo में एक Node.js app जो port 3000 पर listen करता है और PostgreSQL इस्तेमाल करता है।

## Step 1: पहला Login और Updates

```bash
ssh root@203.0.113.10          # on EC2: ssh -i key.pem ubuntu@203.0.113.10
apt-get update && apt-get upgrade -y
timedatectl set-timezone Asia/Kolkata    # or keep UTC on servers
```

## Step 2: Sudo User बनाएँ और SSH को Lock करें

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # copy authorized_keys
```

`/etc/ssh/sshd_config` (या `/etc/ssh/sshd_config.d/` में कोई file) edit करें:

```ini
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

`sudo sshd -t && sudo systemctl reload ssh` चलाएँ, फिर root session बंद करने से पहले दूसरे terminal में `ssh deploy@203.0.113.10` test करें। विस्तार: [users and sudo](../07_System_Administration/users-and-groups.md)।

## Step 3: ufw से Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"      # 80 + 443; needs nginx installed (else: 80,443/tcp)
sudo ufw enable
```

EC2 पर Security Group में भी 22/80/443 खोलें।

## Step 4: Runtime इंस्टॉल करें

Native: Node.js LTS और PostgreSQL [install dev tools](install-dev-tools.md) के अनुसार इंस्टॉल करें। Containers: Docker [install Docker](install-docker.md) के अनुसार इंस्टॉल करें और वहाँ की Compose file इस्तेमाल करें।

## Step 5: Code लाएँ

```bash
sudo mkdir -p /srv/myapp && sudo chown deploy:deploy /srv/myapp
git clone https://github.com/you/myapp.git /srv/myapp
cd /srv/myapp && npm ci --omit=dev
sudo install -m 600 /dev/null /etc/myapp.env      # empty secrets file, root-only
echo 'DATABASE_URL=postgres://app:secret@127.0.0.1:5432/app' | sudo tee /etc/myapp.env > /dev/null
```

## Step 6: App चलाएँ

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

`/srv/myapp` में `docker compose up -d` चलाएँ। App को `127.0.0.1:3000:3000` के रूप में publish करें ताकि सिर्फ़ Nginx उस तक पहुँच सके (Docker के port rules ufw को bypass कर देते हैं)।

## Step 7: Nginx Reverse Proxy और HTTPS

[install Nginx](install-nginx.md) की तरह `proxy_pass http://127.0.0.1:3000;` वाला `server` block बनाएँ, फिर:

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

journald अपना size खुद सीमित रखता है (`/etc/systemd/journald.conf` में `SystemMaxUse=`)। File logs के लिए `/etc/logrotate.d/myapp` जोड़ें:

```ini
/var/log/myapp/*.log {
    daily
    rotate 14
    compress
    missingok
    copytruncate
}
```

## Step 10: cron से रात का Backup

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

DB password को `/root/.pgpass` (mode 600) में रखें, backups को server से बाहर copy करें, और restore test करें। देखें [cron](../03_Processes/scheduling.md)।

## Step 11: Monitoring की बुनियाद

`uptime`, `free -h`, `df -h`, `systemctl --failed` और `sudo ss -tulpn` देखें (सिर्फ़ 22, 80 और 443 public होने चाहिए)। `https://app.example.com/health` पर एक external uptime check और disk 80% से ऊपर जाने पर alert लगाएँ। और जानकारी [monitoring and security](../07_System_Administration/monitoring-and-security.md) में।

## Go-Live Checklist

| जाँच | Command / सबूत |
| :--- | :--- |
| Root और password SSH बंद | `sudo sshd -T \| grep -E 'permitroot\|passwordauth'` |
| Firewall चालू | `sudo ufw status` |
| Reboot के बाद app फिर चलता है | `sudo reboot`, फिर `systemctl is-active myapp` |
| HTTPS valid, HTTP redirect होता है | `curl -I http://app.example.com` 301 लौटाता है |
| DB public नहीं | `ss -tulpn` में `127.0.0.1:5432` दिखता है |
| Backups चलते हैं और restore होते हैं | `/backups` में file, restore test हो चुका |

## Troubleshooting

| लक्षण | समाधान |
| :--- | :--- |
| `502 Bad Gateway` | App बंद है या दूसरे port पर है: `systemctl status myapp`, `curl localhost:3000` |
| SSH बदलाव के बाद lock out | Cloud console इस्तेमाल करें; हमेशा पहले दूसरे session में test करें |
| certbot fail होता है | DNS server की ओर point होना चाहिए और port 80 खुला होना चाहिए |

## Interview Questions

**Q1. Node.js के आगे Nginx क्यों रखें?**
यह TLS terminate करता है, static files serve करता है, धीमे clients को buffer करता है, और app को high port पर non-root user के रूप में चलने देता है।

**Q2. `Restart=on-failure` क्या करता है?**
अगर service error के साथ exit हो या किसी signal से kill हो जाए, तो systemd `RestartSec` के बाद उसे फिर से शुरू करता है।

**Q3. Docker के published ports ufw को bypass क्यों कर सकते हैं?**
Docker अपने iptables rules ऐसी chains में लिखता है जो ufw से पहले evaluate होती हैं, इसलिए internal services को `127.0.0.1` पर bind करें।

**Q4. Backups सच में काम के हैं, यह कैसे पक्का करें?**
उन्हें server से बाहर रखें, retention लागू करें, job चला या नहीं इसकी monitoring करें, और नियमित रूप से restore test करें।
