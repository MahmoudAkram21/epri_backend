# CORS Fix for Deployment

## Problem
When deployed, browser requests to the API were failing with CORS errors, but direct URL access worked fine.

**Root Cause:** The CORS configuration was too restrictive and didn't account for:
- Different protocols (http vs https)
- Different ports on the same domain
- Frontend and backend on the same domain but different subdomains/ports

## Solution Applied

Updated CORS configuration in both `server.ts` and `server-auth.ts` to:

1. **Allow multiple origins** including all variations of the deployment domain
2. **Smart domain matching** - Allows any origin from the same hostname regardless of protocol or port
3. **Better error logging** - Warns about blocked origins for debugging

### Changes Made

**Before:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

**After:**
```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://epri.developteam.site',
  'https://epri.developteam.site',
  // ... all variations
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Allow same domain with different protocol/port
      const originUrl = new URL(origin);
      const isSameDomain = originUrl.hostname === 'epri.developteam.site' || 
                          originUrl.hostname === 'localhost';
      
      if (isSameDomain) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Environment Variables

Set in your `.env` file for production:

```env
FRONTEND_URL=http://epri.developteam.site
# or
FRONTEND_URL=https://epri.developteam.site
```

## Testing

1. **Check browser console** - Should no longer see CORS errors
2. **Check network tab** - Requests should succeed (green status)
3. **Check server logs** - No CORS warnings for your domain

## Troubleshooting

### Still seeing CORS errors?

1. **Check the exact origin** in browser dev tools:
   - Open Network tab
   - Click on failed request
   - Check the "Origin" header in Request Headers
   - Make sure it matches your domain

2. **Check server logs** for CORS warnings:
   ```bash
   # Look for: "CORS blocked origin: ..."
   ```

3. **Verify environment variables**:
   ```bash
   echo $FRONTEND_URL
   ```

4. **Test with curl**:
   ```bash
   curl -H "Origin: http://epri.developteam.site" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        http://epri.developteam.site:5000/api/service-centers \
        -v
   ```
   
   Should see: `Access-Control-Allow-Origin: http://epri.developteam.site`

### Common Issues

**Issue:** "Provisional headers are shown"
- **Cause:** CORS preflight request failed
- **Fix:** Ensure `OPTIONS` method is allowed in CORS config ✅ (already added)

**Issue:** Still blocking requests
- **Cause:** Origin doesn't match any allowed pattern
- **Fix:** Add your exact frontend URL to `allowedOrigins` array or set `FRONTEND_URL` env var

**Issue:** Credentials not working
- **Cause:** Credentials require specific CORS settings
- **Fix:** Already configured with `credentials: true` ✅

## Security Notes

⚠️ The current configuration allows all origins from `epri.developteam.site` regardless of protocol/port. This is:
- ✅ **OK for same-domain deployment** (frontend and backend on same domain)
- ⚠️ **Review for production** - Consider restricting to specific origins if security is a concern

For stricter security in production, remove the "same domain" fallback and only use `allowedOrigins` array.

