# Job Control aur Signals

Commands ko foreground ya background mein chalao, fg aur bg se switch karo, signals aur kill se roko, aur nohup, nice aur renice se CPU priority set karo.

## Foreground vs Background Jobs

**Job** woh command (ya pipeline) hai jo tumhare shell se start hui ho.

| Type | Behaviour | Example |
| :--- | :--- | :--- |
| **Foreground** | Terminal ko pakad ke rakhta hai; khatam hone par hi prompt wapas aata hai | `tar -czf backup.tgz /var/www` |
| **Background** | Chalta rehta hai aur tum prompt use karte rehte ho; `&` se start | `tar -czf backup.tgz /var/www &` |

```bash
sleep 300 &
# [1] 5142          <- job number 1, PID 5142
```

Job numbers (`%1`, `%2`) sirf current shell ke hote hain. PIDs poore system mein unique hote hain. Har job asal mein ek process hai, jaisa [processes overview](README.md) mein bataya gaya hai.

## Job Control Commands

| Command / Key | Kya karta hai |
| :--- | :--- |
| `command &` | Command ko background mein start karo |
| `jobs` / `jobs -l` | Is shell ke jobs list karo (`-l` se PIDs ke saath) |
| `fg %n` | Job `n` ko foreground mein lao |
| `bg %n` | Ruke hue job `n` ko background mein resume karo |
| Ctrl+Z | Foreground job ko suspend (stop) karo, `SIGTSTP` bhejta hai |
| Ctrl+C | Foreground job ko interrupt karo, `SIGINT` bhejta hai |
| `kill %n` | Job `n` ko `SIGTERM` bhejo |
| `disown %n` | Job ko shell ki table se hatao taaki logout ke baad bhi chale |

Ek typical session:

```bash
$ vim notes.txt        # editing...
^Z                     # Ctrl+Z
[1]+  Stopped                 vim notes.txt
$ sleep 600 &
[2] 5301
$ jobs -l
[1]+  5290 Stopped                 vim notes.txt
[2]-  5301 Running                 sleep 600 &
$ fg %1                # back into vim
$ kill %2              # terminate the sleep
```

`+` current job dikhata hai (`fg`/`bg` ka default), `-` pichla job.

## Signals

**Signal** kisi process ko bheji gayi chhoti asynchronous notification hai. Har signal ka ek number aur ek default action hota hai.

| Signal | No. | Kaun bhejta hai | Default action | Catch ho sakta hai? |
| :--- | :---: | :--- | :--- | :---: |
| `SIGHUP` | 1 | Terminal band hona; config reload ke liye bhi | Terminate | Haan |
| `SIGINT` | 2 | Ctrl+C | Terminate | Haan |
| `SIGQUIT` | 3 | Ctrl+\ | Terminate + core dump | Haan |
| `SIGKILL` | 9 | `kill -9` | Turant terminate | **Nahi** |
| `SIGTERM` | 15 | `kill` (default) | Gracefully terminate | Haan |
| `SIGCONT` | 18 | `fg`, `bg` | Ruka ho to continue | Haan |
| `SIGSTOP` | 19 | `kill -STOP` | Stop | **Nahi** |
| `SIGTSTP` | 20 | Ctrl+Z | Stop | Haan |

Yeh numbers x86/ARM Linux ke hain; portable rehne ke liye names use karo (`kill -l` saare list karta hai).

```bash
kill 5301              # SIGTERM: ask nicely, lets the app clean up
kill -TERM 5301        # same thing, explicit
kill -9 5301           # SIGKILL: last resort, no cleanup
kill -HUP $(pgrep -o nginx)   # many daemons reload config on SIGHUP
pkill -f "python app.py"      # signal by matching command line
killall node                  # signal by process name
```

Good practice: pehle `SIGTERM` bhejo, kuch seconds ruko, tabhi `SIGKILL`. Docker aur Kubernetes containers stop karte waqt bilkul yahi karte hain.

## nohup: Logout ke baad bhi chalta rahe

SSH session khatam hone par shell apne jobs ko `SIGHUP` bhejta hai aur woh mar jaate hain. `nohup` command se `SIGHUP` ignore karwata hai, aur agar stdout terminal ho to output `nohup.out` mein likhta hai.

```bash
nohup ./long-migration.sh > migration.log 2>&1 &
# [1] 6020
exit                   # the script keeps running
```

Real services ke liye `systemd` units, aur interactive kaam ke liye `tmux`/`screen` better hain.

## nice aur renice: CPU Priority

**Nice value** `-20` (sabse high priority) se `19` (sabse low) tak hoti hai. Default `0` hai. Normal users sirf niceness badha sakte hain ("nicer" banna); kam sirf root kar sakta hai.

```bash
nice -n 10 ./build.sh          # start with lower priority
sudo nice -n -5 ./critical.sh  # higher priority, needs root
renice -n 15 -p 6020           # change a running process
renice -n 5 -u ashu            # all processes of a user
ps -o pid,ni,cmd -p 6020       # NI column shows the value
```

## Common Mistakes

**Q1. SSH band karte hi mera background job kyun mar gaya?**
Use `SIGHUP` mila. Use `nohup` se start karo, `disown` chalao, ya `tmux` ya `systemd` service use karo.

**Q2. `kill -9` ko last resort kyun maanein?**
`SIGKILL` catch nahi hota, isliye process buffers flush nahi kar paata, lock files nahi hata paata aur connections close nahi kar paata. Data aadha-adhoora likha reh sakta hai.

**Q3. Ctrl+Z ne mera program kill kar diya, na?**
Nahi, sirf stop kiya hai. Woh abhi bhi memory aur ports pakde hue hai. `jobs` chalao, phir `fg` ya `kill %n`.

**Q4. Naye terminal mein `fg %1` "no such job" kyun bolta hai?**
Job numbers har shell ke alag hote hain. Doosre terminal se PID ke saath `kill` use karo.

**Q5. `nice -n -10` fail kyun hota hai?**
Negative nice values ke liye root chahiye. `sudo` use karo.
