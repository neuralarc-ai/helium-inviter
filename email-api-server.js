import http from 'http';
import url from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = 3001;

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

// Send invite email endpoint
const handleSendEmail = async (req, res) => {
  try {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { email, inviteCode, firstName } = JSON.parse(body);

        if (!email || !inviteCode || !firstName) {
          return sendJSON(res, 400, {
            error: 'Email, invite code, and first name are required'
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return sendJSON(res, 400, {
            error: 'Invalid email format'
          });
        }

        // Create email content
        const emailContent = `Dear ${firstName},

Congratulations! You have been selected to join Helium — the OS for your business, in our first-ever Public Beta experience for businesses.

Your account has been credited with 1500 free Helium credits to explore and experience the power of Helium. Click below to activate your invite and get started:

${inviteCode}

Helium is designed to be the operating system for business intelligence, giving you a single, seamless layer to connect data, decisions, and workflows. As this is our first public beta, you may notice minor bugs or quirks. If you do, your feedback will help us make Helium even better.

You are not just testing a product. You are helping shape the future of business intelligence.

Welcome to Helium OS. The future of work is here.

Cheers,  
Team Helium  
https://he2.ai`;

        // Create transporter
        const transporter = createTransporter();

        // Send email
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Your Helium Beta Invitation',
          text: emailContent,
          html: emailContent.replace(/\n/g, '<br>'),
        });

        console.log('Email sent successfully:', info.messageId);

        sendJSON(res, 200, {
          success: true,
          messageId: info.messageId,
          message: 'Email sent successfully'
        });

      } catch (error) {
        console.error('Error sending email:', error);
        sendJSON(res, 500, {
          error: error.message || 'Failed to send email'
        });
      }
    });

  } catch (error) {
    console.error('Error handling request:', error);
    sendJSON(res, 500, {
      error: 'Internal server error'
    });
  }
};

// Send reminder email endpoint
const handleSendReminderEmail = async (req, res) => {
  try {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { email, inviteCode, firstName } = JSON.parse(body);

        if (!email || !inviteCode || !firstName) {
          return sendJSON(res, 400, {
            error: 'Email, invite code, and first name are required'
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return sendJSON(res, 400, {
            error: 'Invalid email format'
          });
        }

        // Create reminder email content
        const reminderEmailContent = `Dear ${firstName},

Just a quick reminder—your exclusive Helium invite code ${inviteCode} is about to expire.

We'd hate for you to miss out on your 1500 free Helium credits and a special 30% discount available only during this early access period.

Welcome (again) to Helium OS. The future of work is here—make sure you're part of it.

Cheers,  
Team Helium  
https://he2.ai`;

        // Create transporter
        const transporter = createTransporter();

        // Send reminder email
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Reminder – Your Helium invite code is expiring soon!',
          text: reminderEmailContent,
          html: reminderEmailContent.replace(/\n/g, '<br>'),
        });

        console.log('Reminder email sent successfully:', info.messageId);

        sendJSON(res, 200, {
          success: true,
          messageId: info.messageId,
          message: 'Reminder email sent successfully'
        });

      } catch (error) {
        console.error('Error sending reminder email:', error);
        sendJSON(res, 500, {
          error: error.message || 'Failed to send reminder email'
        });
      }
    });

  } catch (error) {
    console.error('Error handling reminder request:', error);
    sendJSON(res, 500, {
      error: 'Internal server error'
    });
  }
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return handleCORS(res);
  }

  // Route handling
  if (pathname === '/api/health' && method === 'GET') {
    return handleHealth(res);
  }

  if (pathname === '/api/send-invite-email' && method === 'POST') {
    return handleSendEmail(req, res);
  }

  if (pathname === '/api/send-reminder-email' && method === 'POST') {
    return handleSendReminderEmail(req, res);
  }

  // 404 for other routes
  sendJSON(res, 404, { error: 'Not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Email API server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

export default server;
