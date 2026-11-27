# Vim Command Reference

A complete, grouped vim reference for servers: vi vs vim vs neovim, movement, editing, registers, visual mode, search and replace, buffers, macros and a vimrc.

## vi, vim, vim.tiny and neovim

| Editor | What it is | Where you meet it |
| :--- | :--- | :--- |
| `vi` | The original 1976 editor; on Linux it is usually a link to vim | Every Unix/Linux box |
| `vim` | "Vi IMproved": syntax highlighting, undo tree, splits, plugins | Most distros (`apt install vim`) |
| `vim.tiny` | Minimal vim build, few features, vi-compatible by default | Default `vi` on Ubuntu/Debian minimal |
| `nvim` | Neovim: modern vim fork, Lua config, built-in LSP | Developer laptops |

The modes (Normal, Insert, Command-line, Visual) are explained in the [vi editor note](../05_Shell_Scripting/vi-editor.md). Rule of thumb: when lost, press `Esc` twice and you are back in Normal mode.

## Starting vim

| Command | Effect |
| :--- | :--- |
| `vim file` | Open (or create) a file |
| `vim +42 file` | Open at line 42 |
| `vim +/error file` | Open at the first match of `error` |
| `vim -R file` or `view file` | Read-only |
| `vimdiff old new` | Side-by-side diff (`]c` / `[c` jump between changes) |
| `vim -u NONE file` | Start without any vimrc (debug a broken config) |

## Movement (Normal mode)

| Keys | Moves to |
| :--- | :--- |
| `h` `j` `k` `l` | Left, down, up, right |
| `w` / `b` / `e` | Next word start / previous word start / word end |
| `0` / `^` / `$` | Line start / first non-blank / line end |
| `gg` / `G` / `:42` or `42G` | First line / last line / line 42 |
| `%` | Matching `( )`, `[ ]`, `{ }` |
| `fx` / `tx` | Forward onto / just before character `x` (`;` repeats) |
| `Ctrl+d` / `Ctrl+u` | Half page down / up |
| `Ctrl+f` / `Ctrl+b` | Full page down / up |
| `H` / `M` / `L` | Top / middle / bottom of the screen |

## Inserting and editing

| Key | Action |
| :--- | :--- |
| `i` / `a` | Before / after the cursor |
| `I` / `A` | At first non-blank / end of line |
| `o` / `O` | On a new line below / above |
| `x` | Delete character |
| `dd` / `dw` / `D` | Delete line / word / to end of line |
| `cw` / `cc` / `C` | Change word / line / to end of line |
| `r` / `R` | Replace one character / Replace mode (overtype) |
| `J` | Join next line onto this one |
| `.` | Repeat the last change |
| `u` / `Ctrl+r` | Undo / redo |

### Counts and operators

Vim grammar is **count + operator + motion**. Operators: `d` delete, `c` change, `y` yank, `>` indent, `<` unindent.

| Keys | Meaning |
| :--- | :--- |
| `3dd` | Delete 3 lines |
| `d$` | Delete to end of line |
| `y2w` | Yank 2 words |
| `>>` / `5>>` | Indent this line / 5 lines |
| `ci"` / `di(` | Change inside quotes / delete inside parentheses |

## Copy, paste and registers

| Keys | Action |
| :--- | :--- |
| `yy` / `p` / `P` | Yank line / paste after / paste before |
| `"ayy` / `"ap` | Yank into register `a` / paste from register `a` |
| `"+y` / `"+p` | Yank to / paste from the system clipboard (needs `+clipboard`) |
| `:reg` | Show all registers |

## Visual mode

Select with `v` (characters), `V` (whole lines) or `Ctrl+v` (a rectangular block). After selecting, use `d`, `y`, `c`, `>` or `:` on the selection. **Block insert** (comment out lines): `Ctrl+v`, move down with `j`, press `I`, type `# `, then `Esc`; the text appears on every selected line.

## Search and replace

```vim
/text  ?text           " search forward / backward (n = next, N = previous)
*  #                   " search word under cursor forward / backward
:noh                   " clear search highlighting
:s/old/new/            " first match on the current line
:s/old/new/g           " all matches on the current line
:%s/old/new/g          " whole file
:%s/old/new/gc         " whole file, confirm each (y/n/a/q)
:10,20s/http/https/g   " only lines 10 to 20
:'<,'>s/^/# /          " the visual selection (auto-filled after :)
&                      " repeat the last :s on the current line
```

## Files

| Command | Action |
| :--- | :--- |
| `:w` / `:w newname` | Save / save a copy under a new name |
| `:q` / `:q!` | Quit / quit and discard changes |
| `:wq`, `:x`, `ZZ` | Save and quit (`:x` and `ZZ` write only if changed) |
| `:e other.conf` | Edit another file |
| `:r file` | Insert a file's content below the cursor |
| `:saveas new.conf` | Save as and keep editing the new file |

## Buffers, windows and tabs

| Command | Action |
| :--- | :--- |
| `:ls` / `:bn` / `:bp` / `:b2` | List buffers / next / previous / buffer 2 |
| `:sp file` / `:vsp file` | Horizontal / vertical split |
| `Ctrl+w w` / `Ctrl+w h j k l` | Next window / move to a window |
| `:tabnew file` / `gt` / `gT` | New tab / next tab / previous tab |

## Macros and marks

```vim
qa        " start recording into register a
...       " do the edit once (end on the next line with j)
q         " stop recording
@a        " play macro a
@@        " repeat the last macro

ma        " set mark a at the cursor
'a        " jump to the line of mark a
`a        " jump to the exact position of mark a
``        " jump back to where you were before the last jump
```

## Useful : commands

| Command | Action |
| :--- | :--- |
| `:set number` / `:set relativenumber` | Line numbers / relative numbers |
| `:set paste` / `:set nopaste` | Paste without auto-indent |
| `:!cmd` | Run a shell command, e.g. `:!ls` |
| `:r !cmd` | Insert command output, e.g. `:r !date` |
| `:sort` / `:sort u` | Sort lines / sort and remove duplicates |
| `:g/pattern/d` | Delete every line matching pattern |

## A sample ~/.vimrc

```vim
" ~/.vimrc - minimal, server-friendly settings
set nocompatible        " use vim features, not strict vi mode
syntax on               " syntax highlighting
set number              " show line numbers
set expandtab           " insert spaces instead of tabs
set tabstop=4           " a tab looks like 4 columns
set shiftwidth=4        " >> and << shift by 4
set autoindent          " keep indentation of the previous line
set hlsearch incsearch  " highlight matches, search while typing
set ignorecase smartcase " case-insensitive unless you type capitals
set list listchars=tab:>-,trail:.  " show tabs and trailing spaces
autocmd FileType yaml setlocal tabstop=2 shiftwidth=2
```

## Practice drill

1. `cp /etc/services ~/drill.txt && vim ~/drill.txt`
2. Jump to line 50 (`50G`), then to the end (`G`) and back (`gg`).
3. Search for `ssh` (`/ssh`), step with `n`, then delete that line (`dd`) and undo (`u`).
4. Replace every `tcp` with `TCP` on lines 1 to 40 with confirmation: `:1,40s/tcp/TCP/gc`.
5. Comment out 5 lines with block insert (`Ctrl+v`, `4j`, `I`, `# `, `Esc`).
6. Record a macro that appends `;` to a line and moves down (`qaA;<Esc>jq`), run it with `5@a`.
7. Delete all lines with `udp` (`:g/udp/d`), then save as a new file (`:w services-tcp.txt`) and quit with `:q!`.

## Common mistakes

| Mistake | Fix |
| :--- | :--- |
| Typing while in Normal mode | `Esc`, `u` to undo, then `i` |
| Pasting code gives a staircase indent | `:set paste` before pasting, or `"+p` |
| `"+y` does nothing | vim lacks `+clipboard`; install `vim-gtk3` or use your terminal's copy |
| Swap file warning on open | Someone else is editing, or a crash: `vim -r file`, then delete `.file.swp` |

## Interview Questions

**Q1. What is the difference between `:wq` and `:x`?**
`:wq` always writes the file, updating its modification time. `:x` (and `ZZ`) writes only if there are changes.

**Q2. How do you delete all lines containing "DEBUG"?**
`:g/DEBUG/d`. The inverse, keeping only those lines, is `:v/DEBUG/d`.

**Q3. What is a register in vim?**
A named storage slot for yanked or deleted text. `"ayy` yanks into register `a`, `"ap` pastes it, `"+` is the system clipboard and `:reg` lists them.

**Q4. vi vs vim vs neovim?**
vi is the original POSIX editor; vim extends it (highlighting, splits, plugins); neovim is a vim fork with Lua config and built-in LSP.
