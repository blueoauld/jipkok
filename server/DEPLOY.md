# 배포

Cloudflare → Caddy → 서버 → RDS 구조다. Caddy, 서버, Redis 모두 Compose로 띄운다.

## EC2 최초 준비

우분투 기준이다.

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

`usermod` 뒤에는 다시 접속해야 적용된다.

배포 디렉터리를 만들고 `docker-compose.yml`, `Caddyfile`, `.env`를 올린다.

```bash
mkdir -p ~/jipkok/certs
```

## 인증서

Cloudflare 프록시 뒤에서는 Let's Encrypt 자동 발급이 동작하지 않는다. Cloudflare가 TLS를 종료해서 챌린지가 오리진까지 오지 않고, 보안 그룹을 Cloudflare IP로 막으면 검증
서버도 접근하지 못한다. Cloudflare Origin Certificate를 쓴다. 유효기간이 15년이라 갱신이 없다.

Cloudflare 대시보드에서 **SSL/TLS → 원본 서버 → 인증서 만들기**로 발급받아 옮긴다.

```bash
nano ~/jipkok/certs/origin.pem      # 인증서 붙여넣기
nano ~/jipkok/certs/origin-key.pem  # 개인키 붙여넣기
chmod 600 ~/jipkok/certs/origin-key.pem
```

**SSL/TLS 암호화 모드를 `전체(엄격)`으로 바꾼다.** `유연`으로 두면 Cloudflare와 오리진 사이가 평문으로 오간다.

## 보안 그룹

**인바운드 80, 443은 반드시 Cloudflare IP 대역만 허용한다.** 열어두면 오리진에 직접 요청해
`CF-Connecting-IP` 헤더를 위조할 수 있고, 인증번호 발송 IP 제한이 무력화된다.

목록은 https://www.cloudflare.com/ips/ 에 있다.

서버와 Redis는 포트를 열지 않는다. Compose 내부 네트워크로만 통신한다.

## 웹소켓

채팅이 STOMP over WebSocket을 쓴다. Cloudflare 대시보드에서 **네트워크 → WebSockets**가 켜져 있어야 한다. Caddy의 `reverse_proxy`는 업그레이드를 자동으로
처리한다.

## RDS

PostGIS 확장이 필요하다. 최초 1회 실행한다.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

스키마는 Flyway가 기동 시 적용한다.

## CloudWatch 로그

EC2 인스턴스 역할에 아래 권한이 필요하다.

```
logs:CreateLogGroup
logs:CreateLogStream
logs:PutLogEvents
```

로그 그룹은 `/jipkok/server`, `/jipkok/caddy`로 자동 생성된다.

## GitHub Actions 시크릿

| 이름          | 설명                             |
|---------------|----------------------------------|
| `EC2_HOST`    | EC2 공인 IP 또는 도메인          |
| `EC2_USER`    | `ubuntu`                         |
| `EC2_SSH_KEY` | 배포용 개인키                    |
| `GHCR_TOKEN`  | `read:packages` 권한을 가진 토큰 |

## 수동 배포

```bash
cd ~/jipkok
docker compose pull
docker compose up -d
```

## 확인

```bash
docker compose ps
docker compose logs -f server
curl -I https://api.jipkok.app/v3/api-docs
```
