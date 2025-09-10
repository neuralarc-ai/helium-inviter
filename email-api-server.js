import http from 'http';
import url from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = 3002;

// Create Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight
const handleCORS = (res) => {
  res.writeHead(200, corsHeaders);
  res.end();
};

// Send JSON response
const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(data));
};

// Health check endpoint
const handleHealth = (res) => {
  sendJSON(res, 200, {
    status: 'OK',
    timestamp: new Date().toISOString()
  });
};

// -------- Email Templates --------
const buildInviteEmail = (firstName, inviteCode) => {
  const textVersion = `Dear ${firstName},

Congratulations! You have been selected to join Helium OS — our first-ever Public Beta.

Your invite code: ${inviteCode}

Your account has been credited with 1500 free Helium credits.

Visit: https://he2.ai

Cheers,
Team Helium
`;

  const htmlVersion = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #ddd; color: #333; line-height: 1.6;">
    <p style="margin: 0 0 10px 0; font-size: 16px;">Dear ${firstName},</p>

    <p style="margin: 0 0 10px 0; font-size: 16px;">
      <strong>Congratulations!</strong> You have been selected to join <strong>Helium</strong> — the <strong>OS</strong> for your business, our first-ever Public Beta experience for businesses.
    </p>

    <p style="margin: 0 0 10px 0; font-size: 16px;">
      Your account has been credited with <strong>1500 free Helium credits</strong>. Use the invite code below to activate your account:
    </p>

    <div style="font-size: 10px; font-weight: bold; padding: 10px; border: 1px solid #ccc; border-radius: 4px; display: inline-block; margin: 10px 0;">
      ${inviteCode}
    </div>

    <p style="margin: 0 0 10px 0; font-size: 16px;">
      Helium is designed to be the operating system for business intelligence. As this is our first public beta, you may notice minor bugs — your feedback will help us make Helium even better.
    </p>

    <p style="margin: 0 0 10px 0; font-size: 16px;">Welcome to <strong>Helium OS</strong>. The future of work is here.</p>

    <p style="margin: 0 0 10px 0; font-size: 16px;">Cheers,<br>Team Helium</p>

    <p><a href="https://he2.ai" style="color: #333; text-decoration: none;">https://he2.ai</a></p>

    <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      Helium AI by Neural Arc Inc. <a href="https://neuralarc.ai" style="color: #666; text-decoration: none;">https://neuralarc.ai</a>
    </div>
  </div>`;

  return { textVersion, htmlVersion };
};

const buildReminderEmail = (firstName, inviteCode) => {
  const textVersion = `Dear ${firstName},

Just a quick reminder — your exclusive Helium invite code is about to expire.

Invite code: ${inviteCode}

Don’t miss out on your 1500 free Helium credits and a 30% early-access discount.

Visit: https://he2.ai

Cheers,
Team Helium
`;

  const htmlVersion = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #ddd; color: #333; line-height: 1.6;">
    <p style="margin: 0 0 10px 0; font-size: 16px;">Dear ${firstName},</p>

    <p style="margin: 0 0 10px 0; font-size: 16px;">Just a quick reminder—your exclusive Helium invite code is about to expire.</p>

    <div style="font-size: 10px; font-weight: bold; padding: 10px; border: 1px solid #ccc; border-radius: 4px; display: inline-block; margin: 10px 0;">
      ${inviteCode}
    </div>

    <p style="margin: 0 0 10px 0; font-size: 16px;">
      Don’t miss out on your <strong>1500 free Helium credits</strong> and a special 30% discount available during this early access period.
    </p>

    <p style="margin: 0 0 10px 0; font-size: 16px;">Welcome (again) to <strong>Helium OS</strong>. The future of work is here.</p>

    <p style="margin: 0 0 10px 0; font-size: 16px;">Cheers,<br>Team Helium</p>

    <p><a href="https://he2.ai" style="color: #333; text-decoration: none;">https://he2.ai</a></p>

    <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      Helium AI by Neural Arc Inc. <a href="https://neuralarc.ai" style="color: #666; text-decoration: none;">https://neuralarc.ai</a>
    </div>
  </div>`;

  return { textVersion, htmlVersion };
};

// -------- Handlers --------
const handleSendEmail = async (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });

  req.on('end', async () => {
    try {
      const { email, inviteCode, firstName } = JSON.parse(body);

      if (!email || !inviteCode || !firstName) {
        return sendJSON(res, 400, { error: 'Email, invite code, and first name are required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendJSON(res, 400, { error: 'Invalid email format' });
      }

      const { textVersion, htmlVersion } = buildInviteEmail(firstName, inviteCode);

      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Your Helium Beta Invitation',
        text: textVersion,
        html: htmlVersion,
      });

      console.log('Email sent successfully:', info.messageId);
      sendJSON(res, 200, { success: true, messageId: info.messageId });
    } catch (err) {
      console.error('Error sending invite email:', err);
      sendJSON(res, 500, { error: err.message || 'Failed to send invite email' });
    }
  });
};

const handleSendReminderEmail = async (req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });

  req.on('end', async () => {
    try {
      const { email, inviteCode, firstName } = JSON.parse(body);

      if (!email || !inviteCode || !firstName) {
        return sendJSON(res, 400, { error: 'Email, invite code, and first name are required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendJSON(res, 400, { error: 'Invalid email format' });
      }

      const { textVersion, htmlVersion } = buildReminderEmail(firstName, inviteCode);

      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Reminder – Your Helium invite code is expiring soon!',
        text: textVersion,
        html: htmlVersion,
      });

      console.log('Reminder email sent successfully:', info.messageId);
      sendJSON(res, 200, { success: true, messageId: info.messageId });
    } catch (err) {
      console.error('Error sending reminder email:', err);
      sendJSON(res, 500, { error: err.message || 'Failed to send reminder email' });
    }
  });
};

// -------- Server --------
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, method } = parsedUrl;

  if (method === 'OPTIONS') return handleCORS(res);

  if (pathname === '/api/health' && method === 'GET') return handleHealth(res);
  if (pathname === '/api/send-invite-email' && method === 'POST') return handleSendEmail(req, res);
  if (pathname === '/api/send-reminder-email' && method === 'POST') return handleSendReminderEmail(req, res);

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`🚀 Email API server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

export default server;
