<div align="center">

<img src="public/icon-128.png" width="96" height="96" alt="DM Export for X" />

# DM Export for X

**Export your X (Twitter) DMs, including the new end-to-end encrypted chats, in one click.**

<sub>HTML you can read, JSON you can parse, and plain text. Everything runs in your browser.</sub>

<p>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-1d9bf0"></a>
  <a href="https://github.com/Jubstaaa/x-dm-export/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/Jubstaaa/x-dm-export?color=1d9bf0"></a>
  <a href="https://github.com/Jubstaaa/x-dm-export/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/Jubstaaa/x-dm-export?color=1d9bf0"></a>
</p>

</div>

---

## Why

X moved DMs to encrypted Chat. Message text is now decrypted inside your browser, so every exporter that reads X's network traffic only sees ciphertext. The official data archive does not reliably include it either.

DM Export for X reads the copy of your chats that X's own web app already decrypted and stored on your device, and turns it into files you can keep.

## Features

- **Encrypted chats supported**, along with older unencrypted DMs
- **Export button inside X**: open a chat, click the download button next to the call buttons, choose _With media_ or _Without media_
- **Bulk export from the toolbar**: search your chats, select any or all, download one zip
- **Three formats in every export**
    - `chat.html` is a readable chat view with bubbles, dates, reactions and media, in light and dark
    - `chat.json` has every message with sender, timestamp, reactions and media paths
    - `_chat.txt` is plain text, one line per message, in the widely used `[date, time] Name: message` chat export format
- **Media included**: photos, GIFs and videos your browser has downloaded
- **Group chats** with participant names
- **No servers, no accounts, no analytics**

## How it works

X's web client keeps a local SQLite database of your chats in the browser's Origin Private File System (`backups/chat_<your id>.db`), with decrypted message text and decrypted media files next to it. The extension's content script runs on `x.com`, opens that database with [sql.js](https://github.com/sql-js/sql.js), and builds the zip in the page with [fflate](https://github.com/101arrowz/fflate).

It only reads message, user, reaction and attachment tables. It never touches the tables X uses for encryption keys, and it makes no network requests.

**Limitation:** the export contains what X has synced to this browser. To include older history, open the chat on x.com and scroll up to the beginning first.

## Install

### From GitHub releases

1. Download the latest `x-dm-export-vX.Y.Z.zip` from [Releases](https://github.com/Jubstaaa/x-dm-export/releases/latest) and unzip it
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the unzipped folder

### From source

```bash
git clone git@github.com:Jubstaaa/x-dm-export.git
cd x-dm-export
bun install
bun run build
```

Then load the `dist/` folder as an unpacked extension.

## Usage

- **One chat:** open it on [x.com/i/chat](https://x.com/i/chat), click the download icon in the chat header, choose _With media_ or _Without media_
- **Many chats:** with an x.com tab active, click the extension icon, select chats, click **Export**

## Development

```bash
bun install
bun run dev        # Vite dev server + HMR
bun run build      # Production build → dist/
bun run typecheck  # tsc -b --noEmit
bun run lint
```

## Tech stack

| Layer        | Tools                                                            |
| ------------ | ---------------------------------------------------------------- |
| Build        | Vite, [@crxjs/vite-plugin](https://crxjs.dev), Bun               |
| UI           | React 19, TypeScript, Tailwind CSS v4                            |
| Components   | shadcn/ui (new-york), Radix UI, lucide-react                     |
| Data         | sql.js (SQLite → WASM), cbor-x, fflate                           |
| Browser APIs | Origin Private File System, `chrome.tabs`, `chrome.runtime`, MV3 |

## Project structure

```
src/
├── content/                     Runs on x.com
│   ├── content.tsx              Entry: message handlers + header button mount
│   ├── content.css              Tailwind for the shadow-root button
│   ├── export-menu.tsx          In-chat export menu (anchored to X's own button)
│   └── x-chat-page.ts           Finds X's chat header, current chat id, theme
├── popup/                       Toolbar popup
│   ├── popup.tsx
│   ├── popup.hooks.ts           useChatExporter: tab IPC, selection, progress
│   └── chat-row.tsx             X-style chat row
├── lib/
│   ├── chat-storage.ts          OPFS access (database + media)
│   ├── chat-database.ts         sql.js queries → typed chats and messages
│   ├── chat-render.ts           HTML, JSON and text renderers
│   ├── chat-archive.ts          Zip building and download
│   └── chrome-messaging.ts      Typed popup ↔ content messages
├── components/ui/               shadcn primitives
├── theme.css                    X color tokens (light + dark)
└── main.tsx                     Popup entry
```

## Privacy

Nothing leaves your device. See [PRIVACY.md](PRIVACY.md).

## Disclaimer

Not affiliated with or endorsed by X Corp. It reads data X stores in your own browser; if X changes that storage, the extension may need an update.

## License

MIT

---

<div align="center">

If this saved your chats, ⭐ the repo. It really helps.

</div>
