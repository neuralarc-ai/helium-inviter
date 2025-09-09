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

        // Create HTML email content with light gray background
        const emailContent = `
        <div style="background-color: #CDCDCD; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <p>Dear ${firstName},</p>
            
            <p><strong>Congratulations!</strong> You have been selected to join <strong>Helium</strong> — the <strong>OS</strong> for your business, our first-ever Public Beta experience for businesses.</p>
            
            <p>Your account has been credited with <strong>1500 free Helium credits</strong> to explore and experience the power of Helium. Click below to activate your invite and get started:</p>
            
            <div style="background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center; font-size: 10px; font-weight: bold; color: #333;">
              ${inviteCode}
            </div>
            
            <p>Helium is designed to be the operating system for business intelligence, giving you a single, seamless layer to connect data, decisions, and workflows. As this is our first public beta, you may notice minor bugs or quirks. If you do, your feedback will help us make Helium even better.</p>
            
            <p>You are not just testing a product. You are helping shape the future of business intelligence.</p>
            
            <p>Welcome to <strong>Helium OS</strong>. The future of work is here.</p>
            
            <p>Cheers,<br>Team Helium</p>
            
            <p><a href="https://he2.ai" style="color: #333; text-decoration: none;">www.he2.ai</a></p>
            
            <div style="margin-top: 30px; font-size: 12px; color: #666;">
              Helium AI by Neural Arc Inc. <a href="https://neuralarc.ai" style="color: #666; text-decoration: none;">https://neuralarc.ai</a>
            </div>
          </div>
        </div>`;

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
        // Create HTML reminder email content with light gray background
        const reminderEmailContent = `
        <div style="background-color: #CDCDCD; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <p>Dear ${firstName},</p>
            
            <p>Just a quick reminder—your exclusive Helium invite code is about to expire.</p>
            
            <div style="background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center; font-size: 10px; font-weight: bold; color: #333;">
              ${inviteCode}
            </div>
            
            <p>We'd hate for you to miss out on your <strong>1500 free Helium credits</strong> and a special 30% discount available only during this early access period.</p>
            
            <p>Welcome (again) to <strong>Helium OS</strong>. The future of work is here—make sure you're part of it.</p>
            
            <p>Cheers,<br>Team Helium</p>
            
            <p><a href="https://he2.ai" style="color: #333; text-decoration: none;">www.he2.ai</a></p>
            
            <div style="margin-top: 30px; font-size: 12px; color: #666;">
              Helium AI by Neural Arc Inc. <a href="https://neuralarc.ai" style="color: #666; text-decoration: none;">https://neuralarc.ai</a>
            </div>
          </div>
        </div>`;

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
