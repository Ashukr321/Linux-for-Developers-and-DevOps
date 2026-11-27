# Monitoring and Security

Watch CPU, memory, disk, network and logs on a Linux server, then harden it with SSH keys, a firewall, updates and fail2ban.

## Part 1: Monitoring System Usage

### Load average with uptime

```bash
$ uptime
 10:42:11 up 12 days,  3:05,  2 users,  load average: 3.90, 2.10, 1.05
```

The three numbers are the 1, 5 and 15 minute averages of processes running or waiting (for CPU or disk I/O). Compare with the CPU count: `3.90` on 4 cores is busy but fine; `12.0` on 4 cores means work is queueing. A rising 1-minute value means load is increasing.

### top and htop

```bash
top            # press P sort by CPU, M by memory, 1 per-CPU, k kill, q quit
htop           # friendlier, colour, mouse, tree view (F5)
```

In the `top` header, watch `%Cpu(s): us sy id wa`: high `wa` (I/O wait) means the CPU is waiting for disk. Process states are explained in [processes](../03_Processes/README.md).

### Memory, CPU and disk I/O

```bash
$ free -h
               total   used   free  shared  buff/cache  available
Mem:           7.7Gi  3.1Gi  0.4Gi   120Mi       4.2Gi      4.2Gi
Swap:          2.0Gi    0B   2.0Gi
```

Look at **available**, not `free`: Linux uses spare RAM as cache and gives it back when needed.

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

`-t` TCP, `-u` UDP, `-l` listening, `-p` process, `-n` numeric. `0.0.0.0` means reachable from outside; `127.0.0.1` means local only.

### Logs

| File | Contents |
| :--- | :--- |
| `/var/log/syslog` or `/var/log/messages` | General system messages |
| `/var/log/auth.log` or `/var/log/secure` | Logins, sudo, SSH |
| `/var/log/kern.log`, `dmesg` | Kernel, hardware, OOM killer |
| `/var/log/nginx/` | App-specific logs |

```bash
sudo tail -f /var/log/auth.log
journalctl -xe                       # recent entries with explanations
```

Use [filters and pipes](../04_Commands/filters-and-pipes.md) and [awk](../06_Sed_and_Awk/awk.md) to summarise logs.

## Part 2: System Security

### SSH hardening

```bash
ssh-keygen -t ed25519 -C "ashu@laptop"        # on your laptop
ssh-copy-id deploy@server                     # install the public key
```

Then edit `/etc/ssh/sshd_config` on the server:

```bash
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy ashu
```

```bash
sudo sshd -t && sudo systemctl reload ssh     # test config, then reload (sshd on RHEL)
```

Keep your current session open and test a new login in a second terminal before you log out.

### Firewall

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH            # allow SSH FIRST
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ufw status verbose
```

### fail2ban, updates and least privilege

```bash
sudo apt install fail2ban && sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd          # banned IPs
sudo apt update && sudo apt upgrade       # or: sudo dnf upgrade
sudo apt install unattended-upgrades      # automatic security patches
```

- Run each service as its own non-root user ([users and groups](users-and-groups.md)).
- Grant narrow sudo rules instead of full root.
- Remove unused packages and disable unused services (`systemctl disable`).

### File permission hygiene

```bash
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
chmod 600 /etc/myapp.env                       # secrets readable only by owner
sudo find / -xdev -type f -perm -0002 2>/dev/null   # world-writable files
sudo find / -xdev -perm -4000 -type f 2>/dev/null   # SUID binaries to review
```

## Production Troubleshooting Checklist

1. `uptime`: load vs `nproc`; how long since reboot?
2. `dmesg -T | tail`: OOM kills, disk or network errors.
3. `top` / `htop`: which process eats CPU or memory? High `wa`?
4. `free -h` and `vmstat 1`: low `available`, swapping (`si/so`)?
5. `df -h` and `df -i`: full disk or inodes?
6. `iostat -xz 1`: saturated disk?
7. `ss -tulpn`: is the app listening on the expected port and address?
8. `systemctl status <svc>` and `journalctl -u <svc> --since "15 min ago"`.
9. `curl -v localhost:<port>/health` from the server itself, then from outside (firewall?).
10. Check recent changes: deploys, config edits, `last`, `/var/log/apt/history.log`.

## Interview Questions

**Q1. Load average is 8 on a 4-core machine but CPU is mostly idle. Why?**
Processes are blocked on I/O (state `D`); load counts them too. Check `wa` in `top` and `iostat`.

**Q2. `free` shows almost no free memory. Is that a problem?**
Usually not. Check the `available` column; buff/cache is reclaimable.

**Q3. How do you disable root SSH login safely?**
Set `PermitRootLogin no`, make sure a sudo user can log in with a key, run `sshd -t`, reload, and test in a new session.

**Q4. What does fail2ban do?**
It watches logs such as `auth.log` for repeated failures and temporarily bans the source IP with firewall rules.
