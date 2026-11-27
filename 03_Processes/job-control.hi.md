# Job Control और Signals

Commands को foreground या background में चलाएँ, fg और bg से बदलें, signals और kill से रोकें, और nohup, nice व renice से CPU priority तय करें।

## Foreground बनाम Background Jobs

**Job** वह command (या pipeline) है जो आपके shell से शुरू हुई हो।

| प्रकार | व्यवहार | उदाहरण |
| :--- | :--- | :--- |
| **Foreground** | Terminal पर कब्ज़ा रखता है; ख़त्म होने पर ही prompt लौटता है | `tar -czf backup.tgz /var/www` |
| **Background** | चलता रहता है और आप prompt इस्तेमाल करते रहते हैं; `&` से शुरू | `tar -czf backup.tgz /var/www &` |

```bash
sleep 300 &
# [1] 5142          <- job number 1, PID 5142
```

Job नंबर (`%1`, `%2`) सिर्फ़ मौजूदा shell के होते हैं। PID पूरे system में unique होते हैं। हर job असल में एक प्रोसेस है, जैसा [processes overview](README.md) में बताया गया है।

## Job Control Commands

| Command / Key | क्या करता है |
| :--- | :--- |
| `command &` | Command को background में शुरू करें |
| `jobs` / `jobs -l` | इस shell के jobs दिखाएँ (`-l` से PIDs के साथ) |
| `fg %n` | Job `n` को foreground में लाएँ |
| `bg %n` | रुके हुए job `n` को background में चालू करें |
| Ctrl+Z | Foreground job को suspend (stop) करें, `SIGTSTP` भेजता है |
| Ctrl+C | Foreground job को interrupt करें, `SIGINT` भेजता है |
| `kill %n` | Job `n` को `SIGTERM` भेजें |
| `disown %n` | Job को shell की table से हटाएँ ताकि logout के बाद भी चलता रहे |

एक सामान्य session:

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

`+` मौजूदा job दिखाता है (`fg`/`bg` का default), `-` पिछला job।

## Signals

**Signal** किसी प्रोसेस को भेजी गई छोटी asynchronous सूचना है। हर signal का एक नंबर और एक default action होता है।

| Signal | No. | कौन भेजता है | Default action | Catch हो सकता है? |
| :--- | :---: | :--- | :--- | :---: |
| `SIGHUP` | 1 | Terminal बंद होना; config reload के लिए भी | Terminate | हाँ |
| `SIGINT` | 2 | Ctrl+C | Terminate | हाँ |
| `SIGQUIT` | 3 | Ctrl+\ | Terminate + core dump | हाँ |
| `SIGKILL` | 9 | `kill -9` | तुरंत terminate | **नहीं** |
| `SIGTERM` | 15 | `kill` (default) | Gracefully terminate | हाँ |
| `SIGCONT` | 18 | `fg`, `bg` | रुका हो तो फिर चलाएँ | हाँ |
| `SIGSTOP` | 19 | `kill -STOP` | Stop | **नहीं** |
| `SIGTSTP` | 20 | Ctrl+Z | Stop | हाँ |

ये नंबर x86/ARM Linux के हैं; portable रहने के लिए नाम इस्तेमाल करें (`kill -l` सभी दिखाता है)।

```bash
kill 5301              # SIGTERM: ask nicely, lets the app clean up
kill -TERM 5301        # same thing, explicit
kill -9 5301           # SIGKILL: last resort, no cleanup
kill -HUP $(pgrep -o nginx)   # many daemons reload config on SIGHUP
pkill -f "python app.py"      # signal by matching command line
killall node                  # signal by process name
```

अच्छा तरीका: पहले `SIGTERM` भेजें, कुछ सेकंड रुकें, फिर ही `SIGKILL`। Docker और Kubernetes containers रोकते समय ठीक यही करते हैं।

## nohup: Logout के बाद भी चलता रहे

SSH session ख़त्म होने पर shell अपने jobs को `SIGHUP` भेजता है और वे मर जाते हैं। `nohup` command को `SIGHUP` नज़रअंदाज़ करवाता है, और अगर stdout terminal हो तो output `nohup.out` में लिखता है।

```bash
nohup ./long-migration.sh > migration.log 2>&1 &
# [1] 6020
exit                   # the script keeps running
```

असली services के लिए `systemd` units, और interactive काम के लिए `tmux`/`screen` बेहतर हैं।

## nice और renice: CPU Priority

**Nice value** `-20` (सबसे ऊँची priority) से `19` (सबसे नीची) तक होती है। Default `0` है। सामान्य user सिर्फ़ niceness बढ़ा सकते हैं ("nicer" बनना); घटाना सिर्फ़ root कर सकता है।

```bash
nice -n 10 ./build.sh          # start with lower priority
sudo nice -n -5 ./critical.sh  # higher priority, needs root
renice -n 15 -p 6020           # change a running process
renice -n 5 -u ashu            # all processes of a user
ps -o pid,ni,cmd -p 6020       # NI column shows the value
```

## आम गलतियाँ

**Q1. SSH बंद करते ही मेरा background job क्यों मर गया?**
उसे `SIGHUP` मिला। उसे `nohup` से शुरू करें, `disown` चलाएँ, या `tmux` या `systemd` service इस्तेमाल करें।

**Q2. `kill -9` को आख़िरी उपाय क्यों मानें?**
`SIGKILL` catch नहीं होता, इसलिए प्रोसेस buffers flush नहीं कर पाता, lock files नहीं हटा पाता और connections बंद नहीं कर पाता। Data आधा-अधूरा लिखा रह सकता है।

**Q3. Ctrl+Z ने मेरा प्रोग्राम ख़त्म कर दिया, है ना?**
नहीं, सिर्फ़ रोका है। वह अब भी memory और ports पकड़े हुए है। `jobs` चलाएँ, फिर `fg` या `kill %n`।

**Q4. नए terminal में `fg %1` "no such job" क्यों कहता है?**
Job नंबर हर shell के अलग होते हैं। दूसरे terminal से PID के साथ `kill` इस्तेमाल करें।

**Q5. `nice -n -10` fail क्यों होता है?**
Negative nice values के लिए root चाहिए। `sudo` इस्तेमाल करें।
