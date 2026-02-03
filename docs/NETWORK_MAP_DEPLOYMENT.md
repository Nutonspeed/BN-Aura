# Network Map - Production Deployment Guide

## 📋 Overview

This document provides comprehensive instructions for deploying the Network Map feature to production.

## ✅ Pre-Deployment Checklist

### 1. Code Quality
- [x] All TypeScript errors resolved
- [x] No ESLint warnings
- [x] Performance optimizations applied (useMemo, useCallback)
- [x] Error boundaries implemented
- [x] Loading states handled

### 2. Testing
- [x] E2E tests passing (20+ test cases)
- [x] Component rendering verified
- [x] Real-time updates working
- [x] Export functionality tested
- [x] Mobile responsive verified

### 3. Performance
- [x] Memoized expensive calculations
- [x] Callback functions optimized
- [x] Lazy loading ready
- [x] Bundle size acceptable

### 4. Accessibility
- [x] Keyboard navigation working
- [x] ARIA labels present
- [x] Color contrast adequate
- [x] Screen reader compatible

## 🚀 Deployment Steps

### Step 1: Build Verification

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

### Step 2: Run E2E Tests

```bash
# Start development server
npm run dev

# In another terminal, run Playwright tests
npx playwright test tests/e2e/network-map.spec.ts

# View test report
npx playwright show-report
```

### Step 3: Environment Variables

Ensure these environment variables are set in production:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: WebSocket Configuration
NEXT_PUBLIC_WS_ENDPOINT=wss://your-websocket-server.com
```

### Step 4: Optimize Production Build

Add to `next.config.js`:

```javascript
module.exports = {
  // Enable production optimizations
  swcMinify: true,
  compress: true,
  
  // Image optimization
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Performance monitoring
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}
```

### Step 5: Deploy to Vercel/Netlify

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

#### Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy to production
netlify deploy --prod --dir=.next
```

## 📊 Performance Metrics

### Target Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Monitoring

Use Vercel Analytics or integrate with:
- Google Analytics
- Sentry for error tracking
- LogRocket for session replay

## 🔒 Security Considerations

### 1. API Keys
- Never expose sensitive keys in client-side code
- Use environment variables
- Rotate keys regularly

### 2. Rate Limiting
- Implement rate limiting on API endpoints
- Use Vercel Edge Middleware for protection

### 3. Authentication
- Ensure proper auth checks on network data
- Use Row Level Security (RLS) in Supabase
- Validate user permissions

## 🔄 Real-Time Data Integration

### Supabase Real-Time Setup

```typescript
// Configure Supabase real-time subscriptions
const channel = supabase
  .channel('network-changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'network_nodes' 
    },
    (payload) => {
      // Update nodes state
      handleNodeChange(payload);
    }
  )
  .subscribe();
```

### WebSocket Fallback

```typescript
// Implement WebSocket connection
const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_ENDPOINT);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateNetworkData(data);
};
```

## 📱 Mobile Optimization

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Touch Optimization
- Minimum touch target: 44x44px
- Swipe gestures for node detail panel
- Pull-to-refresh support

## 🎨 Theme Configuration

### Custom Colors

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        network: {
          online: '#10b981',
          warning: '#f59e0b',
          offline: '#ef4444',
          background: '#0f172a',
        }
      }
    }
  }
}
```

## 🧪 Testing Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test network-map.spec.ts

# Debug mode
npx playwright test --debug

# Generate coverage report
npm run test:coverage
```

## 📈 Monitoring & Alerts

### Setup Alerts

1. **Performance Degradation**
   - Alert when LCP > 3s
   - Alert when error rate > 1%

2. **Real-Time Connection**
   - Monitor WebSocket disconnections
   - Alert on connection failures

3. **Export Failures**
   - Track export success rate
   - Monitor download errors

## 🔧 Troubleshooting

### Common Issues

#### 1. Real-Time Updates Not Working
```bash
# Check WebSocket connection
console.log(connectionStatus);

# Verify Supabase URL
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### 2. Performance Issues
```bash
# Analyze bundle size
npx @next/bundle-analyzer

# Check for render loops
npm run dev -- --profile
```

#### 3. Export Not Downloading
```typescript
// Ensure proper blob handling
const blob = new Blob([data], { type: 'text/csv' });
const url = window.URL.createObjectURL(blob);
```

## 📝 Rollback Procedure

If deployment fails:

1. **Immediate Rollback**
   ```bash
   vercel rollback
   ```

2. **Verify Previous Version**
   ```bash
   vercel ls
   vercel inspect <deployment-url>
   ```

3. **Fix and Redeploy**
   - Identify the issue
   - Fix in development
   - Re-run tests
   - Deploy again

## 🎯 Post-Deployment Verification

### Checklist

- [ ] Network Map loads successfully
- [ ] All 8 nodes display correctly
- [ ] Real-time updates working
- [ ] Export functionality works
- [ ] Performance charts render
- [ ] Alert center shows notifications
- [ ] Mobile view responsive
- [ ] No console errors
- [ ] Analytics tracking active

### Smoke Tests

```bash
# Test production URL
curl https://your-domain.com/admin/network-map

# Check API endpoints
curl https://your-domain.com/api/network/nodes

# Verify real-time connection
wscat -c wss://your-domain.com/ws
```

## 📞 Support

For issues or questions:
- GitHub Issues: [repository-url]
- Documentation: [docs-url]
- Support Email: support@your-domain.com

## 🔄 Update Procedure

1. Create feature branch
2. Develop and test locally
3. Run E2E test suite
4. Deploy to staging
5. Verify on staging
6. Deploy to production
7. Monitor for 24 hours

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Real-Time](https://supabase.com/docs/guides/realtime)
- [Recharts Documentation](https://recharts.org)
- [Framer Motion](https://www.framer.com/motion/)
- [Playwright Testing](https://playwright.dev)

---

**Last Updated**: 2026-02-03
**Version**: 1.0.0
**Status**: Production Ready ✅
