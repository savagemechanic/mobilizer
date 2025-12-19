# Manual Render.com Setup Guide

Follow these steps to deploy your backend manually on Render.com (5 minutes).

## Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `mobilizer-db`
   - **Database**: `mobilizer`
   - **User**: `mobilizer`
   - **Region**: Oregon (US West)
   - **Plan**: **Free**
4. Click **Create Database**
5. Wait ~2 minutes for it to provision
6. **Copy the "Internal Database URL"** (looks like: `postgresql://mobilizer:...@...`)

---

## Step 2: Create Redis Instance

1. Click **New +** → **Redis**
2. Configure:
   - **Name**: `mobilizer-redis`
   - **Region**: Oregon (US West)
   - **Plan**: **Free**
3. Click **Create Redis**
4. Wait ~1 minute
5. **Copy the "Redis Connection String"** (looks like: `redis://red-...`)

---

## Step 3: Create Web Service (Backend)

1. Click **New +** → **Web Service**
2. Click **Connect Git Repository** → Select your repository
3. Configure:

   **Basic Settings:**
   - **Name**: `mobilizer-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `apps/backend`
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     yarn install && yarn build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```bash
     node dist/main.js
     ```
   - **Plan**: **Free**

4. Click **Advanced** → Add Environment Variables:

   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<paste Internal Database URL from Step 1>
   REDIS_URL=<paste Redis URL from Step 2>
   JWT_SECRET=your-super-secret-key-change-this-to-something-random-min-32-chars
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=another-super-secret-key-also-change-this-to-random-min-32
   JWT_REFRESH_EXPIRES_IN=30d
   FRONTEND_URL=http://localhost:3000
   ```

   **Important**: Change the JWT_SECRET values to random strings!

   To generate random secrets:
   ```bash
   # Run in terminal:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Click **Create Web Service**

---

## Step 4: Wait for Deployment

1. Watch the logs in the Render dashboard
2. First deploy takes ~5-10 minutes
3. Look for: "Application is running on port 4000"
4. Your backend will be at: `https://mobilizer-backend.onrender.com`

---

## Step 5: Seed the Database

After the first deployment succeeds:

1. Go to your **mobilizer-backend** service
2. Click the **Shell** tab
3. Run this command:
   ```bash
   npx prisma db seed
   ```
4. Wait for it to complete (~30 seconds)
5. You should see: "SEED COMPLETED SUCCESSFULLY!"

---

## Step 6: Test Your Backend

Open in browser: `https://mobilizer-backend.onrender.com/graphql`

You should see the GraphQL Playground!

---

## Step 7: Update FRONTEND_URL (After Frontend Deployed)

After you deploy your frontend to Vercel:

1. Go to **mobilizer-backend** service
2. Click **Environment** tab
3. Find `FRONTEND_URL`
4. Click **Edit**
5. Change value to: `https://your-app-name.vercel.app`
6. Click **Save** (this triggers a redeploy)

---

## Troubleshooting

### ❌ Build fails with "Cannot find module"

**Solution**: Make sure you're in the monorepo root when running build commands.

Update **Build Command** to:
```bash
cd ../.. && yarn install && yarn workspace @mobilizer/backend build && cd apps/backend && npx prisma generate && npx prisma migrate deploy
```

---

### ❌ "ECONNREFUSED" database errors

**Solution**:
1. Check your `DATABASE_URL` is the **Internal Database URL** (not External)
2. Make sure database is in "Available" status
3. Try redeploying the web service

---

### ❌ Migrations fail

**Solution**: Run migrations manually in Shell:
```bash
npx prisma migrate deploy
```

---

### ❌ Service keeps restarting

**Solution**: Check logs for errors. Common issues:
- Missing environment variables
- Database connection failed
- Redis connection failed

Make sure all environment variables from Step 3 are set correctly.

---

## Next Steps

✅ Backend deployed!

Now deploy your frontend:
1. See **VERCEL_SETUP.md** for Vercel deployment
2. Update `FRONTEND_URL` in backend (Step 7 above)
3. Test the full app!

---

## Free Tier Limitations

- **Services sleep** after 15 minutes of inactivity
- **Cold start** takes ~30 seconds when service wakes up
- **Database** expires after 90 days (free tier)

**To keep awake**: Use UptimeRobot (free) to ping every 10 minutes:
- Sign up: https://uptimerobot.com
- Add HTTP monitor: `https://mobilizer-backend.onrender.com`
- Check interval: 5 minutes

**For permanent database**: Switch to Neon.tech (free forever):
- Sign up: https://neon.tech
- Create database
- Copy connection string
- Update `DATABASE_URL` in Render
