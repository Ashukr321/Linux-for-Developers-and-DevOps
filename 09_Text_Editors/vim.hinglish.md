# Vim Commands ka Reference

Servers ke liye poora vim reference: vi vs vim vs neovim, movement, editing, registers, visual mode, search-replace, buffers, macros aur ek vimrc.

## vi, vim, vim.tiny aur neovim

| Editor | Ye kya hai | Kahan milta hai |
| :--- | :--- | :--- |
| `vi` | 1976 ka original editor; Linux par aksar vim ka link | Har Unix/Linux machine |
| `vim` | "Vi IMproved": syntax highlighting, undo tree, splits, plugins | Zyada tar distros (`apt install vim`) |
| `vim.tiny` | Chhota vim build, kam features, default mein vi-compatible | Ubuntu/Debian minimal par default `vi` |
| `nvim` | Neovim: vim ka modern fork, Lua config, built-in LSP | Developers ke laptops |

Modes (Normal, Insert, Command-line, Visual) [vi editor note](../05_Shell_Scripting/vi-editor.md) mein samjhaye gaye hain. Simple rule: kahin phas jao to `Esc` do baar dabao, tum wapas Normal mode mein ho.

## vim start karna

| Command | Asar |
| :--- | :--- |
| `vim file` | File kholo (ya banao) |
| `vim +42 file` | Line 42 par kholo |
| `vim +/error file` | `error` ke pehle match par kholo |
| `vim -R file` ya `view file` | Read-only |
| `vimdiff old new` | Side-by-side diff (`]c` / `[c` se changes ke beech jao) |
| `vim -u NONE file` | Bina vimrc ke start karo (kharab config debug karne ke liye) |

## Movement (Normal mode)

| Keys | Kahan jaata hai |
| :--- | :--- |
| `h` `j` `k` `l` | Left, down, up, right |
| `w` / `b` / `e` | Agle word ki shuruaat / pichhle word ki shuruaat / word ka end |
| `0` / `^` / `$` | Line ki shuruaat / pehla non-blank / line ka end |
| `gg` / `G` / `:42` ya `42G` | Pehli line / aakhri line / line 42 |
| `%` | Matching `( )`, `[ ]`, `{ }` |
| `fx` / `tx` | Aage character `x` par / uske theek pehle (`;` repeat karta hai) |
| `Ctrl+d` / `Ctrl+u` | Aadha page neeche / upar |
| `Ctrl+f` / `Ctrl+b` | Poora page neeche / upar |
| `H` / `M` / `L` | Screen ka top / middle / bottom |

## Text daalna aur editing

| Key | Kaam |
| :--- | :--- |
| `i` / `a` | Cursor se pehle / baad |
| `I` / `A` | Pehle non-blank par / line ke end mein |
| `o` / `O` | Neeche / upar nayi line par |
| `x` | Character delete |
| `dd` / `dw` / `D` | Line / word / line ke end tak delete |
| `cw` / `cc` / `C` | Word / line / line ke end tak change |
| `r` / `R` | Ek character replace / Replace mode (overtype) |
| `J` | Agli line ko is line se jodo |
| `.` | Pichhla change repeat karo |
| `u` / `Ctrl+r` | Undo / redo |

### Counts aur operators

Vim ka grammar hai **count + operator + motion**. Operators: `d` delete, `c` change, `y` yank, `>` indent, `<` unindent.

| Keys | Matlab |
| :--- | :--- |
| `3dd` | 3 lines delete |
| `d$` | Line ke end tak delete |
| `y2w` | 2 words yank |
| `>>` / `5>>` | Is line / 5 lines ko indent |
| `ci"` / `di(` | Quotes ke andar change / parentheses ke andar delete |

## Copy, paste aur registers

| Keys | Kaam |
| :--- | :--- |
| `yy` / `p` / `P` | Line yank / baad mein paste / pehle paste |
| `"ayy` / `"ap` | Register `a` mein yank / register `a` se paste |
| `"+y` / `"+p` | System clipboard mein yank / se paste (`+clipboard` chahiye) |
| `:reg` | Saare registers dikhao |

## Visual mode

`v` (characters), `V` (poori lines) ya `Ctrl+v` (rectangular block) se select karo. Select karne ke baad selection par `d`, `y`, `c`, `>` ya `:` chalao. **Block insert** (lines comment karna): `Ctrl+v`, `j` se neeche jao, `I` dabao, `# ` type karo, phir `Esc`; text har selected line par aa jaata hai.

## Search aur replace

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

| Command | Kaam |
| :--- | :--- |
| `:w` / `:w newname` | Save / naye naam se copy save |
| `:q` / `:q!` | Quit / changes chhod kar quit |
| `:wq`, `:x`, `ZZ` | Save karke quit (`:x` aur `ZZ` sirf change hone par likhte hain) |
| `:e other.conf` | Doosri file edit karo |
| `:r file` | Kisi file ka content cursor ke neeche daalo |
| `:saveas new.conf` | Save as karo aur nayi file par kaam jaari rakho |

## Buffers, windows aur tabs

| Command | Kaam |
| :--- | :--- |
| `:ls` / `:bn` / `:bp` / `:b2` | Buffers ki list / agla / pichhla / buffer 2 |
| `:sp file` / `:vsp file` | Horizontal / vertical split |
| `Ctrl+w w` / `Ctrl+w h j k l` | Agli window / kisi window par jao |
| `:tabnew file` / `gt` / `gT` | Naya tab / agla tab / pichhla tab |

## Macros aur marks

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

## Kaam ke : commands

| Command | Kaam |
| :--- | :--- |
| `:set number` / `:set relativenumber` | Line numbers / relative numbers |
| `:set paste` / `:set nopaste` | Auto-indent ke bina paste |
| `:!cmd` | Shell command chalao, jaise `:!ls` |
| `:r !cmd` | Command ka output daalo, jaise `:r !date` |
| `:sort` / `:sort u` | Lines sort / sort karke duplicates hatao |
| `:g/pattern/d` | Pattern wali har line delete |

## Ek sample ~/.vimrc

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
2. Line 50 par jao (`50G`), phir end par (`G`) aur wapas (`gg`).
3. `ssh` search karo (`/ssh`), `n` se aage badho, phir wo line delete karo (`dd`) aur undo karo (`u`).
4. Lines 1 se 40 mein har `tcp` ko `TCP` se confirmation ke saath badlo: `:1,40s/tcp/TCP/gc`.
5. Block insert se 5 lines comment karo (`Ctrl+v`, `4j`, `I`, `# `, `Esc`).
6. Aisa macro record karo jo line ke end mein `;` jode aur neeche jaaye (`qaA;<Esc>jq`), use `5@a` se chalao.
7. `udp` wali saari lines delete karo (`:g/udp/d`), phir nayi file mein save karo (`:w services-tcp.txt`) aur `:q!` se niklo.

## Common mistakes

| Galti | Fix |
| :--- | :--- |
| Normal mode mein type karna | `Esc`, undo ke liye `u`, phir `i` |
| Code paste karne par seedhi jaisa indent | Paste se pehle `:set paste`, ya `"+p` |
| `"+y` kuch nahi karta | vim mein `+clipboard` nahi hai; `vim-gtk3` install karo ya terminal ka copy use karo |
| Kholte waqt swap file warning | Koi aur edit kar raha hai, ya crash hua: `vim -r file`, phir `.file.swp` delete karo |

## Interview Questions

**Q1. `:wq` aur `:x` mein kya farq hai?**
`:wq` hamesha file likhta hai aur modification time badalta hai. `:x` (aur `ZZ`) sirf change hone par likhta hai.

**Q2. "DEBUG" wali saari lines kaise delete karein?**
`:g/DEBUG/d`. Ulta, sirf wahi lines rakhne ke liye `:v/DEBUG/d`.

**Q3. vim mein register kya hai?**
Yank ya delete kiye gaye text ko rakhne ki ek named jagah. `"ayy` register `a` mein yank karta hai, `"ap` use paste karta hai, `"+` system clipboard hai aur `:reg` sabki list dikhata hai.

**Q4. vi vs vim vs neovim?**
vi original POSIX editor hai; vim use badhata hai (highlighting, splits, plugins); neovim vim ka fork hai jismein Lua config aur built-in LSP hai.
