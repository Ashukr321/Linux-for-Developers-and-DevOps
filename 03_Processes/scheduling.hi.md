# Jobs शेड्यूल करना: cron, at और batch

Linux पर काम automate करें: cron और crontab से दोहराए जाने वाले jobs, at और batch से एक बार के jobs, atq व atrm से queue, और systemd timers।

![Job scheduling in Unix with cron, at and batch](../job-scheduling-in-unix.png)

## कौन सा Tool इस्तेमाल करें

| Tool | कब चलता है | आम उपयोग |
| :--- | :--- | :--- |
| `cron` | बार-बार, schedule पर | रात का backup, log cleanup, reports |
| `at` | एक बार, तय समय पर | आज रात 2 बजे service restart |
| `batch` | एक बार, जब system load कम हो | भारी re-indexing जो रुक सकती है |
| systemd timers | बार-बार या एक बार, systemd द्वारा | Logging के साथ cron का आधुनिक विकल्प |

## cron और crontab

`cron` daemon (RHEL पर `crond`) हर मिनट जागता है और हर user की **crontab** से मेल खाती entries चलाता है।

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

| Symbol | अर्थ | उदाहरण |
| :---: | :--- | :--- |
| `*` | हर value | `* * * * *` हर मिनट |
| `,` | सूची | `0 9,18 * * *` 09:00 और 18:00 पर |
| `-` | Range | `0 9 * * 1-5` सोमवार से शुक्रवार 09:00 पर |
| `/` | Step | `*/15 * * * *` हर 15 मिनट |
| `@reboot` | Boot पर एक बार | `@reboot /opt/app/start.sh` |
| `@daily` | `0 0 * * *` का shortcut | `@hourly`, `@weekly`, `@monthly` भी |

### उदाहरण

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

System-wide jobs `/etc/crontab` और `/etc/cron.d/` में रहते हैं (इनमें एक अतिरिक्त **user** field होता है), साथ ही `/etc/cron.daily/`, `/etc/cron.weekly/` जैसे folders भी। Access `/etc/cron.allow` और `/etc/cron.deny` से नियंत्रित होता है।

## at: बाद में एक बार चलाएँ

```bash
at 02:00 tomorrow
at> systemctl restart nginx
at> <Ctrl+D>
# job 4 at Sat Nov 28 02:00:00 2026

echo "/opt/scripts/cleanup.sh" | at now + 30 minutes
at -f deploy.sh 23:45          # read commands from a file
```

### atq और atrm

```bash
atq                    # list pending jobs (same as at -l)
# 4   Sat Nov 28 02:00:00 2026 a ashu
at -c 4                # show what job 4 will run
atrm 4                 # delete job 4 (same as at -d 4)
```

## batch: System खाली हो तब चलाएँ

`batch` commands को queue में रखता है और load average एक सीमा से नीचे आने पर चलाता है (`atd` के लिए default 1.5)।

```bash
echo "tar -czf /backup/logs.tgz /var/log" | batch
```

Batch jobs `atq` में queue `b` के अंतर्गत दिखते हैं। `at` और `batch` के लिए `atd` service चलनी चाहिए (`systemctl status atd`)।

## systemd Timers (संक्षेप में)

systemd वाले distros पर एक **timer** unit एक **service** unit को trigger करती है। Output journal में जाता है और `Persistent=true` से छूटे हुए runs बाद में पूरे हो जाते हैं।

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

Schedule किए जाने वाले scripts आमतौर पर shell scripts होते हैं; output log करने के लिए [shell scripting](../05_Shell_Scripting/README.md) और [redirection](../04_Commands/redirection.md) देखें।

## आम गलतियाँ

**Q1. मेरा script terminal में चलता है पर cron से नहीं। क्यों?**
cron बहुत छोटे `PATH` और environment के साथ चलता है। Absolute paths (`/usr/bin/python3`) इस्तेमाल करें, crontab के ऊपर `PATH=` सेट करें, और errors देखने के लिए output को log में redirect करें।

**Q2. Crontab line में `%` क्या करता है?**
इसे newline माना जाता है। इसे `\%` से escape करें, जैसे `date +\%F` में।

**Q3. `at` और `batch` में क्या अंतर है?**
`at` तय समय पर चलता है; `batch` तब चलता है जब system load काफ़ी कम हो जाए।

**Q4. हर 30 सेकंड पर job कैसे चलाएँ?**
cron की सबसे छोटी इकाई एक मिनट है। systemd timer (`OnUnitActiveSec=30s`) या दो cron lines इस्तेमाल करें, जिनमें से एक के आगे `sleep 30;` हो।

**Q5. `crontab -r` का ख़तरा क्या है?**
यह बिना पूछे पूरी crontab मिटा देता है, और keyboard पर `-e` के पास ही है। `crontab -l > cron.bak` से backup लें।
