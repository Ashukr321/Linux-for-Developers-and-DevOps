# Windows से Linux पर फ़ाइलें कॉपी करना

Windows लैपटॉप से Linux सर्वर, VM, WSL या container में फ़ाइलें भेजना: scp, sftp, rsync, WinSCP और docker cp, आम errors के समाधान के साथ।

## कौन-सा तरीका कब इस्तेमाल करें

| स्थिति | सबसे अच्छा टूल | क्यों |
| :--- | :--- | :--- |
| एक फ़ाइल या फ़ोल्डर remote सर्वर पर | `scp` | Windows 10/11 में built-in (OpenSSH), एक ही कमांड |
| फ़ाइलें browse करके चुननी हों | `sftp` या WinSCP / FileZilla | दोनों तरफ़ navigate करें, drag and drop |
| बड़ा फ़ोल्डर, बार-बार sync, resume | `rsync` (WSL या Git Bash से) | सिर्फ़ बदली हुई फ़ाइलें भेजता है |
| उसी PC पर WSL में Linux | `/mnt/c/...` से `cp` या Explorer `\\wsl$` | नेटवर्क की ज़रूरत नहीं |
| चल रहे container के अंदर | `docker cp` | सीधे container के filesystem में कॉपी |

सभी नेटवर्क तरीके SSH (port 22) इस्तेमाल करते हैं, इसलिए अगर `ssh user@server` चल रहा है तो ये भी चलेंगे।

## 1. PowerShell से scp (सबसे आम)

Windows 10 (1809+) और Windows 11 में OpenSSH client पहले से होता है। जाँचें:

```bash
# Run in PowerShell
ssh -V
# OpenSSH_for_Windows_9.5p1, LibreSSL 3.8.2
```

सर्वर के home फ़ोल्डर में फ़ाइल कॉपी करें:

```bash
# scp <local path> <user>@<host>:<remote path>
scp C:\Users\ashu\Downloads\app.zip ubuntu@203.0.113.10:/home/ubuntu/
```

आम variations:

```bash
# Use a key file (AWS EC2 .pem)
scp -i C:\keys\my-key.pem .\app.zip ubuntu@203.0.113.10:~/

# Copy a whole folder (recursive)
scp -r .\website ubuntu@203.0.113.10:~/website

# Paths with spaces: wrap in quotes
scp "C:\My Files\notes.txt" ubuntu@203.0.113.10:~/

# SSH on a non-default port (capital -P)
scp -P 2222 .\app.zip ubuntu@203.0.113.10:~/

# Reverse: download from Linux to Windows
scp ubuntu@203.0.113.10:/var/log/nginx/error.log .\error.log
```

`/var/www` जैसे root-owned फ़ोल्डर में सीधे कॉपी नहीं होगा। पहले अपने home फ़ोल्डर में कॉपी करें, फिर सर्वर पर move करें:

```bash
ssh ubuntu@203.0.113.10
sudo mv ~/app.zip /var/www/
sudo chown -R www-data:www-data /var/www/app.zip
```

## 2. sftp (interactive)

```bash
sftp -i C:\keys\my-key.pem ubuntu@203.0.113.10
sftp> lcd C:\Users\ashu\Downloads   # local folder
sftp> cd /home/ubuntu               # remote folder
sftp> put app.zip                   # upload
sftp> put -r website                # upload a folder
sftp> get backup.tar.gz             # download
sftp> exit
```

## 3. GUI: WinSCP या FileZilla

1. WinSCP (या FileZilla) install करें।
2. New session: protocol **SFTP**, host `203.0.113.10`, port `22`, user `ubuntu`।
3. `.pem` key के लिए: Advanced → SSH → Authentication → key चुनें (WinSCP इसे `.ppk` में बदल देता है)।
4. बाएँ (Windows) panel से दाएँ (Linux) panel में फ़ाइलें drag करें।

## 4. बड़ी या बार-बार की कॉपी के लिए rsync

rsync Windows में built-in नहीं है; इसे WSL (या rsync वाले Git Bash) से चलाएँ। Windows ड्राइव `/mnt/c` के नीचे दिखती हैं।

```bash
# From WSL: sync a project, show progress, delete files removed locally
rsync -avz --progress --delete /mnt/c/Users/ashu/projects/app/ ubuntu@203.0.113.10:~/app/

# With a key and excluding node_modules
rsync -avz -e "ssh -i ~/.ssh/my-key.pem" --exclude node_modules /mnt/c/Users/ashu/app/ ubuntu@203.0.113.10:~/app/
```

Source के अंत में `/` का मतलब है "इस फ़ोल्डर का content कॉपी करो", फ़ोल्डर खुद नहीं।

## 5. उसी मशीन पर Windows ↔ WSL

```bash
# Inside WSL (Ubuntu): Windows C: drive is at /mnt/c
cp /mnt/c/Users/ashu/Downloads/data.csv ~/data.csv

# From WSL back to Windows
cp ~/report.txt /mnt/c/Users/ashu/Desktop/
```

Windows Explorer में `\\wsl$\Ubuntu\home\<user>` (या `\\wsl.localhost\Ubuntu`) खोलें और फ़ाइलें drag कर दें। Linux filesystem (`~/`) के अंदर काम करना `/mnt/c` से काफ़ी तेज़ होता है।

## 6. Docker container के अंदर

```bash
# Host (Windows PowerShell or Linux) → container
docker cp .\config.json my-app:/app/config.json

# Container → host
docker cp my-app:/var/log/app.log .\app.log
```

## कॉपी के बाद: line endings और permissions ठीक करें

Windows पर edit हुई फ़ाइलों में अक्सर CRLF line endings होती हैं, जो shell scripts को तोड़ देती हैं (`/bin/bash^M: bad interpreter`)।

```bash
sudo apt-get update && sudo apt-get install -y dos2unix
dos2unix deploy.sh
chmod +x deploy.sh
./deploy.sh
```

अगर कोई service (जैसे nginx) फ़ाइलें पढ़ती है तो ownership भी जाँचें:

```bash
ls -l /var/www/
sudo chown -R www-data:www-data /var/www/site
```

## Troubleshooting

| Error | कारण | समाधान |
| :--- | :--- | :--- |
| `Permission denied (publickey)` | गलत user या key | सही user (`ubuntu`, `ec2-user`, `root`) और `-i key.pem` इस्तेमाल करें |
| `WARNING: UNPROTECTED PRIVATE KEY FILE!` | Key फ़ाइल दूसरे Windows users भी पढ़ सकते हैं | `icacls key.pem /inheritance:r /grant:r "$($env:USERNAME):R"` |
| `scp: /var/www/app.zip: Permission denied` | आपका user वहाँ लिख नहीं सकता | `~/` में कॉपी करें, फिर `sudo mv` |
| `Connection timed out` | Port 22 बंद है (firewall / security group) | `ufw` और cloud security group में port 22 allow करें |
| `scp: command not found` | OpenSSH client नहीं है | Settings → Optional features → "OpenSSH Client" जोड़ें |
| `bad interpreter: ^M` | CRLF line endings | `dos2unix script.sh` |

## इंटरव्यू प्रश्न

**Q1. बिना किसी extra टूल के Windows से Linux सर्वर पर फ़ाइल कैसे कॉपी करेंगे?**
PowerShell से `scp` इस्तेमाल करें, जो built-in OpenSSH client के साथ आता है: `scp file user@host:/path`।

**Q2. scp और rsync में क्या अंतर है?**
scp हर बार सब कुछ कॉपी करता है। rsync source और destination की तुलना करके सिर्फ़ बदलाव भेजता है, resume कर सकता है, और `--delete` से हटाई गई फ़ाइलें भी delete कर सकता है।

**Q3. sudo होने के बाद भी `/var/www` में `scp` क्यों fail होता है?**
scp आपके user के रूप में चलता है और sudo इस्तेमाल नहीं कर सकता। Home फ़ोल्डर में कॉपी करें, फिर सर्वर पर `sudo mv` करें।

**Q4. Windows से कॉपी हुई script `^M: bad interpreter` से fail हो रही है। क्यों?**
उसमें Windows वाली CRLF line endings हैं। `dos2unix` (या `sed -i 's/\r$//' file`) से convert करें।

**Q5. चल रहे container में फ़ाइल कैसे कॉपी करेंगे?**
`docker cp ./file container:/path`। जो फ़ाइलें बार-बार बदलती हैं उनके लिए bind mount इस्तेमाल करें।

संबंधित: [Docker install](install-docker.md), [server setup](server-setup.md), [file permissions](../02_Filesystem/permissions.md), [users और sudo](../07_System_Administration/users-and-groups.md)।
