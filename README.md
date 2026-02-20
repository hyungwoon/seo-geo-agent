# seo-geo-agent

아티클 텍스트를 SEO + GEO(Generative Engine Optimization)에 최적화하는 Claude Code 에이전트.

## 사용법

Claude Code에서 `/seo-geo-rewriter` 스킬을 호출하고 아티클을 붙여넣으면 됩니다.

```
/seo-geo-rewriter [키워드(선택)]

[아티클 텍스트 붙여넣기]
```

**출력 결과:**
- 📌 최적화된 제목
- 🔗 Post URL (slug)
- 📝 메타 설명 (120-160자)
- 💬 Excerpt
- 📊 SEO/GEO 스코어 Before → After
- 📄 최적화된 본문 HTML (Schema.org 포함)

## 구조

```
.claude/agents/
└── seo-writer.md          # 분석 + 리라이팅 원패스 에이전트 (sonnet)

~/.claude/skills/seo-geo-rewriter/
├── SKILL.md               # 워크플로우 오케스트레이션
└── rules/
    └── searchlight-strategy.md  # Searchlight 브랜드 전략 규칙

config/
└── searchlight-content-strategy.md  # 전략 원본 (source of truth)

src/                       # CLI 배치 처리 (선택)
├── cli.js
├── analyzer.js
├── rewriter.js
└── reporter.js
```

## CLI (배치 처리)

여러 HTML 파일을 한 번에 처리할 때 사용합니다.

```bash
npm install
node src/cli.js <input.html> [options]

# Options:
# -k, --keyword <keyword>   타겟 키워드
# -o, --output <path>       출력 경로
# --lang ko|en              언어 지정
```

## 테스트

```bash
npm test
npm run test:coverage
```

## 대상

[Searchlight(서치라이트)](https://searchlight.kr) — AI 채용 / 다이렉트 소싱 솔루션의 Ghost B2B 블로그.
