"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHttpsOptions = getHttpsOptions;
exports.isHttpsEnabled = isHttpsEnabled;
exports.createHttpsServer = createHttpsServer;
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getHttpsOptions() {
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    const caPath = process.env.SSL_CA_PATH;
    if (certPath && keyPath) {
        try {
            const options = {
                cert: fs_1.default.readFileSync(certPath, 'utf8'),
                key: fs_1.default.readFileSync(keyPath, 'utf8'),
            };
            if (caPath) {
                options.ca = fs_1.default.readFileSync(caPath, 'utf8');
            }
            return options;
        }
        catch (error) {
            console.error('❌ Error reading SSL certificates:', error);
            throw error;
        }
    }
    const defaultCertPath = path_1.default.join(__dirname, '../certs/cert.pem');
    const defaultKeyPath = path_1.default.join(__dirname, '../certs/key.pem');
    const defaultCaPath = path_1.default.join(__dirname, '../certs/ca.pem');
    if (fs_1.default.existsSync(defaultCertPath) && fs_1.default.existsSync(defaultKeyPath)) {
        try {
            const options = {
                cert: fs_1.default.readFileSync(defaultCertPath, 'utf8'),
                key: fs_1.default.readFileSync(defaultKeyPath, 'utf8'),
            };
            if (fs_1.default.existsSync(defaultCaPath)) {
                options.ca = fs_1.default.readFileSync(defaultCaPath, 'utf8');
            }
            return options;
        }
        catch (error) {
            console.error('❌ Error reading default SSL certificates:', error);
            throw error;
        }
    }
    return null;
}
function isHttpsEnabled() {
    return process.env.ENABLE_HTTPS === 'true' || process.env.ENABLE_HTTPS === '1';
}
function createHttpsServer(app, port) {
    if (!isHttpsEnabled()) {
        return null;
    }
    const httpsOptions = getHttpsOptions();
    if (!httpsOptions) {
        console.warn('⚠️  HTTPS enabled but certificates not found. Falling back to HTTP.');
        return null;
    }
    const httpsPort = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : port;
    const server = https_1.default.createServer(httpsOptions, app);
    server.listen(httpsPort, () => {
        console.log(`🔒 HTTPS server running on port ${httpsPort}`);
        console.log(`📊 Health check: https://localhost:${httpsPort}/api/health`);
    });
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${httpsPort} is already in use. Please use a different port.`);
        }
        else {
            console.error('❌ HTTPS server error:', error);
        }
    });
    return server;
}
//# sourceMappingURL=https-server.js.map