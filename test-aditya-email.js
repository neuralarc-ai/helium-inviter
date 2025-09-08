#!/usr/bin/env node

import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test data for your specific email
const testData = {
  email: 'aditya.kemdarne@neuralarc.ai',
  inviteCode: 'HELIUM2024',
  firstName: 'Aditya'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper function to make HTTP requests
const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Test email sending to your specific address
const testEmailToAditya = async () => {
  console.log(`${colors.bold}${colors.cyan}📧 Testing Email to Aditya Kemdarne${colors.reset}\n`);
  
  console.log(`${colors.blue}Recipient:${colors.reset} ${testData.email}`);
  console.log(`${colors.blue}Invite Code:${colors.reset} ${testData.inviteCode}`);
  console.log(`${colors.blue}First Name:${colors.reset} ${testData.firstName}\n`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/send-invite-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    console.log(`${colors.yellow}Sending email...${colors.reset}`);
    
    const response = await makeRequest(options, testData);
    
    if (response.statusCode === 200 && response.body.success) {
      console.log(`${colors.green}✅ Email sent successfully!${colors.reset}`);
      console.log(`${colors.green}   Status: ${response.statusCode}${colors.reset}`);
      console.log(`${colors.green}   Message ID: ${response.body.messageId}${colors.reset}`);
      console.log(`${colors.green}   Message: ${response.body.message}${colors.reset}`);
      
      console.log(`\n${colors.bold}${colors.yellow}📬 Check your email inbox!${colors.reset}`);
      console.log(`${colors.yellow}   - Check spam/junk folder if not in inbox${colors.reset}`);
      console.log(`${colors.yellow}   - Look for subject: "Your Helium Beta Invitation"${colors.reset}`);
      console.log(`${colors.yellow}   - From: ${process.env.SMTP_FROM || 'Team Helium'}${colors.reset}`);
      
      return true;
    } else {
      console.log(`${colors.red}❌ Email sending failed${colors.reset}`);
      console.log(`${colors.red}   Status: ${response.statusCode}${colors.reset}`);
      console.log(`${colors.red}   Response: ${JSON.stringify(response.body, null, 2)}${colors.reset}`);
      
      if (response.body.error) {
        console.log(`\n${colors.yellow}💡 Troubleshooting tips:${colors.reset}`);
        if (response.body.error.includes('authentication')) {
          console.log(`${colors.yellow}   - Check your SMTP credentials in .env file${colors.reset}`);
          console.log(`${colors.yellow}   - For Gmail, use App Password (not regular password)${colors.reset}`);
        }
        if (response.body.error.includes('connection')) {
          console.log(`${colors.yellow}   - Check your internet connection${colors.reset}`);
          console.log(`${colors.yellow}   - Verify SMTP_HOST and SMTP_PORT settings${colors.reset}`);
        }
      }
      
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Email sending failed - Connection error${colors.reset}`);
    console.log(`${colors.red}   Error: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}💡 Troubleshooting tips:${colors.reset}`);
    console.log(`${colors.yellow}   - Make sure API server is running: npm run api-server${colors.reset}`);
    console.log(`${colors.yellow}   - Check if port 3001 is available${colors.reset}`);
    console.log(`${colors.yellow}   - Verify your .env file has all required variables${colors.reset}`);
    
    return false;
  }
};

// Check environment variables
const checkEnvironment = () => {
  console.log(`${colors.blue}${colors.bold}Environment Check${colors.reset}`);
  
  const requiredVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`${colors.green}✅ ${varName}${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ ${varName} missing${colors.reset}`);
      allPresent = false;
    }
  });
  
  return allPresent;
};

// Main test runner
const runTest = async () => {
  console.log(`${colors.bold}${colors.cyan}🧪 Helium Inviter - Email Test to Aditya${colors.reset}\n`);
  
  // Check environment
  const envOk = checkEnvironment();
  if (!envOk) {
    console.log(`\n${colors.red}❌ Environment variables missing. Please check your .env file.${colors.reset}`);
    console.log(`${colors.yellow}Run: npm run setup${colors.reset}`);
    return;
  }
  
  console.log(`\n${colors.bold}Starting email test...${colors.reset}`);
  
  const success = await testEmailToAditya();
  
  if (success) {
    console.log(`\n${colors.green}${colors.bold}🎉 Email test completed successfully!${colors.reset}`);
    console.log(`${colors.green}Check aditya.kemdarne@neuralarc.ai for the Helium invitation email.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ Email test failed.${colors.reset}`);
    console.log(`${colors.red}Please check the error messages above and fix the configuration.${colors.reset}`);
  }
};

// Run test
runTest().catch(console.error);
