# Deployment Guide - BidHub Auction Platform

## Quick Deploy (5 Minutes)

### Step 1: Deploy Backend to Render

1. Go to **https://render.com** and sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub and select **joe1m2/Auction-Platform**
4. Fill in:
   - **Name:** `bidhub-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
   - **Plan:** Free
5. Add environment variable:
   - Key: `JWT_SECRET`
   - Value: Click "Generate" to create a random secret
6. Click **"Create Web Service"**
7. Wait 2-3 minutes for deployment
8. **Copy your Render URL** (e.g., `https://bidhub-api.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. Go to **https://vercel.com** and sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import **joe1m2/Auction-Platform**
4. Configure:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./`
   - **Build Command:** (leave empty)
   - **Output Directory:** `.`
5. Click **"Deploy"**
6. Wait 1-2 minutes
7. **Copy your Vercel URL** (e.g., `https://auction-platform.vercel.app`)

### Step 3: Connect Frontend to Backend

1. Open `Auction platform/js/api.js` in your code editor
2. Find line 5: `const API_BASE = 'http://localhost:5000/api';`
3. Replace with your Render URL: `const API_BASE = 'https://bidhub-api.onrender.com/api';`
4. Save, commit, and push:
   ```bash
   git add js/api.js
   git commit -m "Connect frontend to production backend"
   git push
   ```
5. Vercel will auto-redeploy within 1-2 minutes

## Your Live URLs

After deployment:
- **Frontend:** `https://auction-platform.vercel.app`
- **Backend API:** `https://bidhub-api.onrender.com`
- **GitHub:** https://github.com/joe1m2/Auction-Platform

## Test the Live Site

1. Visit your Vercel URL
2. Click "Login" and use test account:
   - Email: `john@example.com`
   - Password: `password123`
3. Try placing bids, viewing dashboard, etc.

## Important Notes

### Render Free Tier
- Free tier services spin down after 15 minutes of inactivity
- First request after inactivity takes ~30 seconds to wake up
- 750 hours/month free (enough for 1 service 24/7)

### Vercel Free Tier
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Global CDN

### Database Persistence
- SQLite database is stored on Render's persistent disk
- Data survives deployments and server restarts
- 1GB disk space (free tier)

## Troubleshooting

### Backend not responding?
- Check Render logs for errors
- Ensure JWT_SECRET is set
- Verify build command is correct

### Frontend can't connect to backend?
- Check CORS settings in server.js (already configured)
- Verify API_BASE URL in js/api.js
- Check browser console for errors

### Database issues?
- Render automatically creates the database on first run
- Seed data loads automatically
- Check Render logs for "Database seeded successfully"

## Updating the Site

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push
```

Both Vercel and Render will auto-deploy from GitHub.

## Custom Domain (Optional)

### Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Render:
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records

## Support

- GitHub Issues: https://github.com/joe1m2/Auction-Platform/issues
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs