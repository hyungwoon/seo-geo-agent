# SEO/GEO Rewriter Skill + Sub-agent 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 사용자가 아티클 텍스트를 붙여넣으면 `/seo-geo-rewriter`로 SEO/GEO 최적화 결과를 채팅에 직접 출력하는 skill + sub-agent 구조 구축

**Architecture:** 사용자 레벨 Skill(`~/.claude/skills/seo-geo-rewriter/`)이 워크플로우를 오케스트레이션하고, 프로젝트 레벨 Sub-agent 2개(`seo-analyzer`, `seo-writer`)가 각각 분석과 리라이팅을 담당. Searchlight 전략 규칙 요약본은 Skill 디렉토리에 복사 보관.

**Tech Stack:** Claude Code Skills, Sub-agents (YAML+Markdown), Bash (mkdir, cp)

---

## Task 1: 디렉토리 구조 생성

**Files:**
- Create: `~/.claude/skills/seo-geo-rewriter/rules/` (디렉토리)
- Create: `.claude/agents/` (디렉토리, 프로젝트 루트)

**Step 1: 디렉토리 생성**

```bash
mkdir -p ~/.claude/skills/seo-geo-rewriter/rules
mkdir -p /Users/hyungwoonlee/Documents/AI/seo-geo-agent/.claude/agents
```

**Step 2: 생성 확인**

```bash
ls ~/.claude/skills/seo-geo-rewriter/
ls /Users/hyungwoonlee/Documents/AI/seo-geo-agent/.claude/
```

Expected: `rules/` 디렉토리와 `agents/` 디렉토리가 보임

---

## Task 2: Searchlight 전략 규칙 요약본 생성

**Files:**
- Create: `~/.claude/skills/seo-geo-rewriter/rules/searchlight-strategy.md`

Skill이 어느 디렉토리에서 호출되더라도 규칙에 접근할 수 있도록, 핵심 규칙을 Skill 디렉토리 안에 복사 보관한다.

**Step 1: 규칙 요약본 파일 생성**

`~/.claude/skills/seo-geo-rewriter/rules/searchlight-strategy.md` 내용:

```markdown
# Searchlight 콘텐츠 전략 핵심 규칙

## 제품 컨텍스트
- 제품: Searchlight(서치라이트) — AI 채용 / 다이렉트 소싱 솔루션
- 플랫폼: Ghost CMS B2B 블로그
- 기본 타겟: 기업(B2B). 연봉/포트폴리오/자기소개서/취업 전략 내용이면 구직자로 전환

## Slug 규칙
- Primary 키워드 기반, 영문 소문자 + 하이픈
- 3-5단어, 최대 60자, 관사/전치사 제거
- 예: 다이렉트 소싱 → direct-sourcing / AI 채용 솔루션 → ai-recruiting-solution

## 키워드 배치 (필수)
- Title: 1회
- H1: 2회
- 첫 100단어: 1회
- H2 최소 1개: 1회

## H1 / 메타 규칙
- H1: 28자 권장, 최대 35자
- 메타 설명: 120-160자

## 콘텐츠 구조 (필수 순서)
1. 후킹 도입부 (문제 제시 또는 통념 반박, 4-6문장)
2. 문제 요약
3. Primary 키워드 중심 핵심 설명
4. 기업 타겟일 경우: 외부 데이터 기반 인재 발굴, 롱리스트→숏리스트 압축, 어프로치 개인화
5. Searchlight CTA (필수 마무리)

## 브랜드 안전 규칙
"서치라이트" 사용 시 반드시 아래 중 1개 이상 함께 표기:
- AI 채용, 다이렉트 소싱, 숏리스트, 어프로치, 채용 솔루션
NEVER: "서치라이트란?" 단독 정의 금지

## CTA 구조 (마지막 섹션 필수)
패턴: 문제 요약 → 솔루션 연결 → 행동 유도
예: "숏리스트를 빠르게 받아보고 싶다면, 서치라이트 AI 채용 솔루션으로 시작해보세요."

## 통계/수치 원칙
- 외부 인용 허용 (출처명 + 연도 필수)
- 수치 조작/날조 절대 금지
- 근거 없으면 숫자 없이 설명

## 분량 기준
- 총 2,500-4,500자
- 각 H2 섹션: 700-1,200자
- 단락: 2-4문장
- 리스트: 섹션당 3-5개 항목

## GEO 최적화 (AI 검색 인용용)
- Citability 블록: 134-167단어의 자기완결 단락 3개 이상
- 질문형 헤딩: "X란 무엇인가?", "어떻게 X하는가?" 형식
- 정의 패턴: "X는 ... 입니다" / "X란 ... 를 의미합니다"
- 통계/출처 인용 2개 이상
- 리스트(ul/ol) 필수
```

**Step 2: 파일 확인**

```bash
wc -l ~/.claude/skills/seo-geo-rewriter/rules/searchlight-strategy.md
```

Expected: 60줄 이상

---

## Task 3: seo-analyzer sub-agent 생성

**Files:**
- Create: `.claude/agents/seo-analyzer.md`

분석 전용 sub-agent. haiku 모델로 빠르게 점수와 이슈 목록을 계산한다.

**Step 1: seo-analyzer.md 생성**

`.claude/agents/seo-analyzer.md` 내용:

```markdown
---
name: seo-analyzer
description: SEO/GEO 분석 전문가. 아티클 텍스트의 SEO 점수, GEO citability, 개선 이슈를 분석하고 구조화된 결과를 반환합니다. seo-geo-rewriter skill에서 사용.
model: haiku
tools: Read
user-invocable: false
---

당신은 SEO/GEO 분석 전문가입니다. 아티클 텍스트를 받아 다음 항목을 분석하고 구조화된 마크다운으로 반환합니다.

## 분석 항목

### 1. 기본 메타 분석
- Title 존재 여부, 길이 (50-60자 권장)
- 메타 설명 존재 여부, 길이 (120-160자 권장)
- H1 개수 (1개만 권장), 길이 (28자 권장, 35자 최대)
- Canonical URL 존재 여부
- OG 태그 존재 여부

### 2. 키워드 분석
- Primary 키워드 배치 확인: Title(1회), H1(2회), 첫 100단어(1회), H2(1회)
- 키워드 밀도 (0.5-3% 권장)

### 3. 콘텐츠 분석
- 총 글자 수 (2,500-4,500자 권장)
- 헤딩 계층 구조 확인
- 단락 길이 (2-4문장 권장)
- 리스트/테이블 존재 여부

### 4. GEO 분석
- Citability 블록 수 (134-167단어 자기완결 단락, 3개 이상 권장)
- 질문형 헤딩 수
- 정의 패턴 수 ("X는 ... 입니다")
- 통계/출처 인용 수

### 5. Searchlight 브랜드 규칙 체크
- "서치라이트" 단독 사용 여부 (브랜드 컨텍스트 없이 사용 시 HIGH 이슈)
- 마지막 단락 CTA 존재 여부
- 타겟 타입 판단 (기업/구직자)

## 출력 형식

다음 마크다운 형식으로 반환합니다:

```
## 분석 결과

**Primary 키워드:** [추출된 키워드]
**타겟 타입:** 기업 | 구직자

### SEO 점수: XX/100
| 항목 | 상태 | 비고 |
|------|------|------|
| Title | ✅/❌ | [내용] |
| 메타 설명 | ✅/❌ | [내용] |
| H1 | ✅/❌ | [내용] |
| 키워드 배치 | ✅/❌ | [내용] |
| 스키마 | ✅/❌ | [내용] |

### GEO 점수: XX/100
| 항목 | 현재 | 권장 |
|------|------|------|
| Citability 블록 | X개 | 3개 이상 |
| 질문형 헤딩 | X개 | 1개 이상 |
| 정의 패턴 | X개 | 1개 이상 |
| 통계 인용 | X개 | 2개 이상 |
| 리스트 | ✅/❌ | 필수 |

### 이슈 목록
#### 🔴 Critical (즉시 수정)
- [이슈 설명]

#### 🟠 High (반드시 수정)
- [이슈 설명]

#### 🟡 Medium (권장 수정)
- [이슈 설명]

### 개선 우선순위 Top 3
1. [가장 중요한 개선사항]
2. [두 번째]
3. [세 번째]
```
```

**Step 2: 파일 확인**

```bash
ls /Users/hyungwoonlee/Documents/AI/seo-geo-agent/.claude/agents/
```

Expected: `seo-analyzer.md` 파일 보임

---

## Task 4: seo-writer sub-agent 생성

**Files:**
- Create: `.claude/agents/seo-writer.md`

리라이팅 전용 sub-agent. sonnet 모델로 분석 결과를 바탕으로 완전 최적화된 결과물 5개를 생성한다.

**Step 1: seo-writer.md 생성**

`.claude/agents/seo-writer.md` 내용:

```markdown
---
name: seo-writer
description: SEO/GEO 리라이팅 전문가. 분석 결과를 바탕으로 아티클을 완전 최적화합니다. 제목, slug, 메타 설명, Excerpt, 본문 HTML을 반환합니다. seo-geo-rewriter skill에서 사용.
model: sonnet
user-invocable: false
---

당신은 Searchlight(서치라이트) AI 채용 솔루션의 Ghost B2B 블로그 콘텐츠 최적화 전문가입니다.

## 핵심 역할

원본 아티클 텍스트 + SEO/GEO 분석 결과를 받아, 완전히 최적화된 결과물 5개를 생성합니다.

## Searchlight 콘텐츠 전략

### 브랜드 규칙
- "서치라이트" 사용 시 AI 채용/다이렉트 소싱/숏리스트/어프로치/채용 솔루션 중 1개 이상 동반
- "서치라이트란?" 단독 정의 절대 금지
- 모든 아티클 마지막에 Searchlight CTA 필수

### 키워드 배치 (필수)
- Title: 1회, H1: 2회, 첫 100단어: 1회, H2 최소 1개: 1회

### 콘텐츠 구조
1. 후킹 도입부 (문제 제시 또는 통념 반박, 4-6문장)
2. 문제 요약
3. Primary 키워드 중심 핵심 설명
4. 세부 섹션 (H2 기반, 각 700-1,200자)
5. Searchlight CTA (마지막 필수)

### GEO 최적화
- Citability 블록 3개 이상 (각 134-167단어, 자기완결)
- 질문형 H2 최소 1개 ("X란 무엇인가?", "어떻게 X하는가?")
- 정의 패턴 포함 ("X는 ... 입니다")
- 통계 인용 시 출처명 + 연도 필수, 없으면 숫자 사용 금지

### 분량
- 총 2,500-4,500자
- H1: 28자 권장, 최대 35자
- 메타 설명: 120-160자
- Excerpt: 2-3문장 (핵심 가치 + 호기심 유발)

### Slug 규칙
- Primary 키워드 기반, 영문 소문자 + 하이픈
- 3-5단어, 최대 60자
- 예: 다이렉트 소싱 → direct-sourcing

## 출력 형식 (반드시 이 순서로)

```
📌 **제목 (Title)**
[최적화된 제목, H1에 Primary 키워드 2회 포함]

🔗 **Post URL (slug)**
`[english-slug]`

📝 **메타 설명** (120-160자)
[메타 설명 텍스트]

💬 **Excerpt**
[2-3문장 발췌]

📄 **최적화된 본문**
[전체 HTML 본문]
```

HTML 본문은 다음을 포함합니다:
- `<h1>`, `<h2>`, `<h3>` 태그 (계층 구조 준수)
- `<p>` 태그로 단락 구분
- `<ul>` 또는 `<ol>` 리스트 최소 1개
- 마지막에 Searchlight CTA 단락
- JSON-LD Schema (Article 타입) 포함
```

**Step 2: 파일 확인**

```bash
ls /Users/hyungwoonlee/Documents/AI/seo-geo-agent/.claude/agents/
```

Expected: `seo-analyzer.md`, `seo-writer.md` 두 파일 보임

---

## Task 5: SKILL.md 생성 (오케스트레이터)

**Files:**
- Create: `~/.claude/skills/seo-geo-rewriter/SKILL.md`

사용자 레벨 Skill. `/seo-geo-rewriter` 호출 시 seo-analyzer → seo-writer 순서로 sub-agent를 실행하는 워크플로우를 Claude에게 지시한다.

**Step 1: SKILL.md 생성**

`~/.claude/skills/seo-geo-rewriter/SKILL.md` 내용:

```markdown
---
name: seo-geo-rewriter
description: 아티클 텍스트(플레인 텍스트/HTML)를 SEO + GEO(Generative Engine Optimization) 최적화. 제목, Post URL(slug), 메타 설명, Excerpt, 최적화 본문을 출력합니다. 트리거: "SEO 리라이팅", "GEO 최적화", "콘텐츠 최적화", "리라이팅", "seo rewrite", "optimize", "최적화해줘".
allowed-tools: Read, Bash, Task
---

# SEO/GEO 아티클 최적화 워크플로우

## Searchlight 전략 규칙

!`cat ~/.claude/skills/seo-geo-rewriter/rules/searchlight-strategy.md`

---

## 실행 순서

### Step 1: 입력 파악

아티클과 키워드를 확인합니다:

- **아티클**: 사용자가 붙여넣은 텍스트 전체
- **Primary 키워드**: $ARGUMENTS에서 추출 (없으면 아티클 제목/H1에서 자동 추출)

키워드가 없으면 아티클에서 가장 중요한 핵심 명사구를 1개 자동 선택합니다.

### Step 2: seo-analyzer sub-agent 실행

Task 도구를 사용하여 `seo-analyzer` sub-agent를 실행합니다.

프롬프트 템플릿:
```
다음 아티클을 SEO/GEO 분석해주세요.

**Primary 키워드:** [키워드]

**원본 아티클:**
[전체 아티클 텍스트]
```

분석 결과가 반환될 때까지 기다립니다.

### Step 3: seo-writer sub-agent 실행

Task 도구를 사용하여 `seo-writer` sub-agent를 실행합니다.

프롬프트 템플릿:
```
다음 아티클을 SEO/GEO 최적화하여 결과물 5개를 생성해주세요.

**Primary 키워드:** [키워드]

**분석 결과:**
[seo-analyzer 결과 전체]

**원본 아티클:**
[전체 아티클 텍스트]
```

### Step 4: 결과물 출력

seo-writer의 결과를 그대로 채팅에 출력합니다.

상단에 간략한 스코어 요약을 추가합니다:

```
## 📊 최적화 완료

| 항목 | Before | After (예상) |
|------|--------|-------------|
| SEO  | XX/100 | ~XX/100     |
| GEO  | XX/100 | ~XX/100     |

---
[seo-writer 전체 결과]
```
```

**Step 2: SKILL.md 확인**

```bash
ls ~/.claude/skills/seo-geo-rewriter/
cat ~/.claude/skills/seo-geo-rewriter/SKILL.md | head -20
```

Expected: SKILL.md와 rules/ 디렉토리가 보임, frontmatter 시작 부분 출력

---

## Task 6: CLAUDE.md 업데이트

**Files:**
- Modify: `CLAUDE.md`

새로운 에이전트/스킬 구조를 CLAUDE.md에 반영하여 모든 Claude 세션이 구조를 인지하도록 한다.

**Step 1: CLAUDE.md의 Architecture 섹션 아래에 에이전트 구조 추가**

기존 `## Architecture` 섹션 바로 아래에 다음 내용 추가:

```markdown
## Agent & Skill Structure

### 대화형 워크플로우 (Claude Code Skill)
- **Skill**: `~/.claude/skills/seo-geo-rewriter/` — `/seo-geo-rewriter` 로 호출
- 플레인 텍스트 아티클 입력 → 최적화 결과물 채팅 출력

### Sub-agents (`.claude/agents/`)
- **seo-analyzer**: 분석 전용 (haiku). SEO/GEO 점수, 이슈 목록 반환
- **seo-writer**: 리라이팅 전용 (sonnet). 제목, slug, 메타, Excerpt, 본문 HTML 생성

### CLI 워크플로우 (기존 유지)
- `node src/cli.js <input.html>` — 배치 처리용
- 스킬과 독립적으로 운영
```

**Step 2: CLAUDE.md 확인**

```bash
grep -n "Agent & Skill" /Users/hyungwoonlee/Documents/AI/seo-geo-agent/CLAUDE.md
```

Expected: 줄 번호와 함께 "Agent & Skill Structure" 텍스트 출력

---

## Task 7: End-to-End 테스트

**Files:**
- Read: `examples/sample-draft.html`

전체 워크플로우가 정상 동작하는지 확인한다.

**Step 1: 테스트 아티클 준비**

`examples/sample-draft.html` 파일의 텍스트를 복사하거나, 간단한 테스트 텍스트 사용:

```
AI 채용이 바꾸는 채용의 미래

기업들은 점점 더 많은 포지션을 채워야 하지만 시간과 인력은 부족합니다.
다이렉트 소싱은 이 문제를 해결하는 새로운 방법입니다.

[... 나머지 아티클 내용 ...]
```

**Step 2: Skill 호출**

Claude Code 채팅에 입력:

```
/seo-geo-rewriter AI 채용

[아티클 텍스트 붙여넣기]
```

**Step 3: 결과물 확인 체크리스트**

- [ ] 📌 제목이 Primary 키워드 포함
- [ ] 🔗 slug가 영문 소문자 + 하이픈
- [ ] 📝 메타 설명이 120-160자
- [ ] 💬 Excerpt가 2-3문장
- [ ] 📄 본문 HTML에 H1, H2, 리스트 포함
- [ ] 본문 마지막에 Searchlight CTA 존재
- [ ] 📊 스코어 요약 표 출력

**Step 4: 실패 시 디버깅 포인트**

- Skill이 로드 안 됨: `ls ~/.claude/skills/seo-geo-rewriter/` 확인
- Sub-agent 없음: `ls .claude/agents/` 확인 (프로젝트 디렉토리에서 실행 필요)
- 전략 파일 못 읽음: `~/.claude/skills/seo-geo-rewriter/rules/searchlight-strategy.md` 경로 확인

---

## 완료 후 검증

```bash
# 전체 파일 구조 확인
echo "=== Skill ===" && ls -la ~/.claude/skills/seo-geo-rewriter/
echo "=== Rules ===" && ls -la ~/.claude/skills/seo-geo-rewriter/rules/
echo "=== Agents ===" && ls -la /Users/hyungwoonlee/Documents/AI/seo-geo-agent/.claude/agents/
```

Expected:
```
=== Skill ===
SKILL.md    rules/
=== Rules ===
searchlight-strategy.md
=== Agents ===
seo-analyzer.md    seo-writer.md
```
