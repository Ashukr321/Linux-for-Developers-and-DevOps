# Production mein Unix/Linux

Web servers, cloud VMs, Docker, cron aur CI/CD mein Linux ka use, senior engineers ke liye zaroori skills aur ek production cheat sheet.

## 1. Executive Overview: Unix/Linux Internet Ko Kyun Chalata Hai

Unix aur Unix-like operating systems (jaise Ubuntu, Debian, RHEL, Amazon Linux, Alpine) global cloud infrastructure aur production servers ki foundation hain. Top 1 million web servers mein se 90% se zyada aur top 500 supercomputers mein se 100% Linux/Unix kernels par chalte hain.

---

## 2. Cloud aur Infrastructure mein Production Use Cases

### 🌐 A. Web Servers aur Reverse Proxies (Nginx aur Apache)
- **Nginx Process Management**: Nginx natively ek Unix daemon (`systemd`) ki tarah chalta hai aur non-blocking asynchronous requests ke liye Unix event-driven architectures (Linux par `epoll`, BSD par `kqueue`) ka use karta hai.
- **Production Commands**:
  - `systemctl status nginx` / `systemctl restart nginx` — Server process ki state manage karein.
  - `tail -f /var/log/nginx/error.log` — Production error logs ko live stream karein.
  - `nginx -t` — Production traffic reload karne se pehle configuration syntax test karein.

### ☁️ B. Cloud Virtual Machines (AWS EC2 / GCP Compute / Azure VMs)
- **EC2 Instance Provisioning**: Cloud instances (jaise AWS EC2 `t3.micro` ya `c6i.xlarge`) Unix-based OS distributions (Amazon Linux 2023, Ubuntu Server) chalate hain.
- **SSH Access aur Authentication**: Secure shell protocol (`ssh -i key.pem ubuntu@ec2-ip`) remote administration ke liye Unix public-private key cryptography (`chmod 400 key.pem`) use karta hai.
- **Environment Variables**: Production secrets (`.env`, `AWS_ACCESS_KEY`) Unix environment variables (`export KEY=VALUE`) aur `systemd` service files ke through manage hote hain.

### 🐳 C. Docker Containers aur Microservices
- **Linux Kernel Foundations**: Docker Linux kernel primitives par depend karta hai:
  - **Namespaces**: Process isolation provide karte hain (PID, Network, Mount).
  - **Cgroups (Control Groups)**: Containers ke liye CPU/RAM memory boundaries limit aur measure karte hain.
- **Alpine Linux Container Images**: Halki 5MB Unix base images, jo fast CI/CD deployments ke liye Node.js, Python aur Go microservices ko package karne mein use hoti hain.

### ⚙️ D. Task Scheduling aur CI/CD Pipelines
- **Cron Jobs (`crontab -e`)**: Production servers par database backups, log rotations, cleanup tasks aur nightly report generation ko automate karta hai.
- **CI/CD Runners**: GitHub Actions, GitLab CI aur Jenkins runners build commands ko Linux bash environments (`/bin/bash`) ke andar execute karte hain.

---

## 3. Senior Software Engineers ke liye Unix/Linux Kyun Zaroori Hai

| Senior Capability | Unix/Linux Skills Kyun Mandatory Hain | Key Commands / Tools |
| :--- | :--- | :--- |
| **Production Debugging aur Incident Response** | Jab server crash hota hai ya high latency aati hai, tab koi GUI nahi hota. Senior devs seedhe instance mein SSH karke live metrics inspect karte hain aur crashes fix karte hain. | `top`, `htop`, `ps aux`, `df -h`, `free -m` |
| **Log Analysis aur Root Cause Analysis** | Outages ke dauraan millions log lines parse karke stack traces ya 5xx HTTP errors ko jaldi isolate karna. | `grep`, `awk`, `sed`, `tail`, `less` |
| **Network aur Connectivity Troubleshooting** | Microservices ke beech API connection failures, blocked ports ya DNS misconfigurations ko resolve karna. | `curl -v`, `netstat -tulpn`, `lsof -i`, `dig`, `traceroute` |
| **Security aur Access Control** | Strict file permissions aur SSH key hygiene enforce karke data leaks rokna. | `chmod`, `chown`, `ufw`, `iptables`, `ssh-keygen` |
| **DevOps aur Infrastructure Parity** | Local Unix Docker containers aur cloud EC2 environments ke beech environmental parity maintain karke "it works on my machine" bugs khatam karna. | `bash`, `environment variables`, `systemd` |

---

## 4. Senior Developers ke liye Production Cheat Sheet

### 📊 System Resource aur Health Monitoring
```bash
# Live CPU, Memory aur Process usage monitor karein
htop

# Disk space utilization check karein
df -h

# RAM memory usage MB/GB mein check karein
free -h

# Naam se filter karke running processes check karein
ps aux | grep node
```

### 🔍 Log Inspection aur Text Processing
```bash
# 500 status codes ke liye filter kiye gaye production logs live stream karein
tail -f /var/log/nginx/access.log | grep "HTTP/1.1\" 5"

# Access log mein sabse zyada request karne wale IP addresses ki frequency count karein
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -n 10
```

### 🌐 Network aur Socket Debugging
```bash
# Check karein ki port 8080 kaun sa process occupy kar raha hai
lsof -i :8080

# TCP socket connection test karein aur headers inspect karein
curl -Iv https://api.example.com/healthcheck

# Active listening ports aur established network connections dekhein
netstat -tulpn
```

### 🔐 Security aur Permissions
```bash
# SSH private key permissions restrict karein (SSH client ke liye mandatory)
chmod 600 ~/.ssh/id_rsa

# Owner ko read/write/execute, group aur others ko read/execute dein
chmod 755 /var/www/html

# File ownership ko Nginx user mein change karein
chown -R www-data:www-data /var/www/html
```
