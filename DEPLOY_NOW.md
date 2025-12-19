# 🚀 Deploy Your App NOW - Simple Guide

**Total Time**: 15 minutes | **Cost**: $0

---

## Quick Links

📘 **Backend Setup**: [RENDER_MANUAL_SETUP.md](./RENDER_MANUAL_SETUP.md)
📗 **Frontend Setup**: [VERCEL_SETUP.md](./VERCEL_SETUP.md)

---

## Step-by-Step

### 1️⃣ Deploy Backend (7 minutes)

Go to **[Render.com](https://render.com)**:

1. Create **PostgreSQL** database → Copy URL
2. Create **Redis** instance → Copy URL
3. Create **Web Service**:
   - Repository: Your GitHub repo
   - Root: `apps/backend`
   - Build: `yarn install && yarn build && npx prisma generate && npx prisma migrate deploy`
   - Start: `node dist/main.js`
   - Add environment variables (see [RENDER_MANUAL_SETUP.md](./RENDER_MANUAL_SETUP.md))
4. Wait for deploy (~5 min)
5. Run in Shell: `npx prisma db seed`

✅ **Your backend**: `https://mobilizer-backend.onrender.com`

---

### 2️⃣ Deploy Frontend (3 minutes)

Go to **[Vercel.com](https://vercel.com/new)**:

1. Import your GitHub repository
2. Root Directory: `apps/web`
3. Build Command: `yarn build`
4. Add environment variables:
   ```
   NEXT_PUBLIC_GRAPHQL_HTTP_URL=https://mobilizer-backend.onrender.com/graphql
   NEXT_PUBLIC_GRAPHQL_WS_URL=wss://mobilizer-backend.onrender.com/graphql
   ```
5. Click **Deploy**

✅ **Your frontend**: `https://your-app.vercel.app`

---

### 3️⃣ Connect Them (2 minutes)

Update backend CORS:

1. Go to Render → **mobilizer-backend** → Environment
2. Edit `FRONTEND_URL` → Change to: `https://your-app.vercel.app`
3. Save (redeploys automatically)

---

## ✅ Done!

Open your app: `https://your-app.vercel.app`

Try signing up and logging in!

---

## 🐛 Having Issues?

| Problem | Solution |
|---------|----------|
| Backend won't start | Check logs in Render dashboard |
| CORS errors | Verify `FRONTEND_URL` matches Vercel URL exactly |
| Can't connect | Check GraphQL URLs in Vercel env vars |
| Build fails | See detailed guides above |

---

## 📚 Detailed Guides

- **Backend**: [RENDER_MANUAL_SETUP.md](./RENDER_MANUAL_SETUP.md)
- **Frontend**: [VERCEL_SETUP.md](./VERCEL_SETUP.md)
- **Complete**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 💡 Pro Tips

**Keep backend awake** (free):
1. Sign up: https://uptimerobot.com
2. Monitor: `https://mobilizer-backend.onrender.com`
3. Interval: 5 minutes

**Free database forever**:
- Switch from Render DB to [Neon.tech](https://neon.tech)
- 10GB free, no expiration

---

## 🎯 What You Get FREE

| Service | What | Limits |
|---------|------|--------|
| **Vercel** | Frontend hosting | 100GB bandwidth/mo |
| **Render** | Backend API | Sleeps after 15min |
| **Render DB** | PostgreSQL | 90 days free |
| **Render Redis** | Caching | 25MB |

**Total**: $0/month forever! 🎉

---

## Need Help?

1. Check the detailed guides above
2. Review deployment logs (Render/Vercel dashboards)
3. Common issues covered in troubleshooting sections

**Still stuck?** Make sure:
- ✅ Code is pushed to GitHub
- ✅ Environment variables are set correctly
- ✅ URLs include `https://` and `/graphql`
- ✅ No trailing slashes in URLs
