# Cloudflare Worker 자동 배포 스크립트

$ACCOUNT_ID = "05ba8763e81af620ce77d3bd3d79d84"
$WORKER_NAME = "fmp-proxy"
$API_TOKEN = $env:CLOUDFLARE_API_TOKEN
$WORKER_FILE = "worker-fixed.js"

if (-not $API_TOKEN) {
    Write-Host "❌ 환경 변수 CLOUDFLARE_API_TOKEN이 설정되지 않았습니다!" -ForegroundColor Red
    exit 1
}

# Worker 코드 읽기
$WORKER_CODE = Get-Content $WORKER_FILE -Raw

# JSON 페이로드 생성
$payload = @{
    main = $WORKER_CODE
} | ConvertTo-Json

# API 요청
$url = "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/services/$WORKER_NAME"

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "📤 Cloudflare에 배포 중..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $url `
        -Method Put `
        -Headers $headers `
        -Body $payload `
        -ErrorAction Stop

    $result = $response.Content | ConvertFrom-Json

    if ($result.success) {
        Write-Host "✅ 배포 성공!" -ForegroundColor Green
        Write-Host "Worker: $WORKER_NAME"
        Write-Host "상태: $($result.result.deployment_id)"
    } else {
        Write-Host "❌ 배포 실패!" -ForegroundColor Red
        Write-Host "오류: $($result.errors)"
    }
} catch {
    Write-Host "❌ 요청 실패!" -ForegroundColor Red
    Write-Host "오류: $_"
    exit 1
}
