# Deployment Guide

This guide covers deploying the Mobilizer v2 application.

## Frontend Deployment (Vercel)

### Prerequisites

- GitHub/GitLab/Bitbucket account
- Vercel account (sign up at https://vercel.com)
- Push your code to a Git repository

### Step 1: Prepare for Deployment

1. **Update Environment Variables** - Create `.env.production` in `apps/web/`:

```env
NEXT_PUBLIC_GRAPHQL_HTTP_URL=https://your-backend-url.com/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://your-backend-url.com/graphql
```

2. **Verify Build Locally**:

```bash
cd apps/web
yarn build
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your Git repository
3. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && yarn build --filter=web`
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `cd ../.. && yarn install`

4. **Add Environment Variables**:
   - `NEXT_PUBLIC_GRAPHQL_HTTP_URL` → Your backend GraphQL HTTP endpoint
   - `NEXT_PUBLIC_GRAPHQL_WS_URL` → Your backend GraphQL WebSocket endpoint

5. Click **Deploy**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Your account)
# - Link to existing project? No
# - Project name? mobilizer-web
# - Directory? apps/web
# - Override settings? Yes
# - Build Command? cd ../.. && yarn build --filter=web
# - Output Directory? .next
# - Development Command? yarn dev
```

### Step 3: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to **Domains**
3. Add your custom domain
4. Update DNS records as instructed

### Monorepo Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "cd apps/web && yarn build",
  "devCommand": "cd apps/web && yarn dev",
  "installCommand": "yarn install",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next"
}
```

---

## Backend Deployment (Free Options)

Your NestJS backend requires:
- Node.js runtime
- PostgreSQL database
- Redis (for caching/sessions)

### 🌟 Recommended: Render.com (Best Free Option)

**Pros:**
- Generous free tier
- Managed PostgreSQL (1GB storage, expires after 90 days)
- Managed Redis (25MB, sleeps after inactivity)
- Automatic HTTPS
- GitHub auto-deploys

**Cons:**
- Services sleep after 15 minutes of inactivity (cold starts ~30s)
- Database expires after 90 days on free tier

#### Deploy to Render

1. **Sign up**: https://render.com

2. **Create PostgreSQL Database**:
   - Dashboard → New → PostgreSQL
   - Name: `mobilizer-db`
   - Plan: Free
   - Copy the **Internal Database URL**

3. **Create Redis Instance**:
   - Dashboard → New → Redis
   - Name: `mobilizer-redis`
   - Plan: Free
   - Copy the **Redis URL**

4. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect your Git repository
   - **Settings**:
     - **Name**: `mobilizer-backend`
     - **Environment**: Node
     - **Region**: Oregon (US West)
     - **Branch**: main
     - **Root Directory**: `apps/backend`
     - **Build Command**: `yarn install && yarn build && npx prisma generate && npx prisma migrate deploy`
     - **Start Command**: `node dist/main.js`

5. **Environment Variables**:

```env
# Database
DATABASE_URL=<Internal Database URL from step 2>

# Redis
REDIS_URL=<Redis URL from step 3>

# JWT
JWT_SECRET=<generate-random-string-here>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<another-random-string>
JWT_REFRESH_EXPIRES_IN=30d

# Server
NODE_ENV=production
PORT=4000

# CORS (your Vercel frontend URL)
FRONTEND_URL=https://your-app.vercel.app

# Optional: File uploads
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

6. Click **Create Web Service**

7. **After first deploy**, seed the database:
   - Go to your service's Shell tab
   - Run: `npx prisma db seed`

#### Update Frontend Environment

Update your Vercel frontend env vars:
```env
NEXT_PUBLIC_GRAPHQL_HTTP_URL=https://mobilizer-backend.onrender.com/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://mobilizer-backend.onrender.com/graphql
```

---

### Alternative: Railway.app

**Pros:**
- $5 free trial credit
- PostgreSQL & Redis included
- No sleep/cold starts
- Great DX

**Cons:**
- Free credits run out (~1 month)
- Requires credit card

#### Deploy to Railway

1. **Sign up**: https://railway.app

2. **Create Project**:
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli

   # Login
   railway login

   # Create project
   railway init
   ```

3. **Add Services**:
   - Add PostgreSQL: `railway add --database postgres`
   - Add Redis: `railway add --database redis`

4. **Deploy Backend**:
   ```bash
   cd apps/backend
   railway up
   ```

5. **Environment Variables**:
   - Railway auto-injects `DATABASE_URL` and `REDIS_URL`
   - Add other env vars in Railway dashboard

---

### Alternative: Fly.io

**Pros:**
- Generous free tier (3 shared VMs, 3GB storage)
- Global edge network
- No sleep

**Cons:**
- Requires credit card
- More complex setup

#### Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
cd apps/backend
fly launch

# Add Postgres
fly postgres create

# Add Redis (via Upstash)
fly redis create

# Deploy
fly deploy
```

---

### Alternative: Koyeb

**Pros:**
- Free tier (2 services)
- No sleep
- Global CDN

**Cons:**
- Limited database options on free tier

#### Deploy to Koyeb

1. **Sign up**: https://koyeb.com

2. **Create App**:
   - Connect GitHub repo
   - Select `apps/backend` as root directory
   - Add environment variables
   - Deploy

3. **Database**: Use external free PostgreSQL:
   - **Neon** (https://neon.tech) - Free PostgreSQL
   - **Upstash** (https://upstash.com) - Free Redis

---

## Free Database Options (if needed separately)

### PostgreSQL

1. **Neon** (Recommended): https://neon.tech
   - 10GB storage free
   - Serverless PostgreSQL
   - Auto-scaling

2. **Supabase**: https://supabase.com
   - 500MB database free
   - Includes auth & storage

3. **ElephantSQL**: https://elephantsql.com
   - 20MB free
   - Managed PostgreSQL

### Redis

1. **Upstash**: https://upstash.com
   - 10K commands/day free
   - Serverless Redis

2. **Redis Cloud**: https://redis.com/try-free
   - 30MB free

---

## Environment Variables Summary

### Frontend (Vercel)

```env
NEXT_PUBLIC_GRAPHQL_HTTP_URL=https://your-backend.com/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=wss://your-backend.com/graphql
```

### Backend (All Platforms)

```env
# Database & Redis
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=another-super-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Server
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-app.vercel.app

# Optional
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Post-Deployment Checklist

### Backend

- [ ] Database migrations ran successfully
- [ ] Database seeded with initial data
- [ ] GraphQL endpoint accessible: `https://your-backend.com/graphql`
- [ ] Health check works: `https://your-backend.com/`
- [ ] CORS configured for frontend URL
- [ ] Environment variables set correctly

### Frontend

- [ ] Builds successfully on Vercel
- [ ] Environment variables set
- [ ] Can connect to backend GraphQL API
- [ ] WebSocket connection works (for subscriptions)
- [ ] Custom domain configured (if applicable)

---

## Monitoring & Maintenance

### Render.com

- **Logs**: View in Render dashboard → Logs tab
- **Keep awake**: Use a service like UptimeRobot to ping your backend every 10 minutes

### Vercel

- **Logs**: View in Vercel dashboard → Deployment logs
- **Analytics**: Enable Vercel Analytics in project settings

---

## Cost Comparison

| Platform | Free Tier | Database | Redis | Limitations |
|----------|-----------|----------|-------|-------------|
| **Render** | ✅ Yes | ✅ 1GB (90 days) | ✅ 25MB | Sleeps after 15min |
| **Railway** | 💳 $5 trial | ✅ Included | ✅ Included | Credits expire |
| **Fly.io** | 💳 Yes | ✅ 3GB | ❌ External | Requires card |
| **Koyeb** | ✅ Yes | ❌ External | ❌ External | 2 services max |
| **Vercel** | ✅ Yes | N/A | N/A | Frontend only |

**Recommendation for free deployment**: Render.com + Neon (external DB for persistence) + Upstash (external Redis)

---

## Troubleshooting

### Cold Starts on Render

If your backend sleeps, add this to keep it awake:

1. Sign up for free at https://uptimerobot.com
2. Add HTTP monitor for your backend URL
3. Check every 5 minutes

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Run migrations manually
npx prisma migrate deploy

# Check Prisma
npx prisma studio
```

### CORS Errors

Ensure `FRONTEND_URL` environment variable is set correctly in backend:

```typescript
// src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## Support

For deployment issues:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Fly.io: https://fly.io/docs
