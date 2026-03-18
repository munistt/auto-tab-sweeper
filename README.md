# Tab Duper

Auto Tab Sweeper is a Chrome extension that helps clean up duplicate tabs.

It scans open tabs, groups tabs that point to the same page, keeps the most relevant tab, and closes older duplicate tabs after they have been inactive for the configured amount of time.

## Features

- Detects duplicate tabs automatically
- Lets you choose how URLs are compared
- Keeps the active tab open
- Can protect pinned tabs
- Can protect tabs that are playing audio
- Supports a whitelist for sites you never want touched
- Runs on a configurable sweep interval

## Project Files

- `manifest.json` - Chrome extension manifest
- `background.js` - background service worker that scans and closes duplicate tabs
- `options.html` - settings page UI
- `options.js` - settings page logic

## How To Add It To Chrome

This project is currently easiest to use in Chrome Developer Mode.

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Turn on **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select this project folder: `tab-duper`.
6. The extension will appear in your installed extensions list.

If you make code changes later:

1. Go back to `chrome://extensions/`.
2. Find Tab Duper.
3. Click the refresh/reload icon.

## How To Use

1. Load the extension in Chrome.
2. Open the extension settings page.
3. Set how long duplicate tabs must stay inactive before they can be closed.
4. Set how often the extension should scan for duplicates.
5. Save the settings.
6. Leave duplicate tabs open and inactive.
7. The extension will keep one tab and close older duplicates when the next sweep runs.

## Settings

### Inactive Threshold

The number of minutes a duplicate tab must remain unused before it becomes eligible to close.

### Duplicate Detection Mode

- `Exact URL`: compares the full URL except the hash
- `Ignore query`: compares only origin and path
- `Hostname + path`: compares hostname and path only

### Protect Pinned Tabs

When enabled, pinned duplicate tabs are not closed.

### Protect Audible Tabs

When enabled, tabs playing audio are not closed.

### Whitelist

Add one pattern per line for sites that should never be modified.

Examples:

- `*://*.meet.google.com/*`
- `*://*.teams.microsoft.com/*`

### Sweep Interval

How often the extension checks for duplicate tabs.

## Notes

- The extension uses Manifest V3.
- The extension needs the `tabs`, `storage`, and `alarms` permissions.
- It is intended for local use in Chrome Developer Mode unless you later publish it to the Chrome Web Store.

## GitHub

Suggested first commit message:

`feat: add initial Tab Duper Chrome extension`
