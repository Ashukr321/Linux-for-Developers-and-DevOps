# Unix aur Linux kya hai?

Operating system basics, Unix, GNU aur Linux ki history, Unix family ke distros, CUI vs GUI, aur X Window ke desktops GNOME aur KDE.

![Unix overview](../unix-1.png)

## Operating system kya karta hai

Operating system (OS) hardware aur aapke programs ke beech ki software layer hai. Yeh decide karta hai ki CPU, memory, disk aur network kis program ko milega, aur programs ko unhe use karne ka ek clean tareeka deta hai.

| Kaam | Matlab | Linux example |
| :--- | :--- | :--- |
| Process management | Programs ko create, schedule aur stop karna | `ps`, `kill`, scheduler |
| Memory management | Har process ko apna address space dena | virtual memory, swap |
| File management | Data ko files aur directories mein store karna | ext4, xfs, `/etc`, `/home` |
| Device management | Disk, keyboard, network card se baat karna | drivers, `/dev/sda` |
| Security | Users, groups, permissions | `chmod`, `sudo` |
| User interface | Insaan commands de sake | shell (CUI) ya desktop (GUI) |

Unix ek **multi-user, multi-tasking** OS hai: ek saath kai users login kar sakte hain aur har user ek saath kai processes chala sakta hai.

## Thodi si history

| Saal | Event |
| :--- | :--- |
| 1969 | Ken Thompson aur Dennis Ritchie ne **AT&T Bell Labs** mein Unix shuru kiya |
| 1973 | Unix ko **C** mein dobara likha gaya, jisse woh dusre hardware par port ho saka |
| 1977 | UC Berkeley ne **BSD** (Berkeley Software Distribution) release kiya |
| 1983 | Richard Stallman ne **GNU** project announce kiya: ek free Unix-like system |
| 1988 | **POSIX** standard ne define kiya ki programs ke liye "Unix-like" ka matlab kya hai |
| 1991 | Linus Torvalds ne **Linux kernel** 0.01 release kiya |
| 1992 | Linux GPL license mein aaya aur GNU tools ke saath joda gaya |

GNU ke paas compiler (`gcc`), shell (`bash`) aur core utilities (`ls`, `cp`, `grep`) the, lekin ready kernel nahi tha. Kernel Linux ne diya. Isliye kuch log **GNU/Linux** bolte hain: strictly Linux sirf kernel hai, poora system = kernel + GNU userland + baaki software.

## Unix family

```text
AT&T Unix (1969)
├── System V ── Solaris, AIX, HP-UX        (commercial Unix)
├── BSD ─────── FreeBSD, OpenBSD, NetBSD, macOS (Darwin)
└── Unix-like (no AT&T code)
    └── Linux ── Debian, Ubuntu, RHEL, Fedora, Rocky, Alpine, Arch
```

### Common Linux distributions

| Distro family | Package manager | Kahan milta hai |
| :--- | :--- | :--- |
| Debian / Ubuntu | `apt`, `.deb` | Developer laptops, cloud VMs, CI runners |
| RHEL / Rocky / Alma / Fedora | `dnf` (`yum`), `.rpm` | Enterprise servers |
| Amazon Linux | `dnf` | AWS EC2 |
| Alpine | `apk` | Chhoti Docker images (~5 MB) |
| Arch | `pacman` | Enthusiasts, rolling release |

```bash
cat /etc/os-release     # which distro am I on?
uname -r                # kernel version
```

Sample output:

```text
NAME="Ubuntu"
VERSION="22.04.4 LTS (Jammy Jellyfish)"
...
5.15.0-105-generic
```

## CUI vs GUI

| | CUI (Character User Interface) | GUI (Graphical User Interface) |
| :--- | :--- | :--- |
| Input | Type kiye gaye commands | Mouse, windows, icons |
| Resources | Bahut halka | Zyada RAM aur GPU chahiye |
| Automation | Aasaan: commands scripts mein chale jaate hain | Script karna mushkil |
| Remote use | Slow SSH link par bhi chalta hai | VNC/RDP ya X forwarding chahiye |
| Typical jagah | Servers, containers, CI | Desktops, laptops |

Production servers par lagbhag kabhi GUI nahi hota. DevOps ke liye CUI (shell) seekhna hi main skill hai.

## X Window, GNOME aur KDE

**X Window System** (X11, 1984, MIT) Unix ki classic graphics layer hai. Yeh windows draw karta hai aur mouse-keyboard handle karta hai, lekin desktop kaisa dikhega yeh decide nahi karta. Yeh client-server tarah kaam karta hai, isliye remote server ka program apni window aapki screen par dikha sakta hai (`ssh -X`). Modern distros ab **Wayland** par shift ho rahe hain, jo ek simple replacement hai.

X ya Wayland ke upar ek **desktop environment** hota hai:

| Desktop | Toolkit | Feel | Default kahan |
| :--- | :--- | :--- | :--- |
| **GNOME** | GTK | Simple, minimal | Ubuntu, Fedora, RHEL |
| **KDE Plasma** | Qt | Bahut customisable, Windows jaisa | Kubuntu, openSUSE |
| Xfce, LXQt | GTK / Qt | Purane hardware ke liye lightweight | Xubuntu, Lubuntu |

## Aage kya padhein

- [Unix ka architecture](architecture.md)
- [Shells](shells.md)
- [Linux boot process](boot-process.md)
- [Filesystem basics](../02_Filesystem/README.md)

## Interview questions

**Q1. Linux operating system hai ya kernel?**
Strictly kernel. Ek usable OS (distro) = Linux kernel + GNU tools + package manager + baaki software.

**Q2. Unix aur Linux mein kya fark hai?**
Unix original AT&T system aur uske certified descendants (AIX, Solaris, macOS) hain. Linux scratch se likha gaya Unix-like kernel hai; yeh POSIX follow karta hai lekin isme AT&T ka code nahi hai.

**Q3. Unix ko multi-user aur multi-tasking kyun kehte hain?**
Ek saath kai users login ho sakte hain, aur kernel CPU ko time-share karta hai taaki har user ek saath kai processes chala sake.

**Q4. Servers aam taur par bina GUI ke kyun chalte hain?**
GUI RAM aur CPU waste karta hai, attack surface badhata hai, aur use automate karna mushkil hai. Sab kuch SSH aur shell se hota hai.
