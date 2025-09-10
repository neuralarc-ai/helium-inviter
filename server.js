import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all invite codes
app.get('/api/invite-codes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invite codes:', error);
      return res.status(500).json({ error: 'Failed to fetch invite codes' });
    }

    res.json({ data });
  } catch (error) {
    console.error('Error in /api/invite-codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate new invite codes
app.post('/api/generate-codes', async (req, res) => {
  try {
    const { count, prefix } = req.body;

    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ error: 'Count must be between 1 and 100' });
    }

    const codes = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${prefix || 'HELIUM'}-${timestamp}-${randomSuffix}`;
      codes.push({
        code,
        created_at: new Date().toISOString(),
        is_used: false,
        recipient_email: null,
        recipient_name: null,
        email_sent_at: null
      });
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .insert(codes)
      .select();

    if (error) {
      console.error('Error inserting invite codes:', error);
      return res.status(500).json({ error: 'Failed to generate invite codes' });
    }

    res.json({ 
      success: true, 
      data,
      message: `Successfully generated ${count} invite codes` 
    });
  } catch (error) {
    console.error('Error in /api/generate-codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send invite email
app.post('/api/send-invite-email', async (req, res) => {
  try {
    const { email, inviteCode, firstName, lastName } = req.body;

    // Validation
    if (!email || !inviteCode || !firstName) {
      return res.status(400).json({
        error: 'Email, invite code, and first name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if invite code exists and is not used
    const { data: existingCode, error: fetchError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .eq('is_used', false)
      .single();

    if (fetchError || !existingCode) {
      return res.status(400).json({
        error: 'Invalid or already used invite code'
      });
    }

    // Create email content
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;
    const emailContent = `Dear ${fullName},

Congratulations! You have been selected to join Helium — the OS for your business, in our first-ever Public Beta experience for businesses.

Your account has been credited with 1500 free Helium credits to explore and experience the power of Helium. Click below to activate your invite and get started:

${inviteCode}

Helium is designed to be the operating system for business intelligence, giving you a single, seamless layer to connect data, decisions, and workflows. As this is our first public beta, you may notice minor bugs or quirks. If you do, your feedback will help us make Helium even better.

You are not just testing a product. You are helping shape the future of business intelligence.

Welcome to Helium OS. The future of work is here.

Cheers,  
Team Helium  
https://he2.ai`;

    const htmlContent = emailContent.replace(/\n/g, '<br>');

    // Create transporter
    const transporter = createTransporter();

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your Helium Beta Invitation',
      text: emailContent,
      html: htmlContent,
    });

    console.log('Email sent successfully:', info.messageId);

    // Update invite code in database
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({
        is_used: true,
        recipient_email: email,
        recipient_name: fullName,
        email_sent_at: new Date().toISOString()
      })
      .eq('code', inviteCode);

    if (updateError) {
      console.error('Error updating invite code:', updateError);
      // Don't fail the request, email was sent successfully
    }

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
      recipient: {
        email,
        name: fullName,
        inviteCode
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send email'
    });
  }
});

// Get dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { data: totalCodes, error: totalError } = await supabase
      .from('invite_codes')
      .select('id', { count: 'exact' });

    const { data: usedCodes, error: usedError } = await supabase
      .from('invite_codes')
      .select('id', { count: 'exact' })
      .eq('is_used', true);

    const { data: recentEmails, error: recentError } = await supabase
      .from('invite_codes')
      .select('email_sent_at')
      .not('email_sent_at', 'is', null)
      .gte('email_sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (totalError || usedError || recentError) {
      console.error('Error fetching dashboard stats:', { totalError, usedError, recentError });
      return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }

    res.json({
      totalCodes: totalCodes?.length || 0,
      usedCodes: usedCodes?.length || 0,
      availableCodes: (totalCodes?.length || 0) - (usedCodes?.length || 0),
      emailsSentToday: recentEmails?.length || 0
    });
  } catch (error) {
    console.error('Error in /api/dashboard-stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete invite code
app.delete('/api/invite-codes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invite code:', error);
      return res.status(500).json({ error: 'Failed to delete invite code' });
    }

    res.json({ success: true, message: 'Invite code deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/invite-codes/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: 'Helium Inviter - Test Email',
      text: 'This is a test email from Helium Inviter. If you receive this, your email configuration is working correctly!',
      html: '<p>This is a test email from Helium Inviter. If you receive this, your email configuration is working correctly!</p>'
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      error: error.message || 'Failed to send test email'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Helium Inviter Server running on port ${PORT}`);
  console.log(`📧 Email endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;


