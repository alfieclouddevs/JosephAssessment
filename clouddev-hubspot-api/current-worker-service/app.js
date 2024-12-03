const envLoader = require('dotenv');
const filePath = require('path');
const dbClient = require('mongoose');

// Load environment variables from .env
envLoader.config({ path: filePath.join(__dirname, '.env') });

// Validate critical environment variables
const { MONGO_URI } = process.env;
if (!MONGO_URI) {
  console.error('Error: Missing dbConnectionString in environment variables');
  process.exit(1);
}

// Load package.json to set version
const appMetadata = require('./package.json');
process.env.APP_VERSION = appMetadata.version;

// Configure Mongoose
dbClient.set('strictQuery', false);

// Initialize the application
const bootstrapApplication = async () => {
  try {
    // Connect to MongoDB
    await dbClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to database');

    // Load models
    require('./src/models/Domain');

    process.env.APP_INSTANCE = 'app';

    // Worker setup
    try {
      require('./src/worker')();
      console.log('Worker initialized successfully');
    } catch (workerError) {
      console.error('Error initializing worker:', workerError.message);
      process.exit(1);
    }

    // Server setup
    require('./server');
    console.log('Server started successfully');
  } catch (error) {
    console.error('Error during application initialization:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handler (For Prod)
const shutdownHandler = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  try {
    await dbClient.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during database disconnection:', error.message);
  }
  process.exit(0);
};

// Attach shutdown handlers
process.on('SIGINT', () => shutdownHandler('SIGINT'));
process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

// Initialize the application
bootstrapApplication();
