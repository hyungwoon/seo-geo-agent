# SEO/GEO Content Optimizer

Searchlight 블로그 콘텐츠를 SEO + GEO(Generative Engine Optimization) 최적화하고 Ghost CMS로 내보내는 도구입니다.

---

## 빠른 시작 — 세 가지 사용 방법

| 방법 | 대상 | 난이도 |
|------|------|--------|
| 1. Claude Code 스킬 (`/seo-geo-rewriter`) | 마케터·콘텐츠팀 | ⭐ 가장 쉬움 |
| 2. 웹 어드민 | 내부 직원 | ⭐⭐ 쉬움 |
| 3. CLI | 개발자·자동화 | ⭐⭐⭐ 전문가용 |

---

## 1. Claude Code 스킬 — `/seo-geo-rewriter` (가장 쉬운 방법)

Claude Code 채팅창에서 글을 붙여넣으면 바로 SEO/GEO 최적화 결과를 받을 수 있습니다.

### 설치 (최초 1회)

터미널에서 아래 명령어를 한 번 실행하세요:

```bash
# 1. 레포 클론
git clone https://github.com/hyungwoon/seo-geo-agent.git ~/seo-geo-agent

# 2. 스킬 설치
ln -s ~/seo-geo-agent/skills/seo-geo-rewriter ~/.claude/skills/seo-geo-rewriter
```

> 설치 확인: `ls ~/.claude/skills/seo-geo-rewriter` 실행 시 `SKILL.md`가 보이면 성공.

### 사용법

1. Claude Code를 열고 `/seo-geo-rewriter`를 입력합니다.
2. 최적화할 글(HTML 또는 텍스트)을 붙여넣습니다.
3. 원하면 타겟 키워드도 함께 알려줍니다.
4. Claude가 분석 후 바로 결과물을 출력합니다.

**예시 1 — 기본 사용**
```
/seo-geo-rewriter

아래 글을 SEO/GEO 최적화해줘.

[글 내용 붙여넣기]
```

**예시 2 — 키워드 지정**
```
/seo-geo-rewriter

Primary: 다이렉트 소싱
Secondary: AI 채용, 헤드헌팅

아래 글을 최적화해줘.
[글 내용 붙여넣기]
```

**출력 결과 (순서 고정)**
```
📌 제목
🔗 slug
📝 메타 설명
💬 Excerpt
📊 Before → After 점수
📄 최적화 본문 (HTML)
```

### 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `unknown-skill` | 스킬이 설치되지 않음 | 위 설치 명령어 실행 |
| 스킬이 반응 없음 | Claude Code 재시작 필요 | Claude Code 종료 후 재실행 |

---

## 2. 웹 어드민 (권장 — 내부 직원용)

Next.js 기반 웹 인터페이스로 시각적으로 사용할 수 있습니다.

### 실행

```bash
cd web
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### 주요 기능

- **Single Analysis**: HTML/URL 하나씩 분석 및 최적화
- **Batch Processing**: 여러 콘텐츠 일괄 처리 + Ghost JSON export
- 실시간 점수 확인 (SEO / GEO / Readability / Overall)
- 이슈 목록 및 개선 권장사항
- 4개 파일 생성: optimized HTML, meta-pack.json, distribution-pack.md, seo-report.md
- Ghost CMS 직접 import 가능한 JSON 생성

### 웹 어드민 사용법

**단일 글 분석**
1. `http://localhost:3000` 접속
2. Single Analysis 클릭
3. URL 입력 후 Fetch (또는 HTML 직접 붙여넣기)
4. Keywords 입력 (선택)
5. Analyze & Optimize 클릭
6. 결과 확인 및 파일 다운로드

**일괄 처리**
1. Batch Processing 클릭
2. URL을 한 줄에 하나씩 입력 (또는 HTML blocks)
3. Process All 클릭
4. Ghost JSON Export 다운로드
5. Ghost Admin에서 JSON import

**상세 가이드:** [web/README.md](web/README.md) | [web/USAGE-GUIDE.md](web/USAGE-GUIDE.md)

---

## 3. CLI (개발자·자동화용)

Node.js 커맨드라인 도구로 자동화 파이프라인에 적합합니다.

```bash
npm install
node src/cli.js input.html -k "AI 채용,다이렉트 소싱" -o output.html
```

**주요 옵션**

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-k, --keyword` | 타겟 키워드 (쉼표 구분) | 자동 추출 |
| `-o, --output` | 출력 파일 경로 | `*.optimized.html` |
| `-r, --report` | 리포트 파일 경로 | `*.seo-report.md` |
| `--lang` | 언어 (`ko`/`en`) | 자동 감지 |
| `--no-schema` | Schema.org JSON-LD 제외 | 포함 |

**여러 파일 일괄 처리**
```bash
for file in input/*.html; do
  node src/cli.js "$file" -k "AI 채용" -o "output/$(basename $file)"
done
```

---

## 출력 파일 설명

최적화 완료 시 4개 파일이 생성됩니다:

| 파일 | 용도 |
|------|------|
| `optimized.html` | Ghost CMS 업로드용 최적화 HTML |
| `meta-pack.json` | Ghost 메타데이터 (slug, canonical, keywords 등) |
| `distribution-pack.md` | 네이버 블로그 / InBlog 재배포용 마크다운 |
| `seo-report.md` | 점수, 이슈, 개선 권장사항 리포트 |

---

## 점수 해석

| 카테고리 | 우수 | 양호 | 개선 필요 | 낙제 |
|---------|------|------|----------|------|
| SEO | 80+ | 60-79 | 40-59 | <40 |
| GEO | — | 60+ | 40-59 | <40 |
| Readability | 75+ | 60-74 | 40-59 | <40 |
| Overall | 75+ | 60-74 | 40-59 | <40 |

**Overall Score 계산식**
```
Overall = (SEO × 0.4) + (GEO × 0.35) + (Readability × 0.25)
```

---

## 핵심 기능 소개

### SEO 최적화
- 메타 태그 자동 생성 (title, description, OG tags)
- 키워드 밀도 분석 및 최적 배치 (목표: 1~2%)
- 헤딩 구조 정규화 (H1 단일화, 계층 구조 수정)
- 이미지 alt 속성 자동 추가
- 내부/외부 링크 분석

### GEO (Generative Engine Optimization)
AI 검색엔진(ChatGPT, Perplexity, Gemini 등)에서 인용되기 쉬운 구조로 최적화합니다.

- **Citability blocks**: AI가 인용하기 좋은 134-167단어 자기완결 블록
- **Question headings**: "무엇인가?" 형식의 질문형 제목
- **Direct answer patterns**: 핵심 답변을 첫 40-60단어에 배치
- **Definition patterns**: 명확한 정의문 구조

### Searchlight 전용 기능
- **Slug 자동 생성**: 주요 키워드 기반 3-5단어 영문 소문자 (예: `direct-sourcing`)
- **타겟 감지**: 기업(enterprise) vs 구직자(job seeker) 자동 분류
- **브랜드 안전성**: "서치라이트" 단독 사용 금지, 반드시 맥락과 함께
- **CTA 자동 삽입**: 모든 글의 마지막에 서치라이트 CTA
- **통계 정확성**: 출처·연도 없는 통계 생성 금지

---

## 프로젝트 구조

```
seo-geo-agent/
├── skills/
│   └── seo-geo-rewriter/
│       └── SKILL.md           # Claude Code 스킬 정의
├── src/                       # 코어 로직 (CLI + 웹 어드민 공통)
│   ├── cli.js                 # CLI 엔트리포인트
│   ├── analyzer.js            # HTML 분석 엔진
│   ├── rewriter.js            # HTML 재작성 엔진
│   └── reporter.js            # 리포트 생성
├── web/                       # 웹 어드민 (Next.js)
│   ├── app/                   # 페이지 및 API 라우트
│   ├── components/            # React 컴포넌트
│   ├── lib/                   # 웹 전용 유틸리티
│   ├── README.md
│   └── USAGE-GUIDE.md
├── .claude/
│   └── agents/
│       └── seo-writer.md      # SEO 리라이팅 서브에이전트
├── config/
│   └── searchlight-content-strategy.md   # Searchlight 콘텐츠 전략 규칙
├── tests/                     # 테스트 파일
├── examples/                  # 예제 HTML
├── CLAUDE.md                  # 프로젝트 가이드 (Claude Code용)
└── package.json
```

---

## 기술 스택

- **Runtime**: Node.js 20+ (ES Modules)
- **Core Logic**: `node-html-parser` (HTML 파싱/조작)
- **Testing**: Node.js built-in test runner (`node:test`)
- **Web Admin**: Next.js + React + Tailwind CSS + TypeScript

---

## 테스트

```bash
# 모든 테스트 실행
npm test

# 커버리지 포함
npm run test:coverage

# 단일 테스트 파일
node --test tests/analyzer.test.js
```

---

## 주의사항

- **내부 직원 전용**: 외부 공개 금지
- **Searchlight 블로그 전용**: Ghost CMS 마이그레이션 최적화
- **브랜드 안전성**: "서치라이트" 반드시 맥락과 함께 사용
- **통계 정확성**: 출처 + 연도 없는 통계 생성 금지
- **HowTo schema**: 2023년 9월 deprecated, 사용 금지
- **FAQPage schema**: 정부/의료 사이트만 사용 권장

---

## 문서

- [CLAUDE.md](CLAUDE.md) — 프로젝트 전체 가이드 (아키텍처, 기술 상세)
- [config/searchlight-content-strategy.md](config/searchlight-content-strategy.md) — Searchlight 콘텐츠 전략 규칙
- [web/README.md](web/README.md) — 웹 어드민 README
- [web/USAGE-GUIDE.md](web/USAGE-GUIDE.md) — 시나리오별 사용 가이드

---

## 문의

문제 발생 시 프로젝트 관리자에게 문의하세요.
