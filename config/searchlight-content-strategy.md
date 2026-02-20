# Searchlight Content Strategy Rules

Ghost B2B blog SEO+GEO content strategy for Searchlight (AI recruiting/direct sourcing solution).

## Product Context

- **Product**: Searchlight (서치라이트) — AI recruiting / direct sourcing solution
- **Blog Platform**: Ghost CMS
- **Target**: B2B (enterprises), occasionally job seekers
- **Brand Keywords**: AI 채용, 다이렉트 소싱, 숏리스트, 어프로치, 채용 솔루션

## Input Format

```
Primary: (optional target keyword)
Secondary: (optional secondary keywords)
HTML: (HTML content or URL)
```

## Keyword Processing

1. If Primary is provided, use as-is
2. If Primary is missing, auto-extract from HTML:
   - Title/H1 core concepts
   - High-frequency concrete nouns
   - Keywords with clear search intent
   - Exclude: "방법", "팁", "가이드"
3. If Secondary is missing, focus on single Primary

## Slug Rules (mandatory)

1. Always generate a slug
2. Base slug on Primary keyword
3. English lowercase only
4. Spaces → hyphens (-)
5. Remove particles, unnecessary adjectives
6. 3-5 words recommended
7. Max 60 characters
8. Remove articles (the, a, of, and)
9. Add 1 secondary keyword if duplication risk exists
10. Include slug in meta-pack.json
11. Reflect slug in canonical URL of optimized HTML

Examples:
- 다이렉트 소싱 → direct-sourcing
- AI 채용 솔루션 → ai-recruiting-solution
- 채용 속도 개선 전략 → recruitment-speed-optimization

## Target Audience Detection

Default: Enterprise (기업)

Switch to job seeker (구직자) if content contains:
- 연봉 (salary)
- 포트폴리오 (portfolio)
- 자기소개서 (cover letter)
- 취업 전략 (job search strategy)

If ambiguous, keep as enterprise.

## Evidence Principles

- External citations allowed
- NEVER fabricate statistics or figures
- Always include source name + year when citing
- If no evidence available, explain without numbers

**Fabricated statistics are strictly prohibited.**

## Keyword Placement Rules

Primary keyword MUST appear in:
- Title: 1 time
- H1: 2 times
- First 100 words: 1 time
- At least 1 H2: 1 time

No excessive repetition.
No creating similar articles targeting the same keyword (cannibalization).

## Brand Mixing Prevention

When using "서치라이트" (Searchlight), MUST include at least one of:
- AI 채용
- 다이렉트 소싱
- 숏리스트
- 어프로치
- 채용 솔루션

NEVER define "서치라이트란?" as standalone definition.

## Readability Guidelines

| Element | Constraint |
|---------|-----------|
| H1 | 28 chars recommended, 35 max |
| Meta description | 120-160 chars |
| Intro | 4-6 sentences, problem statement or misconception |
| Each H2 section | 700-1200 chars |
| Paragraphs | 2-4 sentences |
| Lists per section | 3-5 items |
| Wall of text | Prohibited |
| FAQ | 2-3 if needed |
| Total length | 2500-4500 chars |

## Content Structure (mandatory)

1. Hooking introduction
2. Problem summary
3. Core explanation centered on Primary keyword
4. If enterprise target:
   - Hidden talent discovery via external data
   - Longlist → shortlist compression
   - Evidence for "why this person"
   - Personalized approach
5. ALWAYS end with Searchlight CTA

## CTA Structure

Pattern: Problem summary → Solution connection → Call to action

Example:
> 숏리스트를 빠르게 받아보고 싶다면,
> 서치라이트 AI 채용 솔루션으로 시작해보세요.

## Output Format (strict order)

### 1. optimized HTML
- `<title>`
- meta description
- canonical (with slug)
- JSON-LD (Article)
- Body content

### 2. meta-pack.json
```json
{
  "title": "",
  "meta_description": "",
  "slug": "",
  "primary_keyword": "",
  "secondary_keywords": [],
  "category": "서치라이트 가이드",
  "target_type": "기업 or 구직자"
}
```

### 3. distribution-pack.md
Naver/InBlog redistribution version:
- Shorter paragraphs
- List-centric
- CTA included

### 4. seo-report.md
- SEO Score
- GEO Score
- Readability
- Primary auto-selection status
- Cannibalization risk
- Brand mixing risk
- 3 internal link anchor recommendations

## Final Verification Checklist

- [ ] Slug generated?
- [ ] Slug rules followed?
- [ ] Canonical reflects slug?
- [ ] H1 contains Primary 2 times?
- [ ] Primary in all required positions?
- [ ] No fabricated statistics?
- [ ] Ends with Searchlight CTA?
