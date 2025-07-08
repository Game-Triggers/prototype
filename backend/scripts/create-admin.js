#!/usr/bin/env node

// Required packages
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// Path to the TypeScript script
const scriptPath = path.join(projectRoot, 'src', 'scripts', 'create-super-admin.ts');

// Command to run the TypeScript file with ts-node
const command = 'npx';
const args = ['ts-node', scriptPath];

console.log('🚀 Starting super admin creation script...');

// Spawn process to run the script
const child = spawn(command, args, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// Handle process events
child.on('error', (err) => {
  console.error('❌ Failed to start script:', err.message);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Script exited with code ${code}`);
  }
});
