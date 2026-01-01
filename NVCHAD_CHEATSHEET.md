# NvChad Cheatsheet

> **Note**: `<leader>` is mapped to `SPACE` in NvChad

---

## 📁 File Tree (NvimTree)

### Opening/Toggling File Tree
| Shortcut | Action |
|----------|--------|
| `Ctrl + n` | Toggle file tree (open/close) |
| `Space + e` | Focus file tree |

### Inside File Tree - Navigation
| Key | Action |
|-----|--------|
| `j` / `k` | Move down/up |
| `H` | Toggle hidden files (dotfiles) |
| `E` | Expand all folders |
| `W` | Collapse all folders |
| `Ctrl + k` | Show file info |
| `/` | Search files in tree |
| `f` | Filter files (type to filter, `Ctrl+c` to clear) |
| `g?` | Show all keybindings help |

### Inside File Tree - Opening Files
| Key | Action |
|-----|--------|
| `Enter` or `o` | Open file/folder |
| `Tab` | Open file but keep cursor in tree |
| `Ctrl + t` | **Open in new tab** |
| `Ctrl + v` | Open in vertical split |
| `Ctrl + x` | Open in horizontal split |
| `P` | Navigate to parent directory |
| `-` | Navigate up to parent directory |

### Inside File Tree - File Operations
| Key | Action |
|-----|--------|
| `a` | Create new file (add `/` at end for folder) |
| `r` | Rename file |
| `d` | Delete file |
| `x` | Cut file |
| `c` | Copy file |
| `p` | Paste file |
| `y` | Copy filename to clipboard |
| `Y` | Copy relative path |
| `gy` | Copy absolute path |

### Inside File Tree - Other
| Key | Action |
|-----|--------|
| `R` | Refresh tree |
| `s` | Open file with system default app |
| `]c` | Go to next git changed file |
| `[c` | Go to previous git changed file |
| `q` | Close file tree |

---

## 📑 Buffers/Tabs Management

| Shortcut | Action |
|----------|--------|
| `Space + b` | Create new buffer |
| `Tab` | Go to next buffer |
| `Shift + Tab` | Go to previous buffer |
| `Space + x` | Close current buffer |
| `Space + fb` | Telescope: find/search buffers |

---

## 🔍 Telescope (Fuzzy Finder)

| Shortcut | Action |
|----------|--------|
| `Space + ff` | Find files |
| `Space + fa` | Find all files (including hidden/ignored) |
| `Space + fw` | Live grep (search text in files) |
| `Space + fb` | Find buffers |
| `Space + fh` | Find help tags |
| `Space + fo` | Find old/recent files |
| `Space + fz` | Fuzzy find in current buffer |
| `Space + cm` | Git commits |
| `Space + gt` | Git status |
| `Space + th` | Change theme |

### Inside Telescope
| Key | Action |
|-----|--------|
| `Ctrl + j` / `Ctrl + k` | Move down/up in results |
| `Enter` | Open selected file |
| `Ctrl + x` | Open in horizontal split |
| `Ctrl + v` | Open in vertical split |
| `Ctrl + t` | Open in new tab |
| `Esc` | Close Telescope |

---

## 🪟 Window/Pane Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl + h` | Move to left window |
| `Ctrl + l` | Move to right window |
| `Ctrl + j` | Move to window below |
| `Ctrl + k` | Move to window above |

---

## 💻 Terminal

| Shortcut | Action |
|----------|--------|
| `Space + h` | New horizontal terminal |
| `Space + v` | New vertical terminal |
| `Alt + i` | Toggle floating terminal |
| `Alt + h` | Toggle horizontal terminal |
| `Alt + v` | Toggle vertical terminal |
| `Ctrl + x` | Exit terminal mode (inside terminal) |

---

## ✏️ Editing

| Shortcut | Action |
|----------|--------|
| `jk` | Exit insert mode (custom mapping) |
| `Ctrl + s` | Save file |
| `Ctrl + c` | Copy entire file to clipboard |
| `Space + /` | Toggle comment (normal mode) |
| `Space + /` | Toggle comment (visual mode) |
| `Space + fm` | Format file with LSP |

---

## 🔢 Line Numbers

| Shortcut | Action |
|----------|--------|
| `Space + n` | Toggle line numbers |
| `Space + rn` | Toggle relative line numbers |

---

## 📜 Scrolling (Centered)

| Shortcut | Action |
|----------|--------|
| `Ctrl + d` | Scroll down (keeps cursor centered) |
| `Ctrl + u` | Scroll up (keeps cursor centered) |
| `n` | Next search result (centered) |
| `N` | Previous search result (centered) |

---

## 🔧 Utility

| Shortcut | Action |
|----------|--------|
| `Space + ch` | Open NvChad cheatsheet |
| `Space + wK` | Show all keymaps (WhichKey) |
| `Space + wk` | Query specific keymap |
| `Esc` | Clear search highlights |
| `Space + lg` | Open LazyGit (custom) |

---

## 📝 LSP (Language Server)

| Shortcut | Action |
|----------|--------|
| `Space + ds` | Show diagnostic list |
| `gD` | Go to declaration |
| `gd` | Go to definition |
| `K` | Show hover documentation |
| `gi` | Go to implementation |
| `gr` | Show references |

---

## 💡 Pro Tips

1. **Quick file navigation**: `Space + ff` then type filename is faster than navigating file tree
2. **Search across files**: `Space + fw` lets you grep across your entire project
3. **Recent files**: `Space + fo` shows recently opened files
4. **Create nested folders**: In file tree, press `a` then type `folder1/folder2/file.txt`
5. **Tab workflow**: Use `Ctrl+t` in file tree or Telescope to open multiple files in tabs
6. **Terminal workflow**: Use `Alt+i` for quick floating terminal access
7. **Buffer workflow**: Most people use buffers (Tab/Shift+Tab) instead of traditional tabs in Vim

---

## 🚀 Typical Workflows

### Opening Multiple Files in Tabs
1. `Ctrl + n` - Open file tree
2. Navigate to file
3. `Ctrl + t` - Opens in new tab
4. Repeat for more files
5. Use `:tabn` or `:tabp` to switch tabs (or use `gt` / `gT`)

### Split Screen Workflow
1. `Space + ff` - Find file
2. `Ctrl + v` - Open in vertical split
3. `Ctrl + h/l` - Move between splits

### Quick Search & Edit
1. `Space + fw` - Search for text
2. Select file from results
3. Edit and save with `Ctrl + s`
4. `Space + x` - Close buffer when done
