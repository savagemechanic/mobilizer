# Vercel Frontend Deployment Guide

Deploy your Next.js frontend to Vercel in 5 minutes.

## Prerequisites

- [ ] Backend deployed on Render (see RENDER_MANUAL_SETUP.md)
- [ ] Backend URL ready (e.g., `https://mobilizer-backend.onrender.com`)
- [ ] Code pushed to GitHub

---

## Step 1: Create Vercel Account

1. Go to: https://vercel.com/signup
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

---

## Step 2: Import Your Project

1. Go to: https://vercel.com/new
2. Click **Import Git Repository**
3. Find and select: `savagemechanic/mobilizer`
4. Click **Import**

---

## Step 3: Configure Project

### Root Directory

1. Click **Edit** next to "Root Directory"
2. Select: `apps/web`
3. Click **Continue**

### Framework

- Vercel should auto-detect: **Next.js**
- If not, select it manually

### Build Settings

Click **Override** and configure:

**Build Command**:
```bash
yarn build
```

**Output Directory**:
```
.next
```
(This is auto-detected, leave as default)

**Install Command**:
```bash
yarn install
```

**Development Command**:
```bash
yarn dev
```

---

## Step 4: Environment Variables

Click **Environment Variables** section and add:

### Required Variables

**Variable 1:**
```
Name: NEXT_PUBLIC_GRAPHQL_HTTP_URL
Value: https://mobilizer-backend.onrender.com/graphql
```

**Variable 2:**
```
Name: NEXT_PUBLIC_GRAPHQL_WS_URL
Value: wss://mobilizer-backend.onrender.com/graphql
```

**Important**: Replace `mobilizer-backend.onrender.com` with your actual Render backend URL!

⚠️ Make sure to include `/graphql` at the end!

---

## Step 5: Deploy!

1. Click **Deploy**
2. Wait ~2-3 minutes for build
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## Step 6: Update Backend CORS

Now that you have your frontend URL:

1. Go back to Render: https://dashboard.render.com
2. Open your **mobilizer-backend** service
3. Click **Environment** tab
4. Find `FRONTEND_URL` variable
5. Click **Edit**
6. Change value to: `https://your-project-name.vercel.app`
7. Click **Save** (triggers redeploy)

---

## Step 7: Test Your App

1. Open: `https://your-project-name.vercel.app`
2. Try to sign up / create account
3. Open browser DevTools → Console
4. Check for any errors

### Expected behavior:
- ✅ Page loads without errors
- ✅ Can navigate between pages
- ✅ Forms work (signup, login)
- ✅ GraphQL requests succeed

---

## Troubleshooting

### ❌ Build Error: "Cannot find module"

**Problem**: Monorepo dependencies not installed correctly.

**Solution**: Update build command to:
```bash
cd ../.. && yarn install && yarn workspace @mobilizer/web build
```

And install command to:
```bash
cd ../.. && yarn install
```

---

### ❌ Runtime Error: "Failed to fetch" / Network Error

**Problem**: Can't connect to backend.

**Solution**:
1. Check environment variables in Vercel:
   - Go to Settings → Environment Variables
   - Verify `NEXT_PUBLIC_GRAPHQL_HTTP_URL` is correct
   - Must include `https://` and `/graphql`
2. Redeploy after fixing

---

### ❌ CORS Error in Browser Console

**Problem**: Backend not accepting requests from frontend domain.

**Solution**:
1. Check backend `FRONTEND_URL` in Render
2. Must match exactly: `https://your-app.vercel.app`
3. No trailing slash!
4. Wait for backend redeploy

---

### ❌ Blank Page / "Application error"

**Problem**: Runtime error in Next.js.

**Solution**:
1. Go to Vercel → Your Project → Deployments
2. Click latest deployment → View Function Logs
3. Check for errors
4. Common issues:
   - Missing environment variables
   - GraphQL client configuration error

---

## Custom Domain (Optional)

### Add Your Domain

1. Go to: Project Settings → Domains
2. Click **Add Domain**
3. Enter: `app.yourdomain.com`
4. Vercel will show DNS records needed

### Configure DNS

Add these records at your domain registrar:

**For subdomain** (app.yourdomain.com):
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

**For root domain** (yourdomain.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

### Update Backend CORS

After adding custom domain:
1. Update `FRONTEND_URL` in Render backend
2. Change to: `https://app.yourdomain.com`
3. Save and redeploy

---

## Environment Variables Explained

### `NEXT_PUBLIC_GRAPHQL_HTTP_URL`
- GraphQL endpoint for queries/mutations
- Must start with `https://`
- Must end with `/graphql`
- Example: `https://api.example.com/graphql`

### `NEXT_PUBLIC_GRAPHQL_WS_URL`
- WebSocket endpoint for subscriptions (real-time updates)
- Must start with `wss://` (secure WebSocket)
- Must end with `/graphql`
- Example: `wss://api.example.com/graphql`

---

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Production**: Pushes to `main` branch
- **Preview**: Pushes to other branches
- **Pull Requests**: Each PR gets a preview URL

Configure in: Settings → Git

---

## Performance Monitoring (Optional)

### Enable Vercel Analytics

1. Go to: Settings → Analytics
2. Click **Enable**
3. View metrics: Core Web Vitals, page views, etc.

### Enable Vercel Speed Insights

1. Install package:
   ```bash
   yarn add @vercel/speed-insights
   ```

2. Add to `apps/web/src/app/layout.tsx`:
   ```typescript
   import { SpeedInsights } from '@vercel/speed-insights/next';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <SpeedInsights />
         </body>
       </html>
     );
   }
   ```

---

## Deployment Checklist

- [x] Project imported to Vercel
- [x] Root directory set to `apps/web`
- [x] Environment variables added
- [x] First deployment successful
- [x] Backend CORS updated with frontend URL
- [x] App tested and working
- [ ] Custom domain added (optional)
- [ ] Analytics enabled (optional)

---

## Next Steps

✅ Frontend deployed!

### Keep Backend Awake

Free Render services sleep. Use UptimeRobot:
1. Sign up: https://uptimerobot.com
2. Add monitor: `https://mobilizer-backend.onrender.com`
3. Interval: 5 minutes

### Monitor Performance

- Check Vercel deployment logs regularly
- Enable Analytics for usage insights
- Monitor error rates

### Production Checklist

Before going live:
- [ ] Custom domain configured
- [ ] SSL certificate active (auto via Vercel)
- [ ] Error tracking setup (Sentry, LogRocket)
- [ ] Analytics configured (Google Analytics, Mixpanel)
- [ ] SEO metadata added
- [ ] Social media preview images
- [ ] Sitemap generated
- [ ] robots.txt configured

---

## Cost

**Vercel Free Tier**:
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments

**Total Monthly Cost**: $0 🎉

---

## Support

**Vercel Docs**: https://vercel.com/docs
**Next.js Docs**: https://nextjs.org/docs
**GraphQL Client**: https://www.apollographql.com/docs/react

**Need help?** Check Vercel deployment logs first!
