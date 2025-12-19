# 🚀 Quick Deployment Guide

Get your Mobilizer app deployed in 15 minutes!

## 📋 Prerequisites

- [ ] Code pushed to GitHub/GitLab
- [ ] Vercel account (free): https://vercel.com/signup
- [ ] Render account (free): https://render.com/register

---

## ⚡ Fast Track: Deploy Everything Now

### Step 1: Deploy Backend (5 minutes)

**Using Render.com (Recommended - Free)**

1. **Create Account**: https://render.com/register

2. **One-Click Deploy**:
   - Click: https://render.com/deploy
   - Connect your GitHub repository
   - Select the `render.yaml` blueprint in `apps/backend/`
   - Click **Apply**

3. **Add Frontend URL**:
   - After services are created, go to **mobilizer-backend** service
   - Environment → Add variable:
     - Key: `FRONTEND_URL`
     - Value: `https://your-app.vercel.app` (you'll get this in Step 2)
   - Save and wait for redeploy

4. **Seed Database** (after first deploy):
   - Go to **mobilizer-backend** → Shell tab
   - Run: `npx prisma db seed`

5. **Copy your backend URL**: `https://mobilizer-backend.onrender.com`

---

### Step 2: Deploy Frontend (3 minutes)

**Using Vercel**

1. **Create Account**: https://vercel.com/signup

2. **Import Project**:
   - Go to: https://vercel.com/new
   - Import your repository
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" → Select `apps/web`

3. **Configure Build**:
   - **Build Command**: `cd ../.. && yarn build --filter=web`
   - **Install Command**: `cd ../.. && yarn install`
   - **Output Directory**: `.next` (keep default)

4. **Environment Variables**:
   - Add these variables:
   ```
   NEXT_PUBLIC_GRAPHQL_HTTP_URL=https://mobilizer-backend.onrender.com/graphql
   NEXT_PUBLIC_GRAPHQL_WS_URL=wss://mobilizer-backend.onrender.com/graphql
   ```

5. **Deploy**! Your app will be live at: `https://your-app.vercel.app`

---

### Step 3: Update Backend with Frontend URL (2 minutes)

Go back to Render:
1. Open **mobilizer-backend** service
2. Environment → Edit `FRONTEND_URL`
3. Change value to: `https://your-app.vercel.app`
4. Save (triggers redeploy)

---

## ✅ Verify Deployment

### Test Backend

```bash
# Health check
curl https://mobilizer-backend.onrender.com

# GraphQL playground
# Open in browser: https://mobilizer-backend.onrender.com/graphql
```

### Test Frontend

1. Open: `https://your-app.vercel.app`
2. Try to sign up / log in
3. Check browser console for errors

---

## 🐛 Common Issues

### ❌ "Service Unavailable" on first request

**Problem**: Render free tier services sleep after 15 minutes of inactivity.

**Solution**: Wait 30 seconds for cold start, then refresh.

**Prevention**: Use UptimeRobot (free) to ping your backend every 10 minutes.

---

### ❌ CORS errors in browser

**Problem**: `FRONTEND_URL` not set correctly in backend.

**Solution**:
1. Check Render → mobilizer-backend → Environment
2. Ensure `FRONTEND_URL` matches your Vercel URL exactly
3. No trailing slash: ✅ `https://app.vercel.app` ❌ `https://app.vercel.app/`

---

### ❌ Database connection failed

**Problem**: Database not ready or migrations not run.

**Solution**:
1. Go to Render → mobilizer-db
2. Check status (should be "Available")
3. Go to mobilizer-backend → Logs
4. Look for migration errors
5. Manually run migrations in Shell: `npx prisma migrate deploy`

---

### ❌ Frontend can't connect to backend

**Problem**: Wrong GraphQL URL in Vercel env vars.

**Solution**:
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Check `NEXT_PUBLIC_GRAPHQL_HTTP_URL`
3. Should be: `https://mobilizer-backend.onrender.com/graphql` (with `/graphql`)
4. Redeploy frontend after changing

---

## 🔧 Alternative: Manual Render Setup

If blueprint doesn't work:

1. **Create PostgreSQL**:
   - New → PostgreSQL
   - Name: `mobilizer-db`
   - Free tier
   - Copy **Internal Database URL**

2. **Create Redis**:
   - New → Redis
   - Name: `mobilizer-redis`
   - Free tier
   - Copy **Redis URL**

3. **Create Web Service**:
   - New → Web Service
   - Connect Git repo
   - **Root Directory**: `apps/backend`
   - **Build Command**:
     ```
     yarn install && yarn build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**: `node dist/main.js`
   - Add environment variables (see DEPLOYMENT.md)

---

## 💰 Cost Summary

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Vercel** | ✅ Unlimited | 100GB bandwidth/month |
| **Render** | ✅ Yes | Services sleep after 15min |
| **Neon DB** | ✅ 10GB storage | Serverless PostgreSQL |
| **Upstash Redis** | ✅ 10K commands/day | Serverless Redis |

**Total Monthly Cost**: $0 🎉

---

## 🎯 Next Steps

### Keep Backend Awake (Optional)

1. Sign up: https://uptimerobot.com (free)
2. Add HTTP monitor
3. URL: `https://mobilizer-backend.onrender.com`
4. Interval: 5 minutes

### Add Custom Domain (Optional)

**Frontend (Vercel)**:
1. Go to Project Settings → Domains
2. Add your domain: `app.yourdomain.com`
3. Update DNS records as shown

**Backend (Render)**:
1. Go to Service Settings → Custom Domains
2. Add: `api.yourdomain.com`
3. Update DNS CNAME

### Monitor Performance

- **Frontend**: Vercel Analytics (free) - Enable in project settings
- **Backend**: Render Logs - View real-time logs in dashboard

### Upgrade Database (When Ready)

Render free database expires after 90 days. Before then:

**Option 1**: Upgrade Render DB ($7/month)

**Option 2**: Migrate to external DB:
- Neon (free forever, 10GB)
- Supabase (free, 500MB)

Export data:
```bash
pg_dump $DATABASE_URL > backup.sql
```

Import to new database:
```bash
psql $NEW_DATABASE_URL < backup.sql
```

---

## 📚 Full Documentation

For detailed guides, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [README.md](./README.md) - Development setup

---

## 🆘 Need Help?

**Render Issues**: https://render.com/docs
**Vercel Issues**: https://vercel.com/docs
**Database Issues**: Check Prisma logs in Render Shell

**Still stuck?** Open an issue in your repository with:
- Deployment platform (Render/Vercel)
- Error message
- Screenshot of logs
