/**
 * TrackPort Nodemailer email gateway
 * POST /send  { toEmail, subject, htmlContent, textContent, fromName?, toName? }
 * POST /health
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const PORT = Number(process.env.PORT) || 3847;
const API_KEY = String(process.env.API_KEY || '').trim();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.text({ type: 'text/plain', limit: '2mb' }));

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_e) {
      return {};
    }
  }
  return {};
}

function authOk(req) {
  if (!API_KEY) return true;
  const h = req.headers['x-api-key'] || req.headers['authorization'] || '';
  const token = String(h).replace(/^Bearer\s+/i, '').trim();
  return token === API_KEY;
}

app.get('/health', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ ok: true, service: 'TrackPort Nodemailer gateway', smtp: true });
  } catch (err) {
    res.status(503).json({
      ok: false,
      service: 'TrackPort Nodemailer gateway',
      smtp: false,
      error: err && err.message
    });
  }
});

app.post('/send', async (req, res) => {
  if (!authOk(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const data = parseBody(req);
  const toEmail = String(data.toEmail || data.to || '').trim();
  const subject = String(data.subject || 'TrackPort update').trim();
  const html = data.htmlContent || data.html || '';
  const text = data.textContent || data.text || '';
  const toName = data.toName ? String(data.toName).trim() : '';
  const fromName = String(data.fromName || process.env.FROM_NAME || 'TrackPort').trim();
  const fromEmail = String(process.env.FROM_EMAIL || process.env.SMTP_USER || '').trim();

  if (!toEmail || !toEmail.includes('@')) {
    return res.status(400).json({ ok: false, error: 'missing toEmail' });
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({
      ok: false,
      error: 'SMTP not configured — set SMTP_USER and SMTP_PASS in .env'
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toName ? `"${toName}" <${toEmail}>` : toEmail,
      subject,
      text: text || undefined,
      html: html || undefined
    });
    return res.json({
      ok: true,
      via: 'nodemailer',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });
  } catch (err) {
    console.error('[Nodemailer]', err && err.message);
    return res.status(502).json({
      ok: false,
      error: (err && err.message) || 'send failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`TrackPort Nodemailer gateway listening on http://localhost:${PORT}`);
  console.log(`  POST /send   — send email`);
  console.log(`  GET  /health — check SMTP`);
});
