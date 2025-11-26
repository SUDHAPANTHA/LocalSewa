# 🚀 Local Sewa App - Deployment Checklist

## Pre-Deployment Checklist

### Backend Preparation
- [ ] All environment variables configured
- [ ] MongoDB connection string updated for production
- [ ] CORS settings configured for production domain
- [ ] File upload limits verified
- [ ] Error logging configured
- [ ] API rate limiting implemented (if needed)
- [ ] Security headers configured
- [ ] SSL certificates ready

### Frontend Preparation
- [ ] API URL updated to production backend
- [ ] Build command tested: `npm run build`
- [ ] Build output verified in `dist` folder
- [ ] Environment variables configured
- [ ] Error boundaries implemented
- [ ] Analytics configured (if needed)
- [ ] SEO meta tags added

### Database Preparation
- [ ] MongoDB Atlas account created (or production DB ready)
- [ ] Database indexes created
- [ ] Backup strategy configured
- [ ] Connection pooling configured
- [ ] Database monitoring setup

### Testing
- [ ] All user flows tested
- [ ] All vendor flows tested
- [ ] All admin flows tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed
- [ ] Performance testing done
- [ ] Security testing completed

## Deployment Steps

### 1. Backend Deployment (Example: Heroku)

```bash
# Login to Heroku
heroku login

# Create new app
heroku create localsewa-backend

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set PORT=5000
heroku config:set CORE_PROVIDER_EMAIL=system@sajilosewa.com
heroku config:set CORE_PROVIDER_PASSWORD=your_secure_password

# Deploy
git subtree push --prefix backend heroku main

# Check logs
heroku logs --tail
```

### 2. Frontend Deployment (Example: Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project folder
cd project

# Build the project
npm run build

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-backend-url.herokuapp.com
```

### 3. Database Setup (MongoDB Atlas)

```bash
# 1. Create MongoDB Atlas account
# 2. Create new cluster
# 3. Create database user
# 4. Whitelist IP addresses (0.0.0.0/0 for all)
# 5. Get connection string
# 6. Update backend .env with connection string
```

## Post-Deployment Checklist

### Verification
- [ ] Backend API accessible at production URL
- [ ] Frontend accessible at production URL
- [ ] Database connection working
- [ ] User registration working
- [ ] User login working
- [ ] Service browsing working
- [ ] Service booking working
- [ ] Admin dashboard accessible
- [ ] Vendor dashboard accessible
- [ ] File uploads working
- [ ] Chatbot working
- [ ] Location map working

### Monitoring
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Performance monitoring setup
- [ ] Uptime monitoring configured
- [ ] Database monitoring active
- [ ] Log aggregation setup

### Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] File upload restrictions enforced

### Documentation
- [ ] API documentation published
- [ ] User guide created
- [ ] Admin guide created
- [ ] Vendor guide created
- [ ] Support contact information added

## Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/localsewa

# Core Provider
CORE_PROVIDER_EMAIL=system@sajilosewa.com
CORE_PROVIDER_PASSWORD=SecurePassword123!
CORE_PROVIDER_PHONE=9800000000
CORE_PROVIDER_ADDRESS=Kathmandu Valley

# Security (if using JWT)
JWT_SECRET=your_jwt_secret_key_here

# File Upload
MAX_FILE_SIZE=8388608

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.herokuapp.com
```

## Deployment Platforms

### Backend Options:
1. **Heroku** (Easy, free tier available)
   - Pros: Simple deployment, free tier
   - Cons: Sleeps after 30 min inactivity on free tier

2. **AWS EC2** (Full control)
   - Pros: Full control, scalable
   - Cons: More complex setup

3. **DigitalOcean** (Good balance)
   - Pros: Simple, affordable
   - Cons: Requires some server management

4. **Railway** (Modern alternative)
   - Pros: Easy deployment, good free tier
   - Cons: Newer platform

### Frontend Options:
1. **Vercel** (Recommended for React)
   - Pros: Optimized for React, free tier, automatic deployments
   - Cons: None significant

2. **Netlify** (Alternative)
   - Pros: Easy deployment, free tier
   - Cons: Similar to Vercel

3. **AWS S3 + CloudFront** (Enterprise)
   - Pros: Highly scalable, CDN included
   - Cons: More complex setup

### Database Options:
1. **MongoDB Atlas** (Recommended)
   - Pros: Managed service, free tier, automatic backups
   - Cons: None significant

2. **Self-hosted MongoDB**
   - Pros: Full control
   - Cons: Requires management, backups

## Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "localsewa-backend"
          heroku_email: "your-email@example.com"
          appdir: "backend"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          working-directory: ./project
```

## Monitoring & Maintenance

### Daily Tasks:
- [ ] Check error logs
- [ ] Monitor server uptime
- [ ] Review user feedback

### Weekly Tasks:
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Review security logs
- [ ] Update dependencies (if needed)

### Monthly Tasks:
- [ ] Database backup verification
- [ ] Security audit
- [ ] Performance optimization
- [ ] User analytics review

## Rollback Plan

### If Deployment Fails:

1. **Backend Rollback:**
```bash
# Heroku
heroku rollback

# Manual
git revert HEAD
git push heroku main
```

2. **Frontend Rollback:**
```bash
# Vercel
vercel rollback

# Manual
# Redeploy previous version
```

3. **Database Rollback:**
```bash
# Restore from backup
mongorestore --uri="mongodb+srv://..." --archive=backup.archive
```

## Support Contacts

### Technical Issues:
- Backend: [Your Email]
- Frontend: [Your Email]
- Database: [Your Email]

### Service Providers:
- Hosting: [Provider Support]
- Database: [MongoDB Support]
- Domain: [Domain Provider]

## Success Criteria

Deployment is successful when:
- [ ] All services are accessible
- [ ] All features are working
- [ ] No critical errors in logs
- [ ] Performance is acceptable
- [ ] Security checks pass
- [ ] Monitoring is active

## Emergency Procedures

### If Site Goes Down:
1. Check server status
2. Check database connection
3. Review recent deployments
4. Check error logs
5. Rollback if necessary
6. Contact hosting support

### If Database Issues:
1. Check connection string
2. Verify database is running
3. Check disk space
4. Review recent queries
5. Restore from backup if needed

### If Security Breach:
1. Immediately change all passwords
2. Review access logs
3. Patch vulnerability
4. Notify affected users
5. Document incident

## Post-Launch Tasks

### Week 1:
- [ ] Monitor closely for errors
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Optimize performance

### Month 1:
- [ ] Analyze usage patterns
- [ ] Implement user feedback
- [ ] Optimize database queries
- [ ] Plan feature updates

### Ongoing:
- [ ] Regular security updates
- [ ] Performance monitoring
- [ ] User support
- [ ] Feature development

---

## 🎉 Ready to Deploy!

Follow this checklist step by step to ensure a smooth deployment.

**Good luck with your launch! 🚀**
