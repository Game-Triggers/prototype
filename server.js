const { createServer } = require('http');
const next = require('next');
const { spawn } = require('child_process');
const path = require('path');

// Environment variables
const dev = process.env.NODE_ENV !== 'production';
const nestPort = process.env.NEST_PORT || 3001;
const frontendPort = process.env.PORT || 3000;
const nestPath = path.join(__dirname, 'backend');

// Initialize Next.js app
const app = next({ dev });
const handle = app.getRequestHandler();

async function startServer() {
  try {
    // Prepare Next.js
    await app.prepare();
    
    // Start NestJS backend server
    console.log('Starting NestJS backend...');
    const nestProcess = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', 'src/main.ts'], {
      cwd: nestPath,
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, PORT: nestPort }
    });
    
    // Handle NestJS process errors
    nestProcess.on('error', error => console.error('NestJS server error:', error));
    
    // Create and start Next.js server
    const server = createServer((req, res) => handle(req, res));
    server.listen(frontendPort, err => {
      if (err) throw err;
      console.log(`> Next.js: http://localhost:${frontendPort}`);
      console.log(`> NestJS API: http://localhost:${nestPort}`);
    });
    
    // Graceful shutdown handler
    const shutdown = () => {
      console.log('Shutting down servers...');
      if (nestProcess && !nestProcess.killed) nestProcess.kill();
      server.close(() => process.exit(0));
    };
    
    // Register shutdown handlers
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();