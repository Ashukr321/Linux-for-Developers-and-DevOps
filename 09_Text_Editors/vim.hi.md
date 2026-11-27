# Vim कमांड रेफ़रेंस

Servers के लिए पूरा vim reference: vi बनाम vim बनाम neovim, movement, editing, registers, visual mode, search-replace, macros और vimrc।

## vi, vim, vim.tiny और neovim

| Editor | यह क्या है | कहाँ मिलता है |
| :--- | :--- | :--- |
| `vi` | 1976 का मूल editor; Linux पर आमतौर पर vim का link | हर Unix/Linux मशीन |
| `vim` | "Vi IMproved": syntax highlighting, undo tree, splits, plugins | ज़्यादातर distros (`apt install vim`) |
| `vim.tiny` | छोटा vim build, कम features, default रूप से vi-compatible | Ubuntu/Debian minimal पर default `vi` |
| `nvim` | Neovim: vim का आधुनिक fork, Lua config, built-in LSP | Developers के laptops |

Modes (Normal, Insert, Command-line, Visual) [vi editor note](../05_Shell_Scripting/vi-editor.md) में समझाए गए हैं। आसान नियम: कहीं फँस जाएँ तो `Esc` दो बार दबाएँ, आप Normal mode में वापस होंगे।

## vim शुरू करना

| Command | असर |
| :--- | :--- |
| `vim file` | File खोलें (या बनाएँ) |
| `vim +42 file` | Line 42 पर खोलें |
| `vim +/error file` | `error` के पहले match पर खोलें |
| `vim -R file` या `view file` | Read-only |
| `vimdiff old new` | साथ-साथ diff (`]c` / `[c` से changes के बीच जाएँ) |
| `vim -u NONE file` | बिना vimrc के शुरू करें (ख़राब config debug करने के लिए) |

## Movement (Normal mode)

| Keys | कहाँ जाता है |
| :--- | :--- |
| `h` `j` `k` `l` | बाएँ, नीचे, ऊपर, दाएँ |
| `w` / `b` / `e` | अगले word की शुरुआत / पिछले word की शुरुआत / word का अंत |
| `0` / `^` / `$` | Line की शुरुआत / पहला non-blank / line का अंत |
| `gg` / `G` / `:42` या `42G` | पहली line / आख़िरी line / line 42 |
| `%` | मिलता हुआ `( )`, `[ ]`, `{ }` |
| `fx` / `tx` | आगे character `x` पर / उससे ठीक पहले (`;` दोहराता है) |
| `Ctrl+d` / `Ctrl+u` | आधा page नीचे / ऊपर |
| `Ctrl+f` / `Ctrl+b` | पूरा page नीचे / ऊपर |
| `H` / `M` / `L` | Screen का ऊपर / बीच / नीचे |

## Text डालना और editing

| Key | काम |
| :--- | :--- |
| `i` / `a` | Cursor से पहले / बाद |
| `I` / `A` | पहले non-blank पर / line के अंत में |
| `o` / `O` | नीचे / ऊपर नई line पर |
| `x` | Character delete |
| `dd` / `dw` / `D` | Line / word / line के अंत तक delete |
| `cw` / `cc` / `C` | Word / line / line के अंत तक बदलें |
| `r` / `R` | एक character बदलें / Replace mode (overtype) |
| `J` | अगली line को इस line से जोड़ें |
| `.` | पिछला change दोहराएँ |
| `u` / `Ctrl+r` | Undo / redo |

### Counts और operators

Vim का grammar है **count + operator + motion**। Operators: `d` delete, `c` change, `y` yank, `>` indent, `<` unindent।

| Keys | मतलब |
| :--- | :--- |
| `3dd` | 3 lines delete |
| `d$` | Line के अंत तक delete |
| `y2w` | 2 words yank |
| `>>` / `5>>` | इस line / 5 lines को indent |
| `ci"` / `di(` | Quotes के अंदर बदलें / parentheses के अंदर delete |

## Copy, paste और registers

| Keys | काम |
| :--- | :--- |
| `yy` / `p` / `P` | Line yank / बाद में paste / पहले paste |
| `"ayy` / `"ap` | Register `a` में yank / register `a` से paste |
| `"+y` / `"+p` | System clipboard में yank / से paste (`+clipboard` चाहिए) |
| `:reg` | सारे registers दिखाएँ |

## Visual mode

`v` (characters), `V` (पूरी lines) या `Ctrl+v` (आयताकार block) से चुनें। चुनने के बाद selection पर `d`, `y`, `c`, `>` या `:` चलाएँ। **Block insert** (lines comment करना): `Ctrl+v`, `j` से नीचे जाएँ, `I` दबाएँ, `# ` टाइप करें, फिर `Esc`; text हर चुनी हुई line पर आ जाता है।

## Search और replace

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

| Command | काम |
| :--- | :--- |
| `:w` / `:w newname` | Save / नए नाम से copy save |
| `:q` / `:q!` | बाहर निकलें / changes छोड़कर निकलें |
| `:wq`, `:x`, `ZZ` | Save करके निकलें (`:x` और `ZZ` सिर्फ़ बदलाव होने पर लिखते हैं) |
| `:e other.conf` | दूसरी file edit करें |
| `:r file` | किसी file का content cursor के नीचे डालें |
| `:saveas new.conf` | Save as करें और नई file पर काम जारी रखें |

## Buffers, windows और tabs

| Command | काम |
| :--- | :--- |
| `:ls` / `:bn` / `:bp` / `:b2` | Buffers की list / अगला / पिछला / buffer 2 |
| `:sp file` / `:vsp file` | Horizontal / vertical split |
| `Ctrl+w w` / `Ctrl+w h j k l` | अगली window / किसी window पर जाएँ |
| `:tabnew file` / `gt` / `gT` | नया tab / अगला tab / पिछला tab |

## Macros और marks

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

## काम के : commands

| Command | काम |
| :--- | :--- |
| `:set number` / `:set relativenumber` | Line numbers / relative numbers |
| `:set paste` / `:set nopaste` | Auto-indent के बिना paste |
| `:!cmd` | Shell command चलाएँ, जैसे `:!ls` |
| `:r !cmd` | Command का output डालें, जैसे `:r !date` |
| `:sort` / `:sort u` | Lines sort / sort करके duplicates हटाएँ |
| `:g/pattern/d` | Pattern वाली हर line delete |

## एक नमूना ~/.vimrc

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

## अभ्यास drill

1. `cp /etc/services ~/drill.txt && vim ~/drill.txt`
2. Line 50 पर जाएँ (`50G`), फिर अंत पर (`G`) और वापस (`gg`)।
3. `ssh` search करें (`/ssh`), `n` से आगे बढ़ें, फिर वह line delete करें (`dd`) और undo करें (`u`)।
4. Lines 1 से 40 में हर `tcp` को `TCP` से confirmation के साथ बदलें: `:1,40s/tcp/TCP/gc`।
5. Block insert से 5 lines comment करें (`Ctrl+v`, `4j`, `I`, `# `, `Esc`)।
6. ऐसा macro record करें जो line के अंत में `;` जोड़े और नीचे जाए (`qaA;<Esc>jq`), उसे `5@a` से चलाएँ।
7. `udp` वाली सारी lines delete करें (`:g/udp/d`), फिर नई file में save करें (`:w services-tcp.txt`) और `:q!` से निकलें।

## आम गलतियाँ

| गलती | सुधार |
| :--- | :--- |
| Normal mode में टाइप करना | `Esc`, undo के लिए `u`, फिर `i` |
| Code paste करने पर सीढ़ी जैसा indent | Paste से पहले `:set paste`, या `"+p` |
| `"+y` कुछ नहीं करता | vim में `+clipboard` नहीं है; `vim-gtk3` install करें या terminal का copy इस्तेमाल करें |
| खोलते समय swap file warning | कोई और edit कर रहा है, या crash हुआ: `vim -r file`, फिर `.file.swp` delete करें |

## Interview प्रश्न

**Q1. `:wq` और `:x` में क्या फ़र्क है?**
`:wq` हमेशा file लिखता है और modification time बदलता है। `:x` (और `ZZ`) सिर्फ़ बदलाव होने पर लिखता है।

**Q2. "DEBUG" वाली सारी lines कैसे delete करें?**
`:g/DEBUG/d`। उल्टा, सिर्फ़ वही lines रखने के लिए `:v/DEBUG/d`।

**Q3. vim में register क्या है?**
Yank या delete किए गए text को रखने की एक नामित जगह। `"ayy` register `a` में yank करता है, `"ap` उसे paste करता है, `"+` system clipboard है और `:reg` सबकी list दिखाता है।

**Q4. vi बनाम vim बनाम neovim?**
vi मूल POSIX editor है; vim उसे बढ़ाता है (highlighting, splits, plugins); neovim vim का fork है जिसमें Lua config और built-in LSP है।
