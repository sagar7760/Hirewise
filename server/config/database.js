const mongoose = require('mongoose');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = () => {
  const isProd = process.env.NODE_ENV === 'production';
  // Prefer explicit env URI; fallback to local IPv4 to avoid ::1 issues
  const fallbackLocal = 'mongodb://127.0.0.1:27017/hirewise';
  const mongoURI = (isProd ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI) || fallbackLocal;

  const maxRetries = parseInt(process.env.DB_MAX_RETRIES || '0', 10); // 0 => retry forever
  const retryDelayMs = parseInt(process.env.DB_RETRY_DELAY_MS || '5000', 10);

  const options = {
    // These options are safe across modern mongoose versions
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '10000', 10),
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10),
    family: 4, // Force IPv4 to avoid ::1 issues
  };

  let attempt = 0;

  const connectWithRetry = async () => {
    attempt += 1;
    try {
      console.log(`Attempting MongoDB connection (attempt ${attempt}) to ${mongoURI.replace(/:\/\/([^@]+)@/, '://***@')}`);
      const conn = await mongoose.connect(mongoURI, options);
      console.log(`MongoDB Connected: ${conn.connection.host} (db: ${conn.connection.name})`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message || err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      });
    } catch (error) {
      const msg = error?.message || String(error);
      console.error(`Database connection error: ${msg}`);
      const willRetry = maxRetries === 0 || attempt < maxRetries;
      if (willRetry) {
        console.log(`Retrying MongoDB connection in ${retryDelayMs}ms...`);
        await sleep(retryDelayMs);
        return connectWithRetry();
      }
      // Exhausted retries; do not exit, allow server to keep running and routes to signal 503
      console.error('Max MongoDB connection retries reached. Continuing without DB connection.');
    }
  };

  // Kick off connection attempts without blocking server startup
  connectWithRetry();
};

module.exports = connectDB;