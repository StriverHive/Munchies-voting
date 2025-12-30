# Quick Setup Summary for Render

## ✅ Project is Ready for Deployment!

Your Voting App has been configured to deploy as a single service on Render.

## Changes Made

1. ✅ Created root `package.json` with build and start scripts
2. ✅ Updated `server/server.js` to serve React build as static files
3. ✅ Created API configuration (`client/src/config/api.js`) for environment-based API URLs
4. ✅ Updated all client files to use API config (removed hardcoded localhost URLs)
5. ✅ Updated `.gitignore` to exclude build folders
6. ✅ Created deployment documentation (`DEPLOYMENT.md`)

## Quick Start on Render

### 1. Push to Git
```bash
git add .
git commit -m "Prepare for Render deployment"
git push
```

### 2. Create Web Service on Render
- Go to https://dashboard.render.com
- Click **New +** → **Web Service**
- Connect your Git repository
- Use these settings:
  - **Build Command**: `npm run build`
  - **Start Command**: `npm start`
  - **Root Directory**: (leave empty)

### 3. Set Environment Variables

**Required:**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `CLIENT_BASE_URL` - Set this AFTER first deployment (your Render URL: `https://your-app-name.onrender.com`)

**Optional (for emails):**
- `EMAIL_USER` - Your email address
- `EMAIL_PASS` - Your email app password
- `EMAIL_HOST` - SMTP host (default: smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (default: 587)

### 4. Deploy and Update CLIENT_BASE_URL

1. Click **Create Web Service**
2. Wait for first deployment
3. Copy your app URL (e.g., `https://your-app-name.onrender.com`)
4. Go to **Environment** tab
5. Update `CLIENT_BASE_URL` to your actual URL
6. Save (triggers redeploy)

## How It Works

- **Build Phase**: Builds the React app into `client/build`
- **Start Phase**: Serves the built React app from the Express server
- All API calls go to `/api/*` routes (handled by Express)
- All other routes serve the React app (client-side routing)

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

