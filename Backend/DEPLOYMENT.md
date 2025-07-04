# GymFlow Backend Deployment Guide

## Render Deployment Instructions

### 1. Setup Repository
- Push your code to GitHub/GitLab
- Make sure `.env` file is in `.gitignore` (it is)

### 2. Create Render Service
1. Go to [Render.com](https://render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Select this backend repository

### 3. Configure Render Settings

**Basic Settings:**
- **Name**: `gymflow-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Add these in Render dashboard under "Environment":

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://omshrikhande:Myname0803@cluster0.je7trvw.mongodb.net/viscous?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-strong-jwt-secret-key-here
JWT_EXPIRES_IN=90d
FRONTEND_URL=https://your-frontend-domain.com
FIREBASE_API_KEY=AIzaSyDp44nlOeMDvHowzE0gepOuzck9OCSqEDI
FIREBASE_AUTH_DOMAIN=karmeus-43cbe.firebaseapp.com
FIREBASE_PROJECT_ID=karmeus-43cbe
FIREBASE_STORAGE_BUCKET=karmeus-43cbe.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=596599272256
FIREBASE_APP_ID=1:596599272256:web:5ff93d0bbcce35713040a5
```

### 4. Security Recommendations

**Before Deployment:**
1. **Change JWT_SECRET**: Generate a strong secret key
2. **Update Firebase Config**: Use production Firebase project
3. **Set FRONTEND_URL**: Set to your actual frontend domain
4. **Update MongoDB Password**: Consider using a production-specific password

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Post-Deployment Steps

1. **Test Health Check**: Visit `https://your-app.onrender.com/health`
2. **Test API**: Visit `https://your-app.onrender.com/api`
3. **Check Logs**: Monitor Render logs for any issues
4. **Update Frontend**: Update frontend to use the new backend URL

### 6. Domain Setup (Optional)

If you want a custom domain:
1. Go to your Render service settings
2. Add custom domain
3. Update DNS records as instructed

### 7. Monitoring

**Health Check Endpoint**: `/health`
**API Status**: `/`
**Logs**: Available in Render dashboard

## Important Notes

- Render automatically handles SSL certificates
- Your app will be available at `https://your-app-name.onrender.com`
- Free tier sleeps after 15 minutes of inactivity
- Consider paid tier for production use

## Troubleshooting

**Common Issues:**
1. **Build fails**: Check Node.js version in logs
2. **MongoDB connection**: Verify connection string and IP whitelist
3. **CORS errors**: Update FRONTEND_URL environment variable
4. **App crashes**: Check logs for specific error messages

**Support:**
- Render docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/