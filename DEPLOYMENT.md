# 배포 정보 및 주의사항

## Cloudflare Workers URL
```
https://fmp-proxy.aiinvestflow.workers.dev
```

---

## 배포 전 체크리스트 ⚠️

### 1. **wrangler.toml 확인**
- `main` 필드가 수정한 파일명과 일치하는지 확인
- 예: `worker.js` 수정했으면 `main = "worker.js"`로 설정

### 2. **변경사항 커밋**
```bash
git add .
git commit -m "파일명: 설명"
```

### 3. **배포 방법**

#### 방법1: wrangler CLI (권장)
```bash
wrangler deploy
```

#### 방법2: Cloudflare 대시보드 수동 배포
- Cloudflare Workers 대시보드 접속
- worker.js 전체 코드 복사
- 에디터에 붙여넣기
- 배포 버튼 클릭

### 4. **배포 후 테스트**
```bash
curl https://fmp-proxy.aiinvestflow.workers.dev/market
curl https://fmp-proxy.aiinvestflow.workers.dev/stock
```

---

## 자주 발생하는 오류

| 오류 | 원인 | 해결방법 |
|------|------|--------|
| 404 Not Found | 잘못된 엔드포인트 | URL 경로 확인 |
| 502 Bad Gateway | 코드 배포 안됨 | wrangler.toml의 main 필드 확인 후 배포 |
| 데이터 안 보임 | API 응답 형식 오류 | worker.js 수정 사항 재확인 |

---

## 최근 수정 기록

**2026-03-09**
- wrangler.toml main 필드: worker-fixed.js → worker.js 변경
- /market, /stock 엔드포인트 데이터 단위 수정 (USD → M USD 등)
- NOTES.md 생성

