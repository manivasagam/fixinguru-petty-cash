#!/usr/bin/env node

// Vercel build script to handle both frontend and serverless function preparation
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build process...');

try {
  // Build the frontend with Vite
  console.log('Building frontend...');
  execSync('vite build', { stdio: 'inherit' });

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }

  // Create a simple index file in uploads to ensure the directory is included
  fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '');

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}