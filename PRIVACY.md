# DM Export for X Privacy Policy

**Last updated:** 2026-10-26

DM Export for X is a Chrome extension that exports your X (Twitter) direct messages to files on your computer. This policy describes what data it handles.

## Summary

DM Export for X does not collect, transmit, sell or share any data. Everything happens inside your browser. The extension makes no network requests of its own.

## What the extension reads

When you click an export button, the extension reads, on `x.com` only:

- The chat database that X's web app stores in your browser's Origin Private File System: conversations, messages, senders, reactions and attachment records
- The media files X's web app has already decrypted and stored next to that database

It does not read the tables X uses to store encryption keys.

## What the extension stores

Nothing. It keeps no settings, history or copies of your messages. The exported zip is saved to your Downloads folder like any other download, and it is yours.

## Network access

None. The popup shows profile pictures by loading them from X's own image CDN (`pbs.twimg.com`), the same images x.com shows you.

## Permissions

- `activeTab`: to talk to the x.com tab you are on when you open the popup
- Host access to `https://x.com/*`: to run the content script that adds the export button and reads your local chat data

## Open source

The full source code is at [github.com/Jubstaaa/x-dm-export](https://github.com/Jubstaaa/x-dm-export). You can check every claim above by reading it.

## Contact

Open an issue at [github.com/Jubstaaa/x-dm-export/issues](https://github.com/Jubstaaa/x-dm-export/issues).
