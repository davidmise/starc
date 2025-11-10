# Star Corporate - Create Test Users Script
# Run this after starting the backend server

Write-Host "🧪 Creating test users for Star Corporate..." -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Yellow

# Test user data
$testUsers = @(
    @{
        username = "testuser1"
        email = "testuser1@example.com" 
        password = "password123"
        fullName = "Test User One"
    },
    @{
        username = "testuser2"
        email = "testuser2@example.com"
        password = "password123"
        fullName = "Test User Two"
    },
    @{
        username = "admin"
        email = "admin@example.com"
        password = "admin123"
        fullName = "Admin User"
    }
)

$baseUrl = "http://localhost:5000/api"

foreach ($user in $testUsers) {
    Write-Host "`n📝 Creating user: $($user.username)" -ForegroundColor Green
    
    $body = @{
        username = $user.username
        email = $user.email
        password = $user.password
        fullName = $user.fullName
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ User created: $($user.username)" -ForegroundColor Green
        Write-Host "📧 Email: $($user.email)" -ForegroundColor White
        Write-Host "🔑 Password: $($user.password)" -ForegroundColor White
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "⚠️  User $($user.username) already exists - skipping" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ Error creating $($user.username): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n🎉 Test users setup complete!" -ForegroundColor Green
Write-Host "`n📋 LOGIN CREDENTIALS:" -ForegroundColor Cyan
foreach ($user in $testUsers) {
    Write-Host "👤 $($user.username): $($user.email) / $($user.password)" -ForegroundColor White
}

Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:8081 in your browser" -ForegroundColor White
Write-Host "2. Login with any of the above credentials" -ForegroundColor White
Write-Host "3. Try creating a post/session" -ForegroundColor White
Write-Host "4. Test all the features!" -ForegroundColor White