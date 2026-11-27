# Monitoring और Security

Linux server पर CPU, memory, disk, network और logs पर नज़र रखें, फिर SSH keys, firewall, updates और fail2ban से उसे सुरक्षित करें।

## भाग 1: System Usage की Monitoring

### uptime से load average

```bash
$ uptime
 10:42:11 up 12 days,  3:05,  2 users,  load average: 3.90, 2.10, 1.05
```

तीनों numbers 1, 5 और 15 मिनट का औसत हैं उन processes का जो चल रहे हैं या इंतज़ार कर रहे हैं (CPU या disk I/O के लिए)। इसे CPU count से मिलाएँ: 4 cores पर `3.90` व्यस्त है पर ठीक है; 4 cores पर `12.0` का मतलब है काम queue में अटक रहा है। बढ़ती 1-मिनट value का मतलब है load बढ़ रहा है।

### top और htop

```bash
top            # press P sort by CPU, M by memory, 1 per-CPU, k kill, q quit
htop           # friendlier, colour, mouse, tree view (F5)
```

`top` के header में `%Cpu(s): us sy id wa` देखें: ज़्यादा `wa` (I/O wait) का मतलब CPU disk का इंतज़ार कर रहा है। Process states [processes](../03_Processes/README.md) में समझाए गए हैं।

### Memory, CPU और disk I/O

```bash
$ free -h
               total   used   free  shared  buff/cache  available
Mem:           7.7Gi  3.1Gi  0.4Gi   120Mi       4.2Gi      4.2Gi
Swap:          2.0Gi    0B   2.0Gi
```

`free` नहीं, **available** देखें: Linux खाली RAM को cache की तरह इस्तेमाल करता है और ज़रूरत पड़ने पर लौटा देता है।

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

`-t` TCP, `-u` UDP, `-l` listening, `-p` process, `-n` numeric। `0.0.0.0` का मतलब बाहर से पहुँचा जा सकता है; `127.0.0.1` का मतलब सिर्फ़ local।

### Logs

| File | क्या है |
| :--- | :--- |
| `/var/log/syslog` या `/var/log/messages` | सामान्य system messages |
| `/var/log/auth.log` या `/var/log/secure` | Logins, sudo, SSH |
| `/var/log/kern.log`, `dmesg` | Kernel, hardware, OOM killer |
| `/var/log/nginx/` | App के अपने logs |

```bash
sudo tail -f /var/log/auth.log
journalctl -xe                       # recent entries with explanations
```

Logs का सार निकालने के लिए [filters और pipes](../04_Commands/filters-and-pipes.md) और [awk](../06_Sed_and_Awk/awk.md) इस्तेमाल करें।

## भाग 2: System Security

### SSH hardening

```bash
ssh-keygen -t ed25519 -C "ashu@laptop"        # on your laptop
ssh-copy-id deploy@server                     # install the public key
```

फिर server पर `/etc/ssh/sshd_config` edit करें:

```bash
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy ashu
```

```bash
sudo sshd -t && sudo systemctl reload ssh     # test config, then reload (sshd on RHEL)
```

अपना मौजूदा session खुला रखें और logout करने से पहले दूसरे terminal में नया login test करें।

### Firewall

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH            # allow SSH FIRST
sudo ufw allow 80,443/tcp
sudo ufw enable
sudo ufw status verbose
```

### fail2ban, updates और least privilege

```bash
sudo apt install fail2ban && sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd          # banned IPs
sudo apt update && sudo apt upgrade       # or: sudo dnf upgrade
sudo apt install unattended-upgrades      # automatic security patches
```

- हर service को उसके अपने non-root user से चलाएँ ([users और groups](users-and-groups.md))।
- पूरे root के बजाय सीमित sudo rules दें।
- बेकार packages हटाएँ और इस्तेमाल न होने वाली services बंद करें (`systemctl disable`)।

### File permission hygiene

```bash
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
chmod 600 /etc/myapp.env                       # secrets readable only by owner
sudo find / -xdev -type f -perm -0002 2>/dev/null   # world-writable files
sudo find / -xdev -perm -4000 -type f 2>/dev/null   # SUID binaries to review
```

## Production Troubleshooting Checklist

1. `uptime`: load बनाम `nproc`; पिछला reboot कब हुआ?
2. `dmesg -T | tail`: OOM kills, disk या network errors।
3. `top` / `htop`: कौन सा process CPU या memory खा रहा है? `wa` ज़्यादा है?
4. `free -h` और `vmstat 1`: `available` कम है, swapping (`si/so`) हो रही है?
5. `df -h` और `df -i`: disk या inodes भरे हैं?
6. `iostat -xz 1`: disk saturated है?
7. `ss -tulpn`: क्या app सही port और address पर listen कर रहा है?
8. `systemctl status <svc>` और `journalctl -u <svc> --since "15 min ago"`।
9. Server से ही `curl -v localhost:<port>/health`, फिर बाहर से (firewall?)।
10. हाल के बदलाव देखें: deploys, config edits, `last`, `/var/log/apt/history.log`।

## इंटरव्यू प्रश्न

**Q1. 4-core machine पर load average 8 है लेकिन CPU ज़्यादातर idle है। क्यों?**
Processes I/O पर blocked हैं (state `D`); load इन्हें भी गिनता है। `top` में `wa` और `iostat` जाँचें।

**Q2. `free` में लगभग कोई free memory नहीं दिखती। क्या यह समस्या है?**
आम तौर पर नहीं। `available` column देखें; buff/cache वापस लिया जा सकता है।

**Q3. Root SSH login को सुरक्षित तरीके से कैसे बंद करें?**
`PermitRootLogin no` सेट करें, पक्का करें कि कोई sudo user key से login कर सकता है, `sshd -t` चलाएँ, reload करें, और नए session में test करें।

**Q4. fail2ban क्या करता है?**
यह `auth.log` जैसे logs में बार-बार के failures देखता है और firewall rules से source IP को कुछ समय के लिए ban कर देता है।
