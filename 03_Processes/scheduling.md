# Scheduling Jobs: cron, at and batch

Automate tasks on Linux: recurring jobs with cron and crontab, one-time jobs with at and batch, managing queues with atq and atrm, and systemd timers.

![Job scheduling in Unix with cron, at and batch](../job-scheduling-in-unix.png)

## Which Tool to Use

| Tool | Runs | Typical use |
| :--- | :--- | :--- |
| `cron` | Repeatedly, on a schedule | Nightly backups, log cleanup, reports |
| `at` | Once, at a given time | Restart a service at 2 AM tonight |
| `batch` | Once, when system load is low | Heavy re-indexing that can wait |
| systemd timers | Repeatedly or once, managed by systemd | Modern alternative to cron with logging |

## cron and crontab

The `cron` daemon (`crond` on RHEL) wakes up every minute and runs matching entries from each user's **crontab**.

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

| Symbol | Meaning | Example |
| :---: | :--- | :--- |
| `*` | Every value | `* * * * *` every minute |
| `,` | List | `0 9,18 * * *` at 09:00 and 18:00 |
| `-` | Range | `0 9 * * 1-5` 09:00 Monday to Friday |
| `/` | Step | `*/15 * * * *` every 15 minutes |
| `@reboot` | Once at boot | `@reboot /opt/app/start.sh` |
| `@daily` | Shortcut for `0 0 * * *` | also `@hourly`, `@weekly`, `@monthly` |

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

System-wide jobs live in `/etc/crontab` and `/etc/cron.d/` (these have an extra **user** field), plus the folders `/etc/cron.daily/`, `/etc/cron.weekly/` and so on. Access is controlled by `/etc/cron.allow` and `/etc/cron.deny`.

## at: Run Once Later

```bash
at 02:00 tomorrow
at> systemctl restart nginx
at> <Ctrl+D>
# job 4 at Sat Nov 28 02:00:00 2026

echo "/opt/scripts/cleanup.sh" | at now + 30 minutes
at -f deploy.sh 23:45          # read commands from a file
```

### atq and atrm

```bash
atq                    # list pending jobs (same as at -l)
# 4   Sat Nov 28 02:00:00 2026 a ashu
at -c 4                # show what job 4 will run
atrm 4                 # delete job 4 (same as at -d 4)
```

## batch: Run When the System Is Idle

`batch` queues commands and runs them once the load average drops below a threshold (1.5 by default for `atd`).

```bash
echo "tar -czf /backup/logs.tgz /var/log" | batch
```

Batch jobs appear in `atq` under queue `b`. The `atd` service must be running for `at` and `batch` (`systemctl status atd`).

## systemd Timers (Brief)

On systemd distros a **timer** unit triggers a **service** unit. Output goes to the journal and missed runs can be caught up with `Persistent=true`.

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

Scripts you schedule are usually shell scripts; see [shell scripting](../05_Shell_Scripting/README.md) and [redirection](../04_Commands/redirection.md) for logging output.

## Common Mistakes

**Q1. My script works in the terminal but not from cron. Why?**
cron runs with a minimal `PATH` and environment. Use absolute paths (`/usr/bin/python3`), set `PATH=` at the top of the crontab, and redirect output to a log to see errors.

**Q2. What does `%` do in a crontab line?**
It is treated as a newline. Escape it as `\%`, for example in `date +\%F`.

**Q3. What is the difference between `at` and `batch`?**
`at` runs at a fixed time; `batch` runs as soon as the system load is low enough.

**Q4. How do I run a job every 30 seconds?**
cron's smallest unit is one minute. Use a systemd timer (`OnUnitActiveSec=30s`) or two cron lines, one with `sleep 30;` in front.

**Q5. What is the danger of `crontab -r`?**
It deletes your whole crontab without asking, and it sits next to `-e` on the keyboard. Back up with `crontab -l > cron.bak`.
