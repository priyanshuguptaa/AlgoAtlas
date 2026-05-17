# Google Sheets Sync Setup

This app can sync your solved status, custom tags, notes, and video links to one private Google Sheet.

## 1. Create the Sheet

Create a Google Sheet named `FAANG DSA Progress`.

Add a tab named:

```text
progress
```

Add this header row:

```text
problemId | pattern | title | completed | tags | notes | videoUrl | updatedAt
```

## 2. Add Apps Script

In the Google Sheet, open:

```text
Extensions -> Apps Script
```

Paste the contents of:

```text
google-apps-script.gs
```

Save the project.

## 3. Deploy the Script

In Apps Script:

```text
Deploy -> New deployment -> Web app
```

Use:

```text
Execute as: Me
Who has access: Anyone
```

Copy the Web App URL.

## 4. Connect the App

Open `app.js` and replace:

```js
const SHEETS_API_URL = "";
```

with:

```js
const SHEETS_API_URL = "YOUR_WEB_APP_URL";
```

After this, the app will load from Google Sheets on startup and save changes after you check problems or edit tags, notes, or video links.

The app still keeps `localStorage` as a backup.
