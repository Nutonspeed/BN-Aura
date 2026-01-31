# BN-Aura Deployment Guide

## 🚀 Production Deployment Checklist

### Prerequisites
- [x] Node.js 22.x LTS
- [x] Next.js 15.1.x
- [x] Supabase Project Setup
- [x] Domain & DNS Configuration
- [x] SSL Certificate

### 1. Environment Variables Setup

#### Required Environment Variables
```bash
# Copy from .env.example and fill in real values
cp .env.example .env.production.local
```

#### Critical Variables (Must be set):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_API_KEY`
- `RESEND_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 2. Database Setup

#### Run Migrations
```bash
# Apply database schema
cd supabase
supabase db push --db-url "postgresql://postgres:[password]@db.royeyoxaaieipdajijni.supabase.co:5432/postgres"
```

#### Required Tables
- [x] `clinic_quotas`
- [x] `ai_usage_logs`
- [x] `staff_invitations`
- [x] `lead_scoring_data`
- [x] `sales_proposals`

### 3. Build Configuration

#### Optimize Build Performance
```bash
# Install dependencies
npm ci --production=false

# Build application
npm run build

# Start production server
npm start
```

#### Build Optimizations
```json
// next.config.js
{
  "experimental": {
    "serverComponentsExternalPackages": ["@google/generative-ai"]
  },
  "images": {
    "domains": ["royeyoxaaieipdajijni.supabase.co"]
  }
}
```

### 4. Vercel Deployment

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 5. Performance Optimization

#### API Rate Limiting
- Implement rate limiting per clinic ID
- Set AI API quotas and monitoring
- Cache frequently accessed data

#### Database Optimization
- Enable RLS policies
- Add proper indexes
- Optimize query performance

### 6. Security Checklist

#### Environment Security
- [x] All secrets in environment variables
- [x] No hardcoded API keys
- [x] Proper CORS configuration
- [x] Secure cookie settings

#### Database Security  
- [x] Row Level Security (RLS) enabled
- [x] Service role key properly secured
- [x] Proper user permissions

### 7. Monitoring Setup

#### Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs
```

#### Performance Monitoring
- Vercel Analytics enabled
- Custom performance metrics
- API response time monitoring

### 8. Post-Deployment Testing

#### Critical Features Test
- [x] User authentication flow
- [x] Clinic staff management
- [x] AI analysis functionality
- [x] Quota system
- [x] Email notifications

#### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

### 9. Domain & SSL Configuration

#### Custom Domain Setup
1. Add domain in Vercel dashboard
2. Configure DNS records
3. Enable SSL certificate
4. Test HTTPS access

### 10. Backup & Recovery

#### Database Backups
- Supabase automatic backups enabled
- Point-in-time recovery configured
- Regular backup testing

#### Code Repository
- GitHub repository with proper branching
- Automated deployment pipelines
- Rollback procedures documented

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variable Issues
```bash
# Check environment variables
npm run env-check

# Validate Supabase connection
npm run db-test
```

#### API Performance Issues
- Check Vercel function logs
- Monitor Supabase performance
- Review API rate limits

### Support Contacts
- Technical Support: dev@bn-aura.com  
- Emergency Contact: +66-xxx-xxx-xxxx

## 📊 Post-Deployment Monitoring

### Key Metrics to Monitor
- API response times
- Database query performance  
- Error rates and types
- User engagement metrics
- System resource usage

### Alert Configuration
- Set up alerts for critical errors
- Monitor quota usage patterns
- Track system performance metrics

---

**Last Updated**: 31 มกราคม 2569
**Version**: 1.0.0
**Deployment Status**: ✅ Production Ready
