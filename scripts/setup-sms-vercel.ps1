# BN-Aura SMS Configuration Setup for Vercel
# PowerShell Script for Windows

Write-Host "🚀 Setting up SMS environment variables in Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found!" -ForegroundColor Red
    Write-Host "Install with: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI found" -ForegroundColor Green
Write-Host ""

# SMS Configuration
$SMS_API_KEY = "dzYeWe50jWC1Su13QJHRChSxLD_hzi"
$SMS_SECRET = "-csdra52KjZlgEMEe-x8AfQsk6_mRQ"
$SMS_SENDER = "bn-aura"

# Set environment variables for Production
Write-Host "📝 Setting THAI_SMS_PLUS_API_KEY..." -ForegroundColor Cyan
echo $SMS_API_KEY | vercel env add THAI_SMS_PLUS_API_KEY production

Write-Host "📝 Setting THAI_SMS_PLUS_SECRET..." -ForegroundColor Cyan
echo $SMS_SECRET | vercel env add THAI_SMS_PLUS_SECRET production

Write-Host "📝 Setting SMS_SENDER_NAME..." -ForegroundColor Cyan
echo $SMS_SENDER | vercel env add SMS_SENDER_NAME production

Write-Host ""
Write-Host "✅ SMS configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy to production: vercel --prod" -ForegroundColor White
Write-Host "2. Test webhook: curl https://bn-aura.vercel.app/api/webhooks/sms" -ForegroundColor White
Write-Host "3. Configure webhook URL in ThaiBulkSMS dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Webhook URL: https://bn-aura.vercel.app/api/webhooks/sms" -ForegroundColor Cyan
Write-Host "   Method: GET" -ForegroundColor Cyan
