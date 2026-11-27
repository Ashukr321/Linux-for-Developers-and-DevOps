# Unix और Linux क्या है?

ऑपरेटिंग सिस्टम की बुनियादी बातें, Unix, GNU और Linux का इतिहास, Unix परिवार के distros, CUI बनाम GUI, और X Window के डेस्कटॉप GNOME और KDE।

![Unix overview](../unix-1.png)

## ऑपरेटिंग सिस्टम क्या करता है

ऑपरेटिंग सिस्टम (OS) हार्डवेयर और आपके प्रोग्राम्स के बीच की सॉफ़्टवेयर परत है। यह तय करता है कि CPU, मेमोरी, डिस्क और नेटवर्क किस प्रोग्राम को मिलेगा, और प्रोग्राम्स को इन्हें इस्तेमाल करने का एक साफ़ तरीका देता है।

| काम | मतलब | Linux उदाहरण |
| :--- | :--- | :--- |
| Process management | प्रोग्राम बनाना, शेड्यूल करना और रोकना | `ps`, `kill`, scheduler |
| Memory management | हर process को उसका अपना address space देना | virtual memory, swap |
| File management | डेटा को files और directories में रखना | ext4, xfs, `/etc`, `/home` |
| Device management | डिस्क, कीबोर्ड, नेटवर्क कार्ड से बात करना | drivers, `/dev/sda` |
| Security | Users, groups, permissions | `chmod`, `sudo` |
| User interface | इंसान कमांड दे सके | shell (CUI) या desktop (GUI) |

Unix एक **multi-user, multi-tasking** OS है: एक साथ कई users लॉगिन कर सकते हैं और हर user एक साथ कई processes चला सकता है।

## संक्षिप्त इतिहास

| वर्ष | घटना |
| :--- | :--- |
| 1969 | Ken Thompson और Dennis Ritchie ने **AT&T Bell Labs** में Unix शुरू किया |
| 1973 | Unix को **C** में दोबारा लिखा गया, जिससे वह दूसरे हार्डवेयर पर पोर्ट हो सका |
| 1977 | UC Berkeley ने **BSD** (Berkeley Software Distribution) जारी किया |
| 1983 | Richard Stallman ने **GNU** प्रोजेक्ट की घोषणा की: एक मुफ़्त Unix-जैसा सिस्टम |
| 1988 | **POSIX** मानक ने तय किया कि प्रोग्राम्स के लिए "Unix-like" का मतलब क्या है |
| 1991 | Linus Torvalds ने **Linux kernel** 0.01 जारी किया |
| 1992 | Linux GPL लाइसेंस में आया और GNU tools के साथ जोड़ा गया |

GNU के पास compiler (`gcc`), shell (`bash`) और core utilities (`ls`, `cp`, `grep`) थे, लेकिन तैयार kernel नहीं था। Kernel Linux ने दिया। इसीलिए कुछ लोग **GNU/Linux** कहते हैं: सख़्ती से देखें तो Linux सिर्फ़ kernel है, पूरा सिस्टम = kernel + GNU userland + बाकी सॉफ़्टवेयर।

## Unix परिवार

```text
AT&T Unix (1969)
├── System V ── Solaris, AIX, HP-UX        (commercial Unix)
├── BSD ─────── FreeBSD, OpenBSD, NetBSD, macOS (Darwin)
└── Unix-like (no AT&T code)
    └── Linux ── Debian, Ubuntu, RHEL, Fedora, Rocky, Alpine, Arch
```

### प्रमुख Linux distributions

| Distro परिवार | Package manager | कहाँ मिलता है |
| :--- | :--- | :--- |
| Debian / Ubuntu | `apt`, `.deb` | डेवलपर लैपटॉप, cloud VMs, CI runners |
| RHEL / Rocky / Alma / Fedora | `dnf` (`yum`), `.rpm` | Enterprise servers |
| Amazon Linux | `dnf` | AWS EC2 |
| Alpine | `apk` | छोटी Docker images (~5 MB) |
| Arch | `pacman` | उत्साही users, rolling release |

```bash
cat /etc/os-release     # which distro am I on?
uname -r                # kernel version
```

नमूना आउटपुट:

```text
NAME="Ubuntu"
VERSION="22.04.4 LTS (Jammy Jellyfish)"
...
5.15.0-105-generic
```

## CUI बनाम GUI

| | CUI (Character User Interface) | GUI (Graphical User Interface) |
| :--- | :--- | :--- |
| Input | टाइप किए गए commands | माउस, windows, icons |
| Resources | बहुत हल्का | ज़्यादा RAM और GPU चाहिए |
| Automation | आसान: commands scripts में चले जाते हैं | script करना मुश्किल |
| Remote use | धीमे SSH link पर भी चलता है | VNC/RDP या X forwarding चाहिए |
| आम जगह | Servers, containers, CI | Desktops, laptops |

Production servers पर लगभग कभी GUI नहीं होता। DevOps के लिए CUI (shell) सीखना ही मुख्य कौशल है।

## X Window, GNOME और KDE

**X Window System** (X11, 1984, MIT) Unix की क्लासिक ग्राफ़िक्स परत है। यह windows बनाता है और माउस-कीबोर्ड संभालता है, लेकिन डेस्कटॉप कैसा दिखेगा यह तय नहीं करता। यह client-server तरीके से काम करता है, इसलिए remote server का प्रोग्राम अपनी window आपकी स्क्रीन पर दिखा सकता है (`ssh -X`)। आधुनिक distros अब **Wayland** की ओर जा रहे हैं, जो एक सरल विकल्प है।

X या Wayland के ऊपर एक **desktop environment** होता है:

| Desktop | Toolkit | अनुभव | डिफ़ॉल्ट कहाँ |
| :--- | :--- | :--- | :--- |
| **GNOME** | GTK | सरल, न्यूनतम | Ubuntu, Fedora, RHEL |
| **KDE Plasma** | Qt | बहुत customisable, Windows जैसा | Kubuntu, openSUSE |
| Xfce, LXQt | GTK / Qt | पुराने हार्डवेयर के लिए हल्का | Xubuntu, Lubuntu |

## आगे क्या पढ़ें

- [Unix का architecture](architecture.md)
- [Shells](shells.md)
- [Linux boot process](boot-process.md)
- [Filesystem की बुनियादी बातें](../02_Filesystem/README.md)

## इंटरव्यू प्रश्न

**Q1. Linux ऑपरेटिंग सिस्टम है या kernel?**
सख़्ती से kernel। एक उपयोगी OS (distro) = Linux kernel + GNU tools + package manager + बाकी सॉफ़्टवेयर।

**Q2. Unix और Linux में क्या अंतर है?**
Unix मूल AT&T सिस्टम और उसके certified वंशज (AIX, Solaris, macOS) हैं। Linux शुरू से लिखा गया Unix-like kernel है; यह POSIX का पालन करता है लेकिन इसमें AT&T का कोड नहीं है।

**Q3. Unix को multi-user और multi-tasking क्यों कहते हैं?**
एक साथ कई users लॉगिन हो सकते हैं, और kernel CPU को time-share करता है ताकि हर user एक साथ कई processes चला सके।

**Q4. Servers आमतौर पर बिना GUI के क्यों चलते हैं?**
GUI RAM और CPU बर्बाद करता है, attack surface बढ़ाता है, और उसे automate करना मुश्किल है। सब कुछ SSH और shell से होता है।
