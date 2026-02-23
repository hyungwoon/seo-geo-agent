---
name: seo-geo-rewriter
description: >
  HTML 콘텐츠 초안을 SEO + GEO(Generative Engine Optimization) 최적화된 상태로
  리라이팅합니다. 사용자가 HTML 파일을 제공하면 키워드 분석, 헤딩 구조 최적화,
  메타 태그 생성, Schema.org 구조화 데이터, AI 검색 엔진용 Citability 최적화,
  가독성 개선을 적용한 최적화 HTML을 출력합니다.
  트리거: "SEO 리라이팅", "GEO 최적화", "콘텐츠 최적화", "HTML SEO",
  "AI 검색 최적화", "리라이팅", "seo rewrite", "optimize html".
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - WebFetch
  - WebSearch
---

# SEO/GEO HTML Content Rewriter

HTML 콘텐츠 초안을 입력받아 **전통적 SEO + AI 검색 최적화(GEO)**를 모두 적용한
최적화된 HTML을 출력하는 에이전트 스킬입니다.

## 워크플로우

```
[HTML 초안 입력] → [분석] → [리라이팅 전략] → [최적화 HTML 출력] → [검증 리포트]
```

## Phase 1: 분석 (Analysis)

HTML 파일을 읽고 다음을 분석합니다:

### 1.1 키워드 분석
- 콘텐츠에서 주요 키워드/토픽 자동 추출
- 사용자가 타겟 키워드를 지정한 경우 해당 키워드 중심으로 분석
- 키워드 밀도 계산 (목표: 1-2%)
- LSI(Latent Semantic Indexing) 키워드 식별
- 검색 의도 분류 (정보성 / 상업성 / 거래성 / 탐색성)

### 1.2 구조 분석
- 헤딩 계층 구조 (H1 → H2 → H3) 검증
- 단락 길이 (목표: 150단어 이하)
- 내부/외부 링크 현황
- 이미지 alt 텍스트 확인
- 메타 태그 (title, description, canonical) 확인

### 1.3 GEO 준비도 분석
- AI Citability Score 계산 (인용 가능한 passage 식별)
- 최적 passage 길이: 134-167 단어 블록
- 질문형 헤딩 유무
- 자기 완결적 답변 블록 유무
- 통계/출처 인용 유무
- 정의 패턴 ("X는 ... 입니다") 유무

### 1.4 가독성 분석
- 문장 평균 길이 (목표: 20단어 이하)
- 수동태 비율 (최소화)
- 전문 용어 밀도

---

## Phase 2: 리라이팅 전략 (Strategy)

분석 결과를 바탕으로 리라이팅 전략을 수립합니다:

### 2.1 SEO 최적화 전략
- **메타 태그**: title(50-60자), description(150-160자) 생성
- **헤딩 구조**: H1은 1개, H2/H3로 논리적 계층 구성
- **키워드 배치**: title, H1, 첫 100단어, H2 소제목에 자연스럽게 배치
- **내부 링크**: 관련 콘텐츠 링크 기회 식별
- **이미지 최적화**: alt 텍스트, lazy loading 속성 추가

### 2.2 GEO 최적화 전략
- **Citability 블록 생성**: 각 주요 섹션 시작에 134-167단어의 자기완결적 답변 블록
- **질문형 헤딩**: "X란 무엇인가?", "어떻게 X하는가?" 형태로 변환
- **직접 답변 패턴**: 섹션 시작 40-60 단어 내에 직접 답변 배치
- **통계/출처 삽입**: 구체적 수치와 출처 명시
- **정의 패턴**: "X는 ~를 의미합니다" 패턴 활용
- **비교 테이블**: 데이터를 표 형태로 구조화
- **FAQ 섹션**: 관련 질문과 간결한 답변 추가

### 2.3 Schema.org 구조화 데이터 전략
- 콘텐츠 유형에 따른 적절한 Schema 선택
- JSON-LD 형식으로 구현
- 필수/권장 속성 포함

| 콘텐츠 유형 | Schema Type |
|-------------|-------------|
| 블로그/기사 | Article, BlogPosting |
| 제품 페이지 | Product |
| FAQ 페이지 | FAQPage |
| 회사 소개 | Organization |
| 서비스 페이지 | Service |
| 로컬 비즈니스 | LocalBusiness |

**주의사항:**
- HowTo 스키마 사용 금지 (2023년 9월 deprecated)
- FAQPage 스키마는 정부/의료 사이트에만 사용
- FID 대신 INP 사용 (Core Web Vitals)

---

## Phase 3: 리라이팅 실행 (Rewrite)

### 3.1 HTML 리라이팅 규칙

**절대 변경하지 않는 것:**
- 콘텐츠의 핵심 메시지와 사실 관계
- 브랜드명, 고유명사
- 사용자가 명시적으로 유지를 요청한 부분

**반드시 최적화하는 것:**

1. **`<head>` 섹션**
```html
<!-- 메타 태그 최적화 -->
<title>[키워드 포함 50-60자 타이틀]</title>
<meta name="description" content="[키워드 포함 150-160자 설명]">
<meta name="robots" content="index, follow">
<link rel="canonical" href="[정규 URL]">

<!-- Open Graph -->
<meta property="og:title" content="[타이틀]">
<meta property="og:description" content="[설명]">
<meta property="og:type" content="article">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[타이틀]">
<meta name="twitter:description" content="[설명]">
```

2. **`<body>` 콘텐츠**
- H1 태그: 1개만, 주요 키워드 포함
- H2/H3: 질문형 또는 키워드 포함 소제목
- 첫 단락: 40-60 단어 내 핵심 정의/답변
- 각 섹션: 134-167 단어 Citability 블록으로 시작
- 단락: 2-4 문장, 150단어 이하
- 리스트/테이블: 비교 데이터 구조화
- 이미지: alt 속성, loading="lazy"

3. **Schema.org JSON-LD**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "[적절한 타입]",
  "headline": "[H1과 동일]",
  "description": "[meta description과 동일]",
  "author": {
    "@type": "Person",
    "name": "[저자명]"
  },
  "datePublished": "[발행일]",
  "dateModified": "[수정일]"
}
</script>
```

### 3.2 GEO Citability 블록 작성법

각 주요 섹션에 다음 패턴으로 Citability 블록을 작성합니다:

```
[직접 답변 (40-60 단어)]
[구체적 통계/수치 + 출처]
[핵심 포인트 2-3개 리스트]
[전체 블록: 134-167 단어]
```

**예시:**
```html
<section>
  <h2>프로젝트 관리 도구란 무엇인가?</h2>
  <p>프로젝트 관리 도구는 팀이 작업을 계획, 추적, 협업할 수 있도록
  설계된 소프트웨어입니다. 2025년 기준 전 세계 프로젝트 관리 소프트웨어
  시장 규모는 72억 달러에 달하며(Statista, 2025), 원격 근무 확산과
  함께 연평균 13.7%의 성장률을 보이고 있습니다.</p>
  <p>효과적인 프로젝트 관리 도구의 핵심 기능:</p>
  <ul>
    <li>작업 분배 및 진행 상황 추적</li>
    <li>팀 간 실시간 협업 및 커뮤니케이션</li>
    <li>일정 관리 및 마일스톤 설정</li>
  </ul>
</section>
```

---

## Phase 4: 검증 및 출력 (Validation & Output)

### 4.1 출력 파일

리라이팅 완료 시 2개 파일을 생성합니다:

1. **`[원본파일명].optimized.html`** - 최적화된 HTML
2. **`[원본파일명].seo-report.md`** - SEO/GEO 분석 리포트

### 4.2 SEO/GEO 리포트 형식

```markdown
# SEO/GEO Optimization Report

## Overall Scores
| 항목 | Before | After | 변화 |
|------|--------|-------|------|
| SEO Score | XX/100 | XX/100 | +XX |
| GEO Citability Score | XX/100 | XX/100 | +XX |
| Readability Score | XX/100 | XX/100 | +XX |

## 키워드 분석
- Primary: [키워드] (밀도: X.X% → X.X%)
- Secondary: [키워드1], [키워드2]
- LSI: [관련 키워드들]

## 적용된 변경 사항

### SEO 최적화
- [ ] 메타 타이틀 생성/최적화 (XX자)
- [ ] 메타 디스크립션 생성/최적화 (XXX자)
- [ ] H1 태그 최적화
- [ ] 헤딩 계층 구조 정리
- [ ] 키워드 밀도 조정
- [ ] 이미지 alt 텍스트 추가
- [ ] 내부 링크 추가
- [ ] canonical URL 설정

### GEO 최적화
- [ ] Citability 블록 X개 생성
- [ ] 질문형 헤딩 X개 변환
- [ ] 직접 답변 패턴 X개 적용
- [ ] 통계/출처 인용 X개 추가
- [ ] 정의 패턴 X개 적용
- [ ] 비교 테이블 X개 추가
- [ ] FAQ 섹션 추가

### Schema.org
- [ ] [Schema Type] JSON-LD 추가
- [ ] 필수 속성 포함 확인

## 추가 권장 사항
1. [권장 사항 1]
2. [권장 사항 2]
3. [권장 사항 3]
```

### 4.3 검증 체크리스트

리라이팅 완료 후 자동 검증:

- [ ] HTML 유효성 (닫히지 않은 태그 없음)
- [ ] H1 태그 1개만 존재
- [ ] 헤딩 계층 건너뜀 없음 (H1→H3 금지, H2 거쳐야 함)
- [ ] 메타 title 50-60자
- [ ] 메타 description 150-160자
- [ ] 키워드 밀도 1-2%
- [ ] 모든 이미지에 alt 속성
- [ ] JSON-LD Schema 유효성
- [ ] Citability 블록 최소 3개
- [ ] 각 Citability 블록 134-167 단어

---

## 사용 예시

### 기본 사용
```
사용자: 이 HTML 파일을 SEO/GEO 최적화해줘
[HTML 파일 경로 또는 내용 제공]
```

### 타겟 키워드 지정
```
사용자: "프로젝트 관리 도구" 키워드로 이 HTML을 SEO 최적화해줘
[HTML 파일 경로 또는 내용 제공]
```

### 특정 Schema 타입 지정
```
사용자: 이 HTML을 Product 스키마 포함해서 SEO 최적화해줘
[HTML 파일 경로 또는 내용 제공]
```

---

## Searchlight (서치라이트) Content Strategy

이 스킬은 서치라이트 B2B 블로그 콘텐츠 최적화에 특화된 규칙을 포함합니다.
전체 규칙: `config/searchlight-content-strategy.md`

### Searchlight 적용 시 추가 규칙

**입력 형식:**
```
Primary: (타겟 키워드)
Secondary: (보조 키워드)
HTML: (파일 경로 또는 URL)
```

**슬러그 생성 (필수):**
- Primary 기반 영문 소문자, 3-5단어, 최대 60자
- 예: 다이렉트 소싱 → `direct-sourcing`

**키워드 배치 (필수):**
- Title 1회, H1 2회, 첫 100단어 1회, H2 1회

**브랜드 혼재 방지:**
- "서치라이트" 사용 시 반드시 AI 채용/다이렉트 소싱/숏리스트/어프로치/채용 솔루션 중 1개 이상 동반

**CTA (필수):**
- 모든 글의 마지막은 서치라이트 CTA로 마무리

**근거 원칙:**
- 허위 통계 절대 금지, 인용 시 기관명+연도 명시

**출력 (4개 파일):**
1. `optimized HTML` — SEO/GEO 최적화 HTML (slug 반영 canonical 포함)
2. `meta-pack.json` — Ghost CMS 메타데이터
3. `distribution-pack.md` — 네이버/인블로그 재배포용
4. `seo-report.md` — 점수 + 카니발/브랜드 혼재 위험도

**최종 검증:**
- [ ] slug 생성 및 규칙 준수
- [ ] canonical에 slug 반영
- [ ] H1에 Primary 2회
- [ ] 필수 위치 키워드 배치
- [ ] 허위 통계 없음
- [ ] 서치라이트 CTA로 마무리

### 배치 처리 (Ghost Migration)

복수 콘텐츠 → Ghost JSON import 일괄 변환:
1. 여러 URL/HTML 입력
2. 각각 분석 → 리라이팅 파이프라인 처리
3. 개별 meta-pack.json 생성
4. Ghost JSON import 파일 하나로 통합
5. 각 콘텐츠별 distribution-pack.md 생성

---

## 관련 스킬

더 깊은 분석이 필요한 경우 다음 스킬과 함께 사용:
- **seo-audit** — 전체 사이트 감사
- **seo-geo** — AI 검색 엔진 최적화 심층 분석
- **seo-content-optimizer** — 콘텐츠 품질 심층 분석
- **schema-markup** — 구조화 데이터 상세 구현
- **copywriting** — 마케팅 카피 개선
- **programmatic-seo** — 대량 페이지 최적화
