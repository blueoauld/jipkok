<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# @emnapi/core, @emnapi/runtime을 지우지 말 것

코드에서 직접 import하지 않지만 devDependencies에 일부러 선언해둔 것이다. `eslint-config-next`가 `unrs-resolver`를 거쳐 끌고 오는 optional 의존성인데, macOS에서 `npm install`을 하면 npm이 lock에서 쳐내고, Cloudflare Workers Builds는 리눅스에서 `npm ci`를 돌려 lock에 없으면 즉시 실패한다. 직접 의존성으로 선언해두면 lock에서 안 사라진다.
