# Monitoring aur Security

Linux server par CPU, memory, disk, network aur logs ko monitor karo, phir SSH keys, firewall, updates aur fail2ban se use harden karo.

## Part 1: System Usage ki Monitoring

### uptime se load average

```bash
$ uptime
 10:42:11 up 12 days,  3:05,  2 users,  load average: 3.90, 2.10, 1.05
```

Teeno numbers 1, 5 aur 15 minute ka average hain un processes ka jo chal rahe hain ya wait kar rahe hain (CPU ya disk I/O ke liye). Ise CPU count se compare karo: 4 cores par `3.90` busy hai par theek hai; 4 cores par `12.0` matlab kaam queue mein atak raha hai. Badhti 1-minute value matlab load badh raha hai.

### top aur htop

```bash
top            # press P sort by CPU, M by memory, 1 per-CPU, k kill, q quit
htop           # friendlier, colour, mouse, tree view (F5)
```

`top` ke header mein `%Cpu(s): us sy id wa` dekho: high `wa` (I/O wait) matlab CPU disk ka wait kar raha hai. Process states [processes](../03_Processes/README.md) mein explain kiye gaye hain.

### Memory, CPU aur disk I/O

```bash
$ free -h
               total   used   free  shared  buff/cache  available
Mem:           7.7Gi  3.1Gi  0.4Gi   120Mi       4.2Gi      4.2Gi
Swap:          2.0Gi    0B   2.0Gi
```

`free` nahi, **available** dekho: Linux khaali RAM ko cache ki tarah use karta hai aur zaroorat padne par wapas de deta hai.

```bash
vmstat 1 5        # r = run queue, si/so = swap in/out (should be ~0), wa = I/O wait
iostat -xz 1      # from sysstat; %util near 100 and high await = saturated disk
```

### Network ports

```bash
$ sudo ss -tulpn
Netid State  Local Address:Port  Process
tcp   LISTEN 0.0.0.0:22          users:(("sshd",pid=701,fd=3))
tcp   LISTEN 127.0.0.1:5432      users:(("postgres",pid=922,fd=5))
```

`-t` TCP, `-u` UDP, `-l` listening, `-p` process, `-n` numeric. `0.0.0.0` matlab bahar se reach ho sakta hai; `127.0.0.1` matlab sirf local.

### Logs

| File | Kya hai |
| :--- | :--- |
| `/var/log/syslog` ya `/var/log/messages` | General system messages |
| `/var/log/auth.log` ya `/var/log/secure` | Logins, sudo, SSH |
| `/var/log/kern.log`, `dmesg` | Kernel, hardware, OOM killer |
| `/var/log/nginx/` | App ke apne logs |

```bash
sudo tail -f /var/log/auth.log
journalctl -xe                       # recent entries with explanations
```

Logs ka summary nikalne ke liye [filters aur pipes](../04_Commands/filters-and-pipes.md) aur [awk](../06_Sed_and_Awk/awk.md) use karo.

## Part 2: System Security

### SSH hardening

```bash
ssh-keygen -t ed25519 -C "ashu@laptop"        # on your laptop
ssh-copy-id deploy@server                     # install the public key
```

Phir server par `/etc/ssh/sshd_config` edit karo:

```bash
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy ashu
```

```bash
sudo sshd -t && sudo systemctl reload ssh     # test config, then reload (sshd on RHEL)
```

Apna current session open rakho aur logout karne se pehle doosre terminal mein naya login test karo.

### Firewall

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH            # allow SSH FIRST
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ufw status verbose
```

### fail2ban, updates aur least privilege

```bash
sudo apt install fail2ban && sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd          # banned IPs
sudo apt update && sudo apt upgrade       # or: sudo dnf upgrade
sudo apt install unattended-upgrades      # automatic security patches
```

- Har service ko uske apne non-root user se chalao ([users aur groups](users-and-groups.md)).
- Poore root ke bajaye narrow sudo rules do.
- Unused packages hatao aur use na hone wali services disable karo (`systemctl disable`).

### File permission hygiene

```bash
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
chmod 600 /etc/myapp.env                       # secrets readable only by owner
sudo find / -xdev -type f -perm -0002 2>/dev/null   # world-writable files
sudo find / -xdev -perm -4000 -type f 2>/dev/null   # SUID binaries to review
```

## Production Troubleshooting Checklist

1. `uptime`: load vs `nproc`; last reboot kab hua?
2. `dmesg -T | tail`: OOM kills, disk ya network errors.
3. `top` / `htop`: kaunsa process CPU ya memory kha raha hai? `wa` high hai?
4. `free -h` aur `vmstat 1`: `available` kam hai, swapping (`si/so`) ho rahi hai?
5. `df -h` aur `df -i`: disk ya inodes full hain?
6. `iostat -xz 1`: disk saturated hai?
7. `ss -tulpn`: kya app sahi port aur address par listen kar raha hai?
8. `systemctl status <svc>` aur `journalctl -u <svc> --since "15 min ago"`.
9. Server se hi `curl -v localhost:<port>/health`, phir bahar se (firewall?).
10. Recent changes dekho: deploys, config edits, `last`, `/var/log/apt/history.log`.

## Interview Questions

**Q1. 4-core machine par load average 8 hai lekin CPU mostly idle hai. Kyun?**
Processes I/O par blocked hain (state `D`); load inko bhi count karta hai. `top` mein `wa` aur `iostat` check karo.

**Q2. `free` mein almost koi free memory nahi dikhti. Kya ye problem hai?**
Usually nahi. `available` column dekho; buff/cache reclaim ho sakta hai.

**Q3. Root SSH login ko safely kaise disable karein?**
`PermitRootLogin no` set karo, confirm karo ki koi sudo user key se login kar sakta hai, `sshd -t` chalao, reload karo, aur naye session mein test karo.

**Q4. fail2ban kya karta hai?**
Ye `auth.log` jaise logs mein baar-baar ke failures dekhta hai aur firewall rules se source IP ko kuch time ke liye ban kar deta hai.
