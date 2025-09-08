#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';
import dotenv from 'dotenv';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createEnvFile = async () => {
  console.log(`${colors.bold}${colors.cyan}🔧 Helium Inviter Setup Helper${colors.reset}\n`);
  
  console.log(`${colors.yellow}This will help you create a .env file with the required configuration.${colors.reset}\n`);
  
  const envVars = {};
  
  // Supabase configuration
  console.log(`${colors.blue}${colors.bold}1. Supabase Configuration${colors.reset}`);
  envVars.VITE_SUPABASE_URL = await question('Enter your Supabase URL (e.g., https://your-project.supabase.co): ');
  envVars.VITE_SUPABASE_ANON_KEY = await question('Enter your Supabase Anon Key: ');
  
  console.log(`\n${colors.blue}${colors.bold}2. Email Configuration${colors.reset}`);
  console.log(`${colors.yellow}Choose your email provider:${colors.reset}`);
  console.log('1. Gmail (recommended)');
  console.log('2. Outlook/Hotmail');
  console.log('3. Yahoo');
  console.log('4. Custom SMTP');
  
  const provider = await question('Enter your choice (1-4): ');
  
  switch (provider) {
    case '1':
      envVars.SMTP_HOST = 'smtp.gmail.com';
      envVars.SMTP_PORT = '587';
      envVars.SMTP_SECURE = 'false';
      console.log(`\n${colors.yellow}For Gmail, you need to:${colors.reset}`);
      console.log('1. Enable 2-Factor Authentication');
      console.log('2. Generate an App Password');
      console.log('3. Use the App Password (not your regular password)');
      break;
      
    case '2':
      envVars.SMTP_HOST = 'smtp-mail.outlook.com';
      envVars.SMTP_PORT = '587';
      envVars.SMTP_SECURE = 'false';
      break;
      
    case '3':
      envVars.SMTP_HOST = 'smtp.mail.yahoo.com';
      envVars.SMTP_PORT = '587';
      envVars.SMTP_SECURE = 'false';
      break;
      
    case '4':
      envVars.SMTP_HOST = await question('Enter SMTP Host: ');
      envVars.SMTP_PORT = await question('Enter SMTP Port (default 587): ') || '587';
      envVars.SMTP_SECURE = await question('Use SSL? (true/false, default false): ') || 'false';
      break;
      
    default:
      console.log(`${colors.red}Invalid choice. Using Gmail defaults.${colors.reset}`);
      envVars.SMTP_HOST = 'smtp.gmail.com';
      envVars.SMTP_PORT = '587';
      envVars.SMTP_SECURE = 'false';
  }
  
  envVars.SMTP_USER = await question('Enter your email address: ');
  envVars.SMTP_PASS = await question('Enter your email password (or App Password for Gmail): ');
  envVars.SMTP_FROM = await question('Enter sender name and email (e.g., Team Helium <your-email@gmail.com>): ') || `Team Helium <${envVars.SMTP_USER}>`;
  
  // Create .env file content
  const envContent = `# Helium Inviter Environment Variables

# Supabase Configuration (for database)
VITE_SUPABASE_URL=${envVars.VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${envVars.VITE_SUPABASE_ANON_KEY}

# SMTP Configuration (for email sending)
SMTP_HOST=${envVars.SMTP_HOST}
SMTP_PORT=${envVars.SMTP_PORT}
SMTP_SECURE=${envVars.SMTP_SECURE}
SMTP_USER=${envVars.SMTP_USER}
SMTP_PASS=${envVars.SMTP_PASS}
SMTP_FROM=${envVars.SMTP_FROM}
`;

  // Write .env file
  try {
    fs.writeFileSync('.env', envContent);
    console.log(`\n${colors.green}✅ .env file created successfully!${colors.reset}`);
    
    console.log(`\n${colors.bold}Next steps:${colors.reset}`);
    console.log('1. Start the API server: npm run api-server');
    console.log('2. Test email functionality: npm run test:email');
    console.log('3. Start the full application: npm run dev:full');
    
  } catch (error) {
    console.log(`${colors.red}❌ Error creating .env file: ${error.message}${colors.reset}`);
  }
  
  rl.close();
};

// Check if .env exists
if (fs.existsSync('.env')) {
  console.log(`${colors.yellow}.env file already exists.${colors.reset}`);
  console.log('If you want to recreate it, delete the existing .env file first.');
  process.exit(0);
} else {
  createEnvFile();
}
