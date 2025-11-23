import https from 'https';
import fs from 'fs';
import path from 'path';

/**
 * Helper function to create HTTPS server options
 * Reads SSL certificates from environment variables or default paths
 */
export function getHttpsOptions() {
  // Option 1: Use environment variables (recommended for production)
  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;
  const caPath = process.env.SSL_CA_PATH; // Optional: for certificate chain

  if (certPath && keyPath) {
    try {
      const options: https.ServerOptions = {
        cert: fs.readFileSync(certPath, 'utf8'),
        key: fs.readFileSync(keyPath, 'utf8'),
      };

      // Add CA certificate if provided (for certificate chain)
      if (caPath) {
        options.ca = fs.readFileSync(caPath, 'utf8');
      }

      return options;
    } catch (error) {
      console.error('❌ Error reading SSL certificates:', error);
      throw error;
    }
  }

  // Option 2: Try default paths (for development/testing)
  const defaultCertPath = path.join(__dirname, '../certs/cert.pem');
  const defaultKeyPath = path.join(__dirname, '../certs/key.pem');
  const defaultCaPath = path.join(__dirname, '../certs/ca.pem');

  if (fs.existsSync(defaultCertPath) && fs.existsSync(defaultKeyPath)) {
    try {
      const options: https.ServerOptions = {
        cert: fs.readFileSync(defaultCertPath, 'utf8'),
        key: fs.readFileSync(defaultKeyPath, 'utf8'),
      };

      if (fs.existsSync(defaultCaPath)) {
        options.ca = fs.readFileSync(defaultCaPath, 'utf8');
      }

      return options;
    } catch (error) {
      console.error('❌ Error reading default SSL certificates:', error);
      throw error;
    }
  }

  return null;
}

/**
 * Check if HTTPS is enabled via environment variable
 */
export function isHttpsEnabled(): boolean {
  return process.env.ENABLE_HTTPS === 'true' || process.env.ENABLE_HTTPS === '1';
}

/**
 * Create HTTPS server if certificates are available
 */
export function createHttpsServer(app: any, port: number): https.Server | null {
  if (!isHttpsEnabled()) {
    return null;
  }

  const httpsOptions = getHttpsOptions();
  if (!httpsOptions) {
    console.warn('⚠️  HTTPS enabled but certificates not found. Falling back to HTTP.');
    return null;
  }

  const httpsPort = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : port;
  const server = https.createServer(httpsOptions, app);

  server.listen(httpsPort, () => {
    console.log(`🔒 HTTPS server running on port ${httpsPort}`);
    console.log(`📊 Health check: https://localhost:${httpsPort}/api/health`);
  });

  // Handle server errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${httpsPort} is already in use. Please use a different port.`);
    } else {
      console.error('❌ HTTPS server error:', error);
    }
  });

  return server;
}

