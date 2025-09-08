# Helium Inviter - Simple Node.js API with Nodemailer

## Overview
This setup uses a simple Node.js HTTP server (no Express) with Nodemailer for email sending. The Vite dev server proxies API calls to the Node.js server.

## Quick Setup

### 1. Configure Environment Variables
Create a `.env` file in your project root with all configuration:

```bash
# Supabase Configuration (for database)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# SMTP Configuration (for email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Team Helium <your-email@gmail.com>
```

### 2. Start the Application

#### Option 1: Both servers together
```bash
npm run dev:full
```

#### Option 2: Manual (two terminals)
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: API Server
npm run api-server
```

## How It Works

- **Vite Dev Server**: Frontend on port 8080
- **Node.js API Server**: API on port 3001
- **Proxy**: Vite proxies `/api/*` to Node.js server
- **Database**: Supabase for invite codes
- **Email**: Nodemailer for sending emails

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/send-invite-email` - Send invite email

## Email Provider Setup

### Gmail Setup
1. **Enable 2-Factor Authentication** in your Google Account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use App Password** in `SMTP_PASS` (not your regular password)

### Other Providers

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Testing

### Test API Server
```bash
# Health check
curl http://localhost:3001/api/health

# Send email
curl -X POST http://localhost:3001/api/send-invite-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "inviteCode": "NABC123",
    "firstName": "Test"
  }'
```

### Test through Vite proxy
```bash
# Health check (through proxy)
curl http://localhost:8080/api/health
```

## Benefits

- ✅ **No Express** - Simple Node.js HTTP server
- ✅ **Minimal dependencies** - Just Node.js built-ins + Nodemailer
- ✅ **Proxy setup** - Vite handles routing
- ✅ **CORS handled** - Proper headers included
- ✅ **Easy debugging** - Simple server code

## File Structure

```
├── email-api-server.js    # Simple Node.js API server
├── vite.config.ts         # Vite config with proxy
├── src/
│   ├── components/
│   ├── lib/
│   └── ...
└── .env                   # Environment variables
```

## Troubleshooting

### Common Issues

1. **"Failed to execute 'json' on 'Response'"**
   - Make sure both servers are running
   - Check if API server is on port 3001
   - Verify proxy configuration in vite.config.ts

2. **"Connection refused"**
   - Start the API server: `npm run api-server`
   - Check if port 3001 is available

3. **"SMTP authentication failed"**
   - Check your SMTP credentials
   - For Gmail, use App Password, not regular password
   - Ensure 2FA is enabled

### Debug Mode
Add this to your `.env`:
```bash
DEBUG=nodemailer:*
```

## Production Deployment

For production, you'll need to:
1. Build the frontend: `npm run build`
2. Deploy both the built frontend and API server
3. Set environment variables on your deployment platform
4. Configure your web server to proxy API calls

## Security Notes

- Never commit `.env` files to version control
- Use App Passwords instead of regular passwords
- Validate all email inputs on the server side
- Consider rate limiting for production use
