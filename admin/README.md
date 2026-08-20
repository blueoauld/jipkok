# admin

집콕 운영 어드민.

```bash
npm run dev
```

프로덕션 API 주소는 `.env.production`에 있고 빌드 시점에 박힌다. 배포는 main에 푸시하면 Cloudflare Workers Builds가 `admin/` 변경을 감지해 자동으로 한다. 수동 배포가 필요하면 아래를 쓴다.

```bash
npm run deploy
```
