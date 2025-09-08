#!/usr/bin/env node

import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:3001';

// Test data
const testData = {
  email: 'test@example.com',
  inviteCode: 'TEST123',
  firstName: 'TestUser'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Test 1: Health Check
const testHealthCheck = async () => {
  console.log(`${colors.blue}${colors.bold}Test 1: Health Check${colors.reset}`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✅ Health check passed${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Health check failed${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Health check failed - Connection error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// Test 2: Send Email
const testSendEmail = async () => {
  console.log(`\n${colors.blue}${colors.bold}Test 2: Send Email${colors.reset}`);
  
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
    
    const response = await makeRequest(options, testData);
    
    if (response.statusCode === 200 && response.body.success) {
      console.log(`${colors.green}✅ Email sent successfully${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Message ID: ${response.body.messageId}`);
      console.log(`   Message: ${response.body.message}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Email sending failed${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Email sending failed - Connection error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// Test 3: Invalid Email Format
const testInvalidEmail = async () => {
  console.log(`\n${colors.blue}${colors.bold}Test 3: Invalid Email Format${colors.reset}`);
  
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
    
    const invalidData = {
      email: 'invalid-email',
      inviteCode: 'TEST123',
      firstName: 'TestUser'
    };
    
    const response = await makeRequest(options, invalidData);
    
    if (response.statusCode === 400) {
      console.log(`${colors.green}✅ Invalid email validation working${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Error: ${response.body.error}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Invalid email validation failed${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Invalid email test failed - Connection error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// Test 4: Missing Required Fields
const testMissingFields = async () => {
  console.log(`\n${colors.blue}${colors.bold}Test 4: Missing Required Fields${colors.reset}`);
  
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
    
    const incompleteData = {
      email: 'test@example.com'
      // Missing inviteCode and firstName
    };
    
    const response = await makeRequest(options, incompleteData);
    
    if (response.statusCode === 400) {
      console.log(`${colors.green}✅ Missing fields validation working${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Error: ${response.body.error}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Missing fields validation failed${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Missing fields test failed - Connection error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// Test 5: CORS Headers
const testCORS = async () => {
  console.log(`\n${colors.blue}${colors.bold}Test 5: CORS Headers${colors.reset}`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && 
        response.headers['access-control-allow-origin'] === '*') {
      console.log(`${colors.green}✅ CORS headers working${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   CORS Origin: ${response.headers['access-control-allow-origin']}`);
      return true;
    } else {
      console.log(`${colors.red}❌ CORS headers missing${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ CORS test failed - Connection error${colors.reset}`);
    console.log(`   Error: ${error.message}`);
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
const runTests = async () => {
  console.log(`${colors.bold}${colors.yellow}🧪 Helium Inviter Email API Test Suite${colors.reset}\n`);
  
  // Check environment
  const envOk = checkEnvironment();
  if (!envOk) {
    console.log(`\n${colors.red}❌ Environment variables missing. Please check your .env file.${colors.reset}`);
    return;
  }
  
  console.log(`\n${colors.bold}Starting tests...${colors.reset}`);
  
  const tests = [
    testHealthCheck,
    testSendEmail,
    testInvalidEmail,
    testMissingFields,
    testCORS
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
    } catch (error) {
      console.log(`${colors.red}❌ Test failed with error: ${error.message}${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.bold}Test Results:${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passed}/${total}${colors.reset}`);
  
  if (passed === total) {
    console.log(`\n${colors.green}${colors.bold}🎉 All tests passed! Email functionality is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ Some tests failed. Please check the API server and configuration.${colors.reset}`);
  }
  
  console.log(`\n${colors.yellow}Note: If email sending test passed, check your email inbox (including spam folder) for the test email.${colors.reset}`);
};

// Run tests
runTests().catch(console.error);
