# Jobs Schedule Karna: cron, at aur batch

Linux par kaam automate karo: cron aur crontab se recurring jobs, at aur batch se one-time jobs, atq aur atrm se queue manage karo, aur systemd timers.

![Job scheduling in Unix with cron, at and batch](../job-scheduling-in-unix.png)

## Kaunsa Tool Use Karein

| Tool | Kab chalta hai | Typical use |
| :--- | :--- | :--- |
| `cron` | Baar-baar, schedule par | Nightly backups, log cleanup, reports |
| `at` | Ek baar, fixed time par | Aaj raat 2 baje service restart |
| `batch` | Ek baar, jab system load kam ho | Heavy re-indexing jo wait kar sakti hai |
| systemd timers | Baar-baar ya ek baar, systemd manage karta hai | Logging ke saath cron ka modern alternative |

## cron aur crontab

`cron` daemon (RHEL par `crond`) har minute jaagta hai aur har user ki **crontab** se match hone wali entries chalata hai.

```bash
crontab -e             # edit your crontab
crontab -l             # list it
crontab -r             # remove it (careful: no confirmation!)
sudo crontab -u www-data -l   # another user's crontab
```

### Crontab Syntax

```text
*  *  *  *  *   command
|  |  |  |  |
|  |  |  |  +--- day of week (0-7, 0 and 7 = Sunday, or sun-sat)
|  |  |  +------ month (1-12 or jan-dec)
|  |  +--------- day of month (1-31)
|  +------------ hour (0-23)
+--------------- minute (0-59)
```

| Symbol | Matlab | Example |
| :---: | :--- | :--- |
| `*` | Har value | `* * * * *` har minute |
| `,` | List | `0 9,18 * * *` 09:00 aur 18:00 par |
| `-` | Range | `0 9 * * 1-5` Monday se Friday 09:00 par |
| `/` | Step | `*/15 * * * *` har 15 minute |
| `@reboot` | Boot par ek baar | `@reboot /opt/app/start.sh` |
| `@daily` | `0 0 * * *` ka shortcut | `@hourly`, `@weekly`, `@monthly` bhi |

### Examples

```bash
# Database backup every day at 02:30
30 2 * * * /opt/scripts/db-backup.sh >> /var/log/db-backup.log 2>&1

# Clear temp files older than 7 days, every Sunday at 03:00
0 3 * * 0 find /tmp -type f -mtime +7 -delete

# Health check every 5 minutes during office hours on weekdays
*/5 9-18 * * 1-5 curl -fsS https://example.com/health > /dev/null

# First day of every month at midnight
0 0 1 * * /opt/scripts/monthly-report.sh
```

System-wide jobs `/etc/crontab` aur `/etc/cron.d/` mein rehte hain (inmein ek extra **user** field hota hai), saath hi `/etc/cron.daily/`, `/etc/cron.weekly/` jaise folders bhi. Access `/etc/cron.allow` aur `/etc/cron.deny` se control hota hai.

## at: Baad mein ek baar chalao

```bash
at 02:00 tomorrow
at> systemctl restart nginx
at> <Ctrl+D>
# job 4 at Sat Nov 28 02:00:00 2026

echo "/opt/scripts/cleanup.sh" | at now + 30 minutes
at -f deploy.sh 23:45          # read commands from a file
```

### atq aur atrm

```bash
atq                    # list pending jobs (same as at -l)
# 4   Sat Nov 28 02:00:00 2026 a ashu
at -c 4                # show what job 4 will run
atrm 4                 # delete job 4 (same as at -d 4)
```

## batch: System free ho tab chalao

`batch` commands ko queue mein rakhta hai aur load average ek threshold se neeche aane par chalata hai (`atd` ke liye default 1.5).

```bash
echo "tar -czf /backup/logs.tgz /var/log" | batch
```

Batch jobs `atq` mein queue `b` ke under dikhte hain. `at` aur `batch` ke liye `atd` service chalni chahiye (`systemctl status atd`).

## systemd Timers (Short mein)

systemd wale distros par ek **timer** unit ek **service** unit ko trigger karti hai. Output journal mein jaata hai aur `Persistent=true` se miss hue runs baad mein catch up ho jaate hain.

```ini
# /etc/systemd/system/backup.timer
[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now backup.timer   # needs a matching backup.service
systemctl list-timers                      # next and last run times
journalctl -u backup.service               # logs of each run
```

Schedule kiye jaane wale scripts aksar shell scripts hote hain; output log karne ke liye [shell scripting](../05_Shell_Scripting/README.md) aur [redirection](../04_Commands/redirection.md) dekho.

## Common Mistakes

**Q1. Mera script terminal mein chalta hai par cron se nahi. Kyun?**
cron bahut minimal `PATH` aur environment ke saath chalta hai. Absolute paths (`/usr/bin/python3`) use karo, crontab ke upar `PATH=` set karo, aur errors dekhne ke liye output ko log mein redirect karo.

**Q2. Crontab line mein `%` kya karta hai?**
Ise newline maana jaata hai. Ise `\%` se escape karo, jaise `date +\%F` mein.

**Q3. `at` aur `batch` mein kya fark hai?**
`at` fixed time par chalta hai; `batch` tab chalta hai jab system load kaafi kam ho jaaye.

**Q4. Har 30 seconds par job kaise chalayein?**
cron ki sabse chhoti unit ek minute hai. systemd timer (`OnUnitActiveSec=30s`) ya do cron lines use karo, jinmein se ek ke aage `sleep 30;` ho.

**Q5. `crontab -r` ka khatra kya hai?**
Yeh bina pooche poori crontab delete kar deta hai, aur keyboard par `-e` ke bilkul paas hai. `crontab -l > cron.bak` se backup lo.
