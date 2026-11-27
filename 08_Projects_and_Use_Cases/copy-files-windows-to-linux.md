# Copy Files from Windows to Linux

Move files between a Windows laptop and a Linux server, VM, WSL or container using scp, sftp, rsync, WinSCP and docker cp, with fixes for common errors.

## Which method to use

| Situation | Best tool | Why |
| :--- | :--- | :--- |
| One file or folder to a remote server | `scp` | Built into Windows 10/11 (OpenSSH), one command |
| Browse and pick files interactively | `sftp` or WinSCP / FileZilla | Navigate both sides, drag and drop |
| Large folder, repeat syncs, resume | `rsync` (from WSL or Git Bash) | Sends only what changed |
| Linux running in WSL on the same PC | `cp` from `/mnt/c/...` or Explorer `\\wsl$` | No network needed |
| Into a running container | `docker cp` | Copies straight into the container filesystem |

All network methods use SSH (port 22), so if `ssh user@server` works, these work too.

## 1. scp from PowerShell (most common)

Windows 10 (1809+) and Windows 11 ship the OpenSSH client. Check it:

```bash
# Run in PowerShell
ssh -V
# OpenSSH_for_Windows_9.5p1, LibreSSL 3.8.2
```

Copy a file to the server's home folder:

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

You can't copy straight into a root-owned folder like `/var/www`. Copy to your home folder first, then move it on the server:

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

## 3. GUI: WinSCP or FileZilla

1. Install WinSCP (or FileZilla).
2. New session: protocol **SFTP**, host `203.0.113.10`, port `22`, user `ubuntu`.
3. For a `.pem` key: Advanced → SSH → Authentication → choose the key (WinSCP converts it to `.ppk`).
4. Drag files from the left (Windows) panel to the right (Linux) panel.

## 4. rsync for big or repeated copies

rsync isn't built into Windows; run it from WSL (or Git Bash with rsync installed). Windows drives appear under `/mnt/c`.

```bash
# From WSL: sync a project, show progress, delete files removed locally
rsync -avz --progress --delete /mnt/c/Users/ashu/projects/app/ ubuntu@203.0.113.10:~/app/

# With a key and excluding node_modules
rsync -avz -e "ssh -i ~/.ssh/my-key.pem" --exclude node_modules /mnt/c/Users/ashu/app/ ubuntu@203.0.113.10:~/app/
```

The trailing `/` on the source means "copy the contents of this folder", not the folder itself.

## 5. Windows ↔ WSL on the same machine

```bash
# Inside WSL (Ubuntu): Windows C: drive is at /mnt/c
cp /mnt/c/Users/ashu/Downloads/data.csv ~/data.csv

# From WSL back to Windows
cp ~/report.txt /mnt/c/Users/ashu/Desktop/
```

From Windows Explorer, open `\\wsl$\Ubuntu\home\<user>` (or `\\wsl.localhost\Ubuntu`) and drag files in. Working on files inside the Linux filesystem (`~/`) is much faster than on `/mnt/c`.

## 6. Into a Docker container

```bash
# Host (Windows PowerShell or Linux) → container
docker cp .\config.json my-app:/app/config.json

# Container → host
docker cp my-app:/var/log/app.log .\app.log
```

## After copying: fix line endings and permissions

Files edited on Windows often have CRLF line endings, which break shell scripts (`/bin/bash^M: bad interpreter`).

```bash
sudo apt-get update && sudo apt-get install -y dos2unix
dos2unix deploy.sh
chmod +x deploy.sh
./deploy.sh
```

Also check ownership if a service (like nginx) needs to read the files:

```bash
ls -l /var/www/
sudo chown -R www-data:www-data /var/www/site
```

## Troubleshooting

| Error | Cause | Fix |
| :--- | :--- | :--- |
| `Permission denied (publickey)` | Wrong user or key | Use the right user (`ubuntu`, `ec2-user`, `root`) and `-i key.pem` |
| `WARNING: UNPROTECTED PRIVATE KEY FILE!` | Key file readable by other Windows users | `icacls key.pem /inheritance:r /grant:r "$($env:USERNAME):R"` |
| `scp: /var/www/app.zip: Permission denied` | Your user can't write there | Copy to `~/` then `sudo mv` |
| `Connection timed out` | Port 22 closed (firewall / security group) | Allow port 22 in `ufw` and the cloud security group |
| `scp: command not found` | OpenSSH client missing | Settings → Optional features → add "OpenSSH Client" |
| `bad interpreter: ^M` | CRLF line endings | `dos2unix script.sh` |

## Interview questions

**Q1. How do you copy a file from Windows to a Linux server without extra tools?**
Use `scp` from PowerShell, which comes with the built-in OpenSSH client: `scp file user@host:/path`.

**Q2. What's the difference between scp and rsync?**
scp copies everything every time. rsync compares source and destination and sends only the changes, can resume, and can delete removed files with `--delete`.

**Q3. Why does `scp` to `/var/www` fail even though you have sudo?**
scp runs as your user and can't use sudo. Copy to your home folder, then `sudo mv` on the server.

**Q4. A script copied from Windows fails with `^M: bad interpreter`. Why?**
It has Windows CRLF line endings. Convert it with `dos2unix` (or `sed -i 's/\r$//' file`).

**Q5. How do you copy a file into a running container?**
`docker cp ./file container:/path`. For files you change often, use a bind mount instead.

Related: [Docker install](install-docker.md), [server setup](server-setup.md), [file permissions](../02_Filesystem/permissions.md), [users and sudo](../07_System_Administration/users-and-groups.md).
