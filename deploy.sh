#!/bin/bash

# Cloudflare Worker 자동 배포 스크립트

ACCOUNT_ID="05ba8763e81af620ce77d3bd3d79d84"
WORKER_NAME="fmp-proxy"
API_TOKEN=$CLOUDFLARE_API_TOKEN
WORKER_FILE="worker-fixed.js"

if [ -z "$API_TOKEN" ]; then
    echo "❌ 환경 변수 CLOUDFLARE_API_TOKEN이 설정되지 않았습니다!"
    exit 1
fi

# Worker 코드 읽기
WORKER_CODE=$(cat "$WORKER_FILE")

# JSON 페이로드 생성
PAYLOAD=$(cat <<EOF
{
  "main": $(echo "$WORKER_CODE" | jq -Rs .)
}
EOF
)

# API 요청
URL="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/services/$WORKER_NAME"

echo "📤 Cloudflare에 배포 중..."

RESPONSE=$(curl -s -X PUT "$URL" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    echo "✅ 배포 성공!"
    echo "Worker: $WORKER_NAME"
    echo "상태: $(echo "$RESPONSE" | jq -r '.result.deployment_id')"
else
    echo "❌ 배포 실패!"
    echo "오류: $(echo "$RESPONSE" | jq -r '.errors')"
    exit 1
fi
