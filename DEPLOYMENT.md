# Deployment Guide for Render

This guide will help you deploy the Voting App as a single service on Render.

## Prerequisites

1. A GitHub/GitLab/Bitbucket account with your code pushed
2. A Render account (sign up at https://render.com)
3. A MongoDB database (you can use MongoDB Atlas or Render's MongoDB service)

## Step 1: Prepare Your MongoDB Database

1. Create a MongoDB database (MongoDB Atlas recommended: https://www.mongodb.com/cloud/atlas)
2. Get your MongoDB connection URI (should look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)

## Step 2: Set Up Environment Variables

Before deploying, gather these environment variables:

### Required Environment Variables:

1. **MONGODB_URI** - Your MongoDB connection string
   - Example: `mongodb+srv://user:pass@cluster.mongodb.net/voting-app?retryWrites=true&w=majority`

2. **JWT_SECRET** - Secret key for JWT token generation (use a strong random string)
   - Generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **CLIENT_BASE_URL** - Your Render app URL (you'll set this after deployment)
   - Example: `https://your-app-name.onrender.com`
   - ⚠️ **Important**: Set this after you get your Render URL

### Optional Environment Variables (for email functionality):

4. **EMAIL_HOST** - SMTP server host (defaults to `smtp.gmail.com`)
5. **EMAIL_PORT** - SMTP port (defaults to `587`)
6. **EMAIL_USER** - Your email address for sending emails
7. **EMAIL_PASS** - Your email app password (for Gmail, use App Password)
8. **EMAIL_FROM** - From email address (defaults to EMAIL_USER)
9. **SMTP_HOST** - Alternative SMTP host variable
10. **SMTP_PORT** - Alternative SMTP port variable
11. **SMTP_USER** - Alternative SMTP user variable
12. **SMTP_PASS** - Alternative SMTP password variable

### Server Port:

- **PORT** - Render automatically sets this, but defaults to `5000` if not set

## Step 3: Deploy on Render

### 3.1 Create a New Web Service

1. Log in to your Render dashboard
2. Click **"New +"** button
3. Select **"Web Service"**
4. Connect your Git repository (GitHub/GitLab/Bitbucket)
5. Select the repository containing this Voting App

### 3.2 Configure the Service

Fill in the following settings:

- **Name**: `voting-app` (or your preferred name)
- **Region**: Choose the closest region to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root of the repository)
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Choose based on your needs (Free tier available for testing)

### 3.3 Set Environment Variables

In the Render dashboard, go to the **Environment** section and add these variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_BASE_URL=https://your-app-name.onrender.com
```

**Note**: Set `CLIENT_BASE_URL` after your first deployment. Initially, you can leave it as `https://your-app-name.onrender.com` (replace with your actual app name).

#### Optional Email Variables (if you need email functionality):

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 3.4 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying your app
3. Wait for the build to complete (this may take 5-10 minutes the first time)
4. Once deployed, you'll get a URL like: `https://your-app-name.onrender.com`

### 3.5 Update CLIENT_BASE_URL

After your first deployment:

1. Copy your Render app URL (from the dashboard)
2. Go to **Environment** section
3. Update `CLIENT_BASE_URL` to your actual Render URL
4. Save changes (this will trigger a new deployment)

## Step 4: Verify Deployment

1. Visit your Render app URL
2. You should see the Voting App login page
3. Create a new account or log in
4. Test the main functionality

## Step 5: Domain Setup (Optional)

If you want to use a custom domain:

1. Go to your service settings in Render
2. Click **"Custom Domains"**
3. Add your domain
4. Follow Render's instructions to configure DNS

## Build Process

The deployment process works as follows:

1. **Build Command** (`npm run build`):
   - Installs server dependencies
   - Installs client dependencies
   - Builds the React app (creates `client/build` folder)

2. **Start Command** (`npm start`):
   - Installs server dependencies
   - Starts the Node.js server
   - Server serves the built React app from `client/build`

## Troubleshooting

### Build Fails

- Check that all dependencies are properly listed in `package.json` files
- Verify Node.js version compatibility (requires Node 14+)
- Check build logs in Render dashboard for specific errors

### App Doesn't Start

- Verify all required environment variables are set
- Check MongoDB connection string is correct
- Review server logs in Render dashboard

### API Calls Fail

- Ensure `CLIENT_BASE_URL` is set correctly (should match your Render URL)
- Check that the API routes are being served correctly
- Verify CORS settings (should work by default with same-origin requests)

### Database Connection Issues

- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (should allow all IPs: `0.0.0.0/0`)
- Ensure MongoDB database user has proper permissions

### Email Not Working

- Verify SMTP credentials are correct
- For Gmail, use App Password (not your regular password)
- Check that `EMAIL_USER` and `EMAIL_PASS` are set correctly

## Free Tier Limitations

If using Render's free tier:

- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours of usage per month (enough for one always-on service)
- Consider upgrading to paid tier for production use

## Support

For issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Test locally first with the same environment variables
4. Check MongoDB connection and database status

