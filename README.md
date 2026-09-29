# TrackPort Nodemailer email gateway

Small Node.js server that sends TrackPort shipment emails with **Nodemailer**.
The browser app POSTs to `http://localhost:3847/send` (or your deployed URL).

## Why a server?

Nodemailer runs only in **Node.js**, not in the browser. SMTP credentials must stay on the server.

## Step-by-step setup

### 1. Install Node.js

Install Node.js 18+ from https://nodejs.org if you do not have it.

### 2. Install dependencies

```bash
cd trackport-email-server
npm install
```

### 3. Configure SMTP (Gmail example)

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Edit `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=your-email@gmail.com
FROM_NAME=TrackPort
PORT=3847
```

**Gmail App Password (required):**

1. Enable 2-Step Verification on your Google account  
2. Go to https://myaccount.google.com/apppasswords  
3. Create an app password for “Mail”  
4. Paste the 16-character password into `SMTP_PASS` (no spaces is fine)

Other providers (examples):

| Provider   | SMTP_HOST              | Port |
|-----------|-------------------------|------|
| Gmail     | smtp.gmail.com          | 587  |
| Outlook   | smtp.office365.com      | 587  |
| Yahoo     | smtp.mail.yahoo.com     | 587  |
| SendGrid  | smtp.sendgrid.net       | 587  |
| Mailgun   | smtp.mailgun.org        | 587  |
| Amazon SES| email-smtp.region.amazonaws.com | 587 |

For SendGrid use user `apikey` and the API key as password.

### 4. Start the server

```bash
npm start
```

You should see:

```
TrackPort Nodemailer gateway listening on http://localhost:3847
```

Check health:

```bash
curl http://localhost:3847/health
```

### 5. Use the updated TrackPort HTML

1. Open the updated `index.html` in your browser (or host it as you already do).  
2. Default notify URL is already `http://localhost:3847/send`.  
3. Optional: in the browser console run:

```js
tpSetupNodemailer()
```

and paste your gateway URL if it is not localhost (e.g. after deploy).

4. Create a shipment with a real recipient email — the app will call Nodemailer via the local server.

### 6. Test send manually

```bash
curl -X POST http://localhost:3847/send \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "you@example.com",
    "subject": "TrackPort test",
    "textContent": "Hello from Nodemailer",
    "htmlContent": "<p>Hello from <b>Nodemailer</b></p>"
  }'
```

## Deploy (production)

Host `server.js` on any Node host (Railway, Render, Fly.io, VPS). Set the same env vars, then in the browser:

```js
tpSetupNodemailer()
// paste https://your-api.example.com/send
```

Set `API_KEY` in `.env` and send header `X-Api-Key: your-key` if you want to lock the endpoint (optional; extend the HTML payload headers if you enable this).

## What changed in the HTML

Only the email gateway path:

- Default `TRACKPORT_NOTIFY_URL_DEFAULT` → `http://localhost:3847/send`
- Default provider label → `nodemailer`
- Added `tpSetupNodemailer()` helper

All other app logic (shipments, UI, maps, etc.) is untouched.
