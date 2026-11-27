# Windows se Linux par Files Copy Karna

Windows laptop se Linux server, VM, WSL ya container mein files bhejna: scp, sftp, rsync, WinSCP aur docker cp, common errors ke fix ke saath.

## Kaunsa method kab use karein

| Situation | Best tool | Kyun |
| :--- | :--- | :--- |
| Ek file ya folder remote server par | `scp` | Windows 10/11 mein built-in (OpenSSH), ek hi command |
| Files browse karke choose karni hain | `sftp` ya WinSCP / FileZilla | Dono side navigate karo, drag and drop |
| Bada folder, baar-baar sync, resume | `rsync` (WSL ya Git Bash se) | Sirf changed files bhejta hai |
| Same PC par WSL mein Linux | `/mnt/c/...` se `cp` ya Explorer `\\wsl$` | Network ki zaroorat nahi |
| Running container ke andar | `docker cp` | Seedha container filesystem mein copy |

Saare network methods SSH (port 22) use karte hain, to agar `ssh user@server` chal raha hai to ye bhi chalenge.

## 1. PowerShell se scp (sabse common)

Windows 10 (1809+) aur Windows 11 mein OpenSSH client pehle se hota hai. Check karo:

```bash
# Run in PowerShell
ssh -V
# OpenSSH_for_Windows_9.5p1, LibreSSL 3.8.2
```

Server ke home folder mein file copy karo:

```bash
# scp <local path> <user>@<host>:<remote path>
scp C:\Users\ashu\Downloads\app.zip ubuntu@203.0.113.10:/home/ubuntu/
```

Common variations:

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

`/var/www` jaise root-owned folder mein seedha copy nahi hoga. Pehle apne home folder mein copy karo, phir server par move karo:

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

## 3. GUI: WinSCP ya FileZilla

1. WinSCP (ya FileZilla) install karo.
2. New session: protocol **SFTP**, host `203.0.113.10`, port `22`, user `ubuntu`.
3. `.pem` key ke liye: Advanced → SSH → Authentication → key choose karo (WinSCP use `.ppk` mein convert kar deta hai).
4. Left (Windows) panel se right (Linux) panel mein files drag karo.

## 4. Bade ya repeated copies ke liye rsync

rsync Windows mein built-in nahi hai; ise WSL (ya rsync wale Git Bash) se chalao. Windows drives `/mnt/c` ke neeche dikhti hain.

```bash
# From WSL: sync a project, show progress, delete files removed locally
rsync -avz --progress --delete /mnt/c/Users/ashu/projects/app/ ubuntu@203.0.113.10:~/app/

# With a key and excluding node_modules
rsync -avz -e "ssh -i ~/.ssh/my-key.pem" --exclude node_modules /mnt/c/Users/ashu/app/ ubuntu@203.0.113.10:~/app/
```

Source ke end mein `/` ka matlab hai "is folder ka content copy karo", folder khud nahi.

## 5. Same machine par Windows ↔ WSL

```bash
# Inside WSL (Ubuntu): Windows C: drive is at /mnt/c
cp /mnt/c/Users/ashu/Downloads/data.csv ~/data.csv

# From WSL back to Windows
cp ~/report.txt /mnt/c/Users/ashu/Desktop/
```

Windows Explorer se `\\wsl$\Ubuntu\home\<user>` (ya `\\wsl.localhost\Ubuntu`) kholo aur files drag kar do. Linux filesystem (`~/`) ke andar kaam karna `/mnt/c` se kaafi fast hota hai.

## 6. Docker container ke andar

```bash
# Host (Windows PowerShell or Linux) → container
docker cp .\config.json my-app:/app/config.json

# Container → host
docker cp my-app:/var/log/app.log .\app.log
```

## Copy ke baad: line endings aur permissions fix karo

Windows par edit hui files mein aksar CRLF line endings hoti hain, jo shell scripts tod deti hain (`/bin/bash^M: bad interpreter`).

```bash
sudo apt-get update && sudo apt-get install -y dos2unix
dos2unix deploy.sh
chmod +x deploy.sh
./deploy.sh
```

Agar koi service (jaise nginx) files padhti hai to ownership bhi check karo:

```bash
ls -l /var/www/
sudo chown -R www-data:www-data /var/www/site
```

## Troubleshooting

| Error | Wajah | Fix |
| :--- | :--- | :--- |
| `Permission denied (publickey)` | Galat user ya key | Sahi user (`ubuntu`, `ec2-user`, `root`) aur `-i key.pem` use karo |
| `WARNING: UNPROTECTED PRIVATE KEY FILE!` | Key file doosre Windows users bhi padh sakte hain | `icacls key.pem /inheritance:r /grant:r "$($env:USERNAME):R"` |
| `scp: /var/www/app.zip: Permission denied` | Aapka user wahan likh nahi sakta | `~/` mein copy karo, phir `sudo mv` |
| `Connection timed out` | Port 22 band hai (firewall / security group) | `ufw` aur cloud security group mein port 22 allow karo |
| `scp: command not found` | OpenSSH client missing hai | Settings → Optional features → "OpenSSH Client" add karo |
| `bad interpreter: ^M` | CRLF line endings | `dos2unix script.sh` |

## Interview questions

**Q1. Bina extra tool ke Windows se Linux server par file kaise copy karoge?**
PowerShell se `scp` use karo, jo built-in OpenSSH client ke saath aata hai: `scp file user@host:/path`.

**Q2. scp aur rsync mein kya fark hai?**
scp har baar sab kuch copy karta hai. rsync source aur destination compare karke sirf changes bhejta hai, resume kar sakta hai, aur `--delete` se hata di gayi files bhi delete kar sakta hai.

**Q3. sudo hone ke baad bhi `/var/www` mein `scp` fail kyun hota hai?**
scp aapke user ke roop mein chalta hai aur sudo use nahi kar sakta. Home folder mein copy karo, phir server par `sudo mv` karo.

**Q4. Windows se copy hui script `^M: bad interpreter` se fail ho rahi hai. Kyun?**
Usme Windows wali CRLF line endings hain. `dos2unix` (ya `sed -i 's/\r$//' file`) se convert karo.

**Q5. Running container mein file kaise copy karoge?**
`docker cp ./file container:/path`. Jo files baar-baar badalti hain unke liye bind mount use karo.

Related: [Docker install](install-docker.md), [server setup](server-setup.md), [file permissions](../02_Filesystem/permissions.md), [users aur sudo](../07_System_Administration/users-and-groups.md).
