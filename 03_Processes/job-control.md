# Job Control and Signals

Run commands in the foreground or background, switch them with fg and bg, stop them with signals and kill, and tune CPU priority with nohup, nice and renice.

## Foreground vs Background Jobs

A **job** is a command (or pipeline) started from your shell.

| Type | Behaviour | Example |
| :--- | :--- | :--- |
| **Foreground** | Owns the terminal; the prompt returns only when it finishes | `tar -czf backup.tgz /var/www` |
| **Background** | Runs while you keep using the prompt; started with `&` | `tar -czf backup.tgz /var/www &` |

```bash
sleep 300 &
# [1] 5142          <- job number 1, PID 5142
```

Job numbers (`%1`, `%2`) belong to the current shell. PIDs are system-wide. Every process is a process as described in the [processes overview](README.md).

## Job Control Commands

| Command / Key | What it does |
| :--- | :--- |
| `command &` | Start the command in the background |
| `jobs` / `jobs -l` | List jobs of this shell (with PIDs using `-l`) |
| `fg %n` | Bring job `n` to the foreground |
| `bg %n` | Resume stopped job `n` in the background |
| Ctrl+Z | Suspend (stop) the foreground job, sends `SIGTSTP` |
| Ctrl+C | Interrupt the foreground job, sends `SIGINT` |
| `kill %n` | Send `SIGTERM` to job `n` |
| `disown %n` | Remove job from the shell's table so it survives logout |

A typical session:

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

`+` marks the current job (the default for `fg`/`bg`), `-` marks the previous one.

## Signals

A **signal** is a small asynchronous notification sent to a process. Each has a number and a default action.

| Signal | No. | Sent by | Default action | Can be caught? |
| :--- | :---: | :--- | :--- | :---: |
| `SIGHUP` | 1 | Terminal closed; also used to reload config | Terminate | Yes |
| `SIGINT` | 2 | Ctrl+C | Terminate | Yes |
| `SIGQUIT` | 3 | Ctrl+\ | Terminate + core dump | Yes |
| `SIGKILL` | 9 | `kill -9` | Terminate immediately | **No** |
| `SIGTERM` | 15 | `kill` (default) | Terminate gracefully | Yes |
| `SIGCONT` | 18 | `fg`, `bg` | Continue if stopped | Yes |
| `SIGSTOP` | 19 | `kill -STOP` | Stop | **No** |
| `SIGTSTP` | 20 | Ctrl+Z | Stop | Yes |

Numbers shown are for Linux on x86/ARM; use names to be portable (`kill -l` lists them all).

```bash
kill 5301              # SIGTERM: ask nicely, lets the app clean up
kill -TERM 5301        # same thing, explicit
kill -9 5301           # SIGKILL: last resort, no cleanup
kill -HUP $(pgrep -o nginx)   # many daemons reload config on SIGHUP
pkill -f "python app.py"      # signal by matching command line
killall node                  # signal by process name
```

Good practice: send `SIGTERM`, wait a few seconds, and only then `SIGKILL`. Docker and Kubernetes do exactly this when stopping containers.

## nohup: Survive Logout

When your SSH session ends, the shell sends `SIGHUP` to its jobs and they die. `nohup` makes the command ignore `SIGHUP` and writes output to `nohup.out` if stdout is a terminal.

```bash
nohup ./long-migration.sh > migration.log 2>&1 &
# [1] 6020
exit                   # the script keeps running
```

For real services prefer `systemd` units, or `tmux`/`screen` for interactive work.

## nice and renice: CPU Priority

The **nice value** ranges from `-20` (highest priority) to `19` (lowest). Default is `0`. Normal users can only raise niceness (be "nicer"); only root can lower it.

```bash
nice -n 10 ./build.sh          # start with lower priority
sudo nice -n -5 ./critical.sh  # higher priority, needs root
renice -n 15 -p 6020           # change a running process
renice -n 5 -u ashu            # all processes of a user
ps -o pid,ni,cmd -p 6020       # NI column shows the value
```

## Common Mistakes

**Q1. Why did my background job die when I closed SSH?**
It received `SIGHUP`. Start it with `nohup`, run `disown`, or use `tmux` or a `systemd` service.

**Q2. Why use `kill -9` only as a last resort?**
`SIGKILL` cannot be caught, so the process cannot flush buffers, remove lock files or close connections. Data can be left half-written.

**Q3. Ctrl+Z killed my program, right?**
No, it only stopped it. It still holds memory and ports. Use `jobs`, then `fg` or `kill %n`.

**Q4. Why does `fg %1` say "no such job" in a new terminal?**
Job numbers are per shell. From another terminal use the PID with `kill` instead.

**Q5. Why does `nice -n -10` fail?**
Negative nice values need root. Use `sudo`.
