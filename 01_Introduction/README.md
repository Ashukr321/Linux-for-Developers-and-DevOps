# What is Unix and Linux?

Operating system basics, the history of Unix, GNU and Linux, the Unix family of distros, CUI vs GUI, and the X Window desktops GNOME and KDE.

![Unix overview](../unix-1.png)

## What an operating system does

An operating system (OS) is the software layer between hardware and the programs you run. It decides who gets the CPU, memory, disk and network, and it gives programs a clean way to use them.

| Job | What it means | Linux example |
| :--- | :--- | :--- |
| Process management | Create, schedule and stop programs | `ps`, `kill`, the scheduler |
| Memory management | Give each process its own address space | virtual memory, swap |
| File management | Store data as files and directories | ext4, xfs, `/etc`, `/home` |
| Device management | Talk to disks, keyboards, network cards | drivers, `/dev/sda` |
| Security | Users, groups, permissions | `chmod`, `sudo` |
| User interface | Let humans give commands | shell (CUI) or desktop (GUI) |

Unix is a **multi-user, multi-tasking** OS: many users can log in at the same time and each can run many processes at once.

## A short history

| Year | Event |
| :--- | :--- |
| 1969 | Ken Thompson and Dennis Ritchie start Unix at **AT&T Bell Labs** |
| 1973 | Unix is rewritten in **C**, which makes it portable to other hardware |
| 1977 | UC Berkeley releases **BSD** (Berkeley Software Distribution) |
| 1983 | Richard Stallman announces the **GNU** project: a free Unix-like system |
| 1988 | **POSIX** standard defines what "Unix-like" means for programs |
| 1991 | Linus Torvalds releases the **Linux kernel** 0.01 |
| 1992 | Linux is relicensed under the GPL and combined with GNU tools |

GNU had the compiler (`gcc`), shell (`bash`), and core utilities (`ls`, `cp`, `grep`) but no finished kernel. Linux supplied the kernel. That is why some people say **GNU/Linux**: Linux is strictly the kernel, a full system is kernel + GNU userland + other software.

## The Unix family

```text
AT&T Unix (1969)
├── System V ── Solaris, AIX, HP-UX        (commercial Unix)
├── BSD ─────── FreeBSD, OpenBSD, NetBSD, macOS (Darwin)
└── Unix-like (no AT&T code)
    └── Linux ── Debian, Ubuntu, RHEL, Fedora, Rocky, Alpine, Arch
```

### Common Linux distributions

| Distro family | Package manager | Where you meet it |
| :--- | :--- | :--- |
| Debian / Ubuntu | `apt`, `.deb` | Developer laptops, cloud VMs, CI runners |
| RHEL / Rocky / Alma / Fedora | `dnf` (`yum`), `.rpm` | Enterprise servers |
| Amazon Linux | `dnf` | AWS EC2 |
| Alpine | `apk` | Small Docker images (~5 MB) |
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
| Input | Typed commands | Mouse, windows, icons |
| Resources | Very light | Needs more RAM and a GPU |
| Automation | Easy: commands go into scripts | Hard to script |
| Remote use | Works over slow SSH links | Needs VNC/RDP or X forwarding |
| Typical place | Servers, containers, CI | Desktops, laptops |

Production servers almost never have a GUI. Learning the CUI (the shell) is the main skill for DevOps.

## X Window, GNOME and KDE

The **X Window System** (X11, 1984, MIT) is the classic graphics layer for Unix. It draws windows and handles the mouse and keyboard, but it does not decide how the desktop looks. It works as a client-server system, so a program on a remote server can show its window on your screen (`ssh -X`). Modern distros are moving to **Wayland**, a simpler replacement.

On top of X or Wayland sits a **desktop environment**:

| Desktop | Toolkit | Feel | Default on |
| :--- | :--- | :--- | :--- |
| **GNOME** | GTK | Simple, minimal | Ubuntu, Fedora, RHEL |
| **KDE Plasma** | Qt | Highly customisable, Windows-like | Kubuntu, openSUSE |
| Xfce, LXQt | GTK / Qt | Lightweight for old hardware | Xubuntu, Lubuntu |

## Where to go next

- [Architecture of Unix](architecture.md)
- [Shells](shells.md)
- [Linux boot process](boot-process.md)
- [Filesystem basics](../02_Filesystem/README.md)

## Interview questions

**Q1. Is Linux an operating system or a kernel?**
Strictly a kernel. A usable OS (a distro) is the Linux kernel plus GNU tools, a package manager and other software.

**Q2. What is the difference between Unix and Linux?**
Unix is the original AT&T system and its certified descendants (AIX, Solaris, macOS). Linux is a Unix-like kernel written from scratch; it follows POSIX but contains no AT&T code.

**Q3. Why is Unix called multi-user and multi-tasking?**
Several users can be logged in at once, and the kernel time-shares the CPU so each user can run many processes simultaneously.

**Q4. Why do servers usually run without a GUI?**
A GUI wastes RAM and CPU, adds attack surface, and cannot be automated easily. Everything is done through SSH and the shell.
