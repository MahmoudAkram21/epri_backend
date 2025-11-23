# HTTPS Setup Guide for EPRI Backend

This guide explains how to configure the backend server to use HTTPS.

## Quick Start

### Option 1: Using Environment Variables (Recommended for Production)

1. **Set environment variables in your `.env` file:**

```env
# Enable HTTPS
ENABLE_HTTPS=true

# HTTPS Port (optional, defaults to PORT if not set)
HTTPS_PORT=3443

# SSL Certificate Paths
SSL_CERT_PATH=/path/to/your/certificate.crt
SSL_KEY_PATH=/path/to/your/private.key

# Optional: Certificate Authority (CA) certificate for certificate chain
SSL_CA_PATH=/path/to/your/ca.crt
```

2. **Start the server:**
```bash
npm run dev
```

### Option 2: Using Default Certificate Paths (Development)

1. **Create a `certs` directory in the backend folder:**
```bash
mkdir backend/certs
```

2. **Place your certificates:**
   - `backend/certs/cert.pem` - Your SSL certificate
   - `backend/certs/key.pem` - Your private key
   - `backend/certs/ca.pem` - (Optional) CA certificate

3. **Enable HTTPS in `.env`:**
```env
ENABLE_HTTPS=true
```

4. **Start the server:**
```bash
npm run dev
```

## Obtaining SSL Certificates

### For Production (Let's Encrypt - Free)

1. **Install Certbot:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# macOS
brew install certbot
```

2. **Obtain certificates:**
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. **Certificates will be located at:**
   - Certificate: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
   - Private Key: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

4. **Update your `.env`:**
```env
ENABLE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### For Development (Self-Signed Certificate)

1. **Generate a self-signed certificate:**
```bash
# Create certs directory
mkdir -p backend/certs

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout backend/certs/key.pem \
  -out backend/certs/cert.pem \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

2. **Enable HTTPS in `.env`:**
```env
ENABLE_HTTPS=true
```

3. **Note:** Browsers will show a security warning for self-signed certificates. This is normal for development.

### For Development (mkcert - Recommended)

`mkcert` creates locally-trusted development certificates that browsers won't complain about.

1. **Install mkcert:**
```bash
# macOS
brew install mkcert

# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/

# Windows (using Chocolatey)
choco install mkcert
```

2. **Install local CA:**
```bash
mkcert -install
```

3. **Generate certificate for localhost:**
```bash
mkdir -p backend/certs
cd backend/certs
mkcert localhost 127.0.0.1 ::1
# This creates: localhost+2.pem and localhost+2-key.pem
```

4. **Rename files to match expected names:**
```bash
mv localhost+2.pem cert.pem
mv localhost+2-key.pem key.pem
```

5. **Enable HTTPS in `.env`:**
```env
ENABLE_HTTPS=true
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ENABLE_HTTPS` | Enable HTTPS server | No | `false` |
| `HTTPS_PORT` | Port for HTTPS server | No | Uses `PORT` value |
| `SSL_CERT_PATH` | Path to SSL certificate file | Yes (if HTTPS enabled) | `backend/certs/cert.pem` |
| `SSL_KEY_PATH` | Path to SSL private key file | Yes (if HTTPS enabled) | `backend/certs/key.pem` |
| `SSL_CA_PATH` | Path to CA certificate (for certificate chain) | No | `backend/certs/ca.pem` |

## Testing HTTPS

1. **Start the server with HTTPS enabled**
2. **Test with curl:**
```bash
# For self-signed certificates, use -k flag to skip verification
curl -k https://localhost:3443/api/health

# For valid certificates
curl https://yourdomain.com:3443/api/health
```

3. **Test in browser:**
   - Navigate to `https://localhost:3443/api/health`
   - For self-signed certificates, you'll need to accept the security warning

## Troubleshooting

### Certificate Not Found
- Ensure certificate paths are correct
- Check file permissions (certificates should be readable)
- Verify `ENABLE_HTTPS=true` is set in `.env`

### Port Already in Use
- Change `HTTPS_PORT` to a different port
- Or stop the process using the port

### Browser Security Warning (Self-Signed)
- This is expected for self-signed certificates
- Use `mkcert` for development to avoid warnings
- For production, use Let's Encrypt or a commercial certificate

### Certificate Expired
- Renew Let's Encrypt certificates: `sudo certbot renew`
- Update certificate paths if they've changed

## Security Best Practices

1. **Never commit certificates to git** - Add `certs/` to `.gitignore`
2. **Use strong private keys** - RSA 2048+ or ECDSA
3. **Keep certificates updated** - Set up auto-renewal for Let's Encrypt
4. **Restrict file permissions:**
```bash
chmod 600 backend/certs/key.pem
chmod 644 backend/certs/cert.pem
```

## Running Both HTTP and HTTPS

If you need both HTTP and HTTPS servers running simultaneously, you can modify the server startup code to listen on both ports. However, the current implementation uses one or the other based on the `ENABLE_HTTPS` flag.


