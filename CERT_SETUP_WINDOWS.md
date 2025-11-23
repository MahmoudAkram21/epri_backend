# SSL Certificate Setup Guide (Windows)

## Quick Setup Options

### Option 1: Self-Signed Certificate (Easiest for Development)

**Using the provided PowerShell script:**

```powershell
cd backend
.\generate-cert.ps1
```

**Or manually with OpenSSL:**

1. **Install OpenSSL** (if not already installed):
   ```powershell
   # Using Chocolatey
   choco install openssl
   
   # Or download from: https://slproweb.com/products/Win32OpenSSL.html
   ```

2. **Generate certificate:**
   ```powershell
   cd backend\certs
   openssl req -x509 -newkey rsa:4096 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=EPRI/CN=localhost"
   ```

3. **Enable HTTPS in `.env`:**
   ```env
   ENABLE_HTTPS=true
   ```

### Option 2: mkcert (Recommended for Development - No Browser Warnings)

1. **Install mkcert:**
   ```powershell
   # Using Chocolatey
   choco install mkcert
   ```

2. **Install local CA:**
   ```powershell
   mkcert -install
   ```

3. **Generate certificate:**
   ```powershell
   cd backend\certs
   mkcert localhost 127.0.0.1 ::1
   move localhost+2.pem cert.pem
   move localhost+2-key.pem key.pem
   ```

4. **Enable HTTPS in `.env`:**
   ```env
   ENABLE_HTTPS=true
   ```

### Option 3: Environment Variables (Production)

1. **Obtain certificates** from:
   - Let's Encrypt (free)
   - Commercial CA
   - Your hosting provider

2. **Add to `.env`:**
   ```env
   ENABLE_HTTPS=true
   HTTPS_PORT=3443
   SSL_CERT_PATH=C:\path\to\your\certificate.crt
   SSL_KEY_PATH=C:\path\to\your\private.key
   SSL_CA_PATH=C:\path\to\your\ca.crt  # Optional
   ```

## File Structure

After setup, your `backend/certs/` directory should contain:
```
backend/
  certs/
    cert.pem    # SSL certificate
    key.pem     # Private key
    ca.pem      # Optional: CA certificate
```

## Verification

1. **Start the server:**
   ```powershell
   npm run dev
   ```

2. **Check the console output:**
   - ✅ Success: `🔒 HTTPS server running on port 3443`
   - ❌ Error: `⚠️ HTTPS enabled but certificates not found`

3. **Test in browser:**
   - Navigate to: `https://localhost:3443/api/health`
   - For self-signed: Accept the security warning
   - For mkcert: No warning should appear

## Troubleshooting

### "OpenSSL not found"
- Install OpenSSL via Chocolatey: `choco install openssl`
- Or download from: https://slproweb.com/products/Win32OpenSSL.html
- Make sure OpenSSL is in your PATH

### "Certificate not found" error
- Check that files exist in `backend/certs/`
- Verify file names: `cert.pem` and `key.pem` (not `.crt` or `.key`)
- Check file permissions (should be readable)

### Browser shows "Not Secure"
- This is normal for self-signed certificates
- Use mkcert to avoid warnings
- For production, use a valid CA certificate

### Port already in use
- Change `HTTPS_PORT` in `.env` to a different port
- Or stop the process using port 3443

## Security Notes

⚠️ **Never commit certificates to git!**
- Certificates are already in `.gitignore`
- Keep private keys secure
- Use environment variables for production paths

