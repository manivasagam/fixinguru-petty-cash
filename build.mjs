#!/usr/bin/env node

// Simple build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting build process...');

try {
  // Build the frontend with Vite
  console.log('Building frontend with Vite...');
  execSync('vite build', { stdio: 'inherit' });

  // Ensure uploads directory exists in the built output
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }

  // Create .gitkeep to ensure directory is preserved
  fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '# Keep this directory\n');

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}