# Netlify Deployment Guide

This project is configured for easy deployment to Netlify.

## Quick Deploy Options

### Option 1: Deploy via Netlify CLI (Recommended)

1. **Install Netlify CLI globally:**
   ```powershell
   npm install -g netlify-cli
   ```

2. **Build the project:**
   ```powershell
   npm run build
   ```

3. **Login to Netlify:**
   ```powershell
   netlify login
   ```

4. **Deploy to Netlify:**
   
   For a draft/test deployment:
   ```powershell
   netlify deploy
   ```
   
   For production deployment:
   ```powershell
   netlify deploy --prod
   ```

### Option 2: Deploy via Netlify Web UI

1. **Build the project locally:**
   ```powershell
   npm run build
   ```

2. **Go to [Netlify](https://app.netlify.com/)**

3. **Drag and drop the `dist` folder** to the Netlify deploy zone

### Option 3: Continuous Deployment from Git (Best for Production)

1. **Push your code to GitHub:**
   ```powershell
   git add .
   git commit -m "Add Netlify configuration"
   git push origin main
   ```

2. **Go to [Netlify](https://app.netlify.com/)**

3. **Click "Add new site" → "Import an existing project"**

4. **Connect to your Git provider** (GitHub)

5. **Select your repository:** `Student-Distraction-Free-Learning-Focus-Mode-`

6. **Configure build settings** (should auto-detect from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

7. **Click "Deploy site"**

## Configuration Files

The following files have been created for Netlify deployment:

- **`netlify.toml`** - Main Netlify configuration
  - Build settings
  - Redirect rules for SPA routing
  - Security headers
  - Cache control headers

- **`_redirects`** - Backup redirect rules for SPA

- **`.nvmrc`** - Specifies Node.js version (18)

## Environment Variables

If you need to add environment variables:

1. Go to your site in Netlify
2. Navigate to **Site settings → Environment variables**
3. Add your variables

## Custom Domain

After deployment, you can add a custom domain:

1. Go to **Domain settings** in Netlify
2. Click **Add custom domain**
3. Follow the DNS configuration instructions

## SSL Certificate

Netlify automatically provisions and renews SSL certificates for your site.

## Build Status

Once deployed via Git, Netlify will:
- ✅ Auto-build on every push to main branch
- ✅ Create preview deployments for pull requests
- ✅ Provide build notifications

## Troubleshooting

### Build fails on Netlify:
- Check the build log in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version matches `.nvmrc`

### 404 errors on refresh:
- The `netlify.toml` file should handle this with SPA redirects
- Ensure the `_redirects` file is in the `dist` folder

### Icons or manifest not loading:
- Check the build output includes `icons/` and `manifest.json`
- Verify paths in `manifest.json` are absolute (start with `/`)

## Post-Deployment Checklist

After deployment, verify:
- [ ] Site loads correctly
- [ ] Navigation works (no 404 on refresh)
- [ ] Manifest.json is accessible at `yoursite.netlify.app/manifest.json`
- [ ] Icons are loading
- [ ] PWA install prompt works
- [ ] Service worker registers (check DevTools → Application)

## Local Testing

Before deploying, test the production build locally:

```powershell
npm run build
npm start
```

Then open http://localhost:3000 and verify everything works.

## Support

- Netlify Docs: https://docs.netlify.com/
- Netlify Community: https://answers.netlify.com/