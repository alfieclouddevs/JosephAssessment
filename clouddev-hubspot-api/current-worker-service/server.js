const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const moment = require('moment');

// Validate critical environment variables
const { PORT, NODE_ENV } = process.env;

if (!PORT) {
  console.error('Error: Missing PORT in environment variables');
  process.exit(1);
}

// Server setup
const app = express();
const server = http.Server(app);

// Set local variables for use in views or middleware
app.locals = {
  moment,
  version: process.env.version || '1.0.0',
  NODE_ENV: NODE_ENV || 'development',
};

// Middleware setup
app.use(express.json({ limit: '50mb' })); // Handles JSON requests
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false })); // Handles URL-encoded requests
app.use(bodyParser.text({ limit: '50mb' })); // Handles text payloads
app.use(cookieParser()); // Parses cookies

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start listening for connections
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down server...');
  server.close(() => {
    console.log('Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down server...');
  server.close(() => {
    console.log('Server shut down gracefully');
    process.exit(0);
  });
});
