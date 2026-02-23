# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SEO/GEO Content Rewriter — optimizes articles for traditional SEO and AI search engines (GEO). Two workflows:
1. **Conversational (primary)**: `/seo-geo-rewriter` skill — paste plain text, get optimized output in chat
2. **CLI (batch)**: `node src/cli.js` — programmatic HTML file processing

## Agent & Skill Structure

### Conversational Workflow (`/seo-geo-rewriter`)
- **Skill**: `~/.claude/skills/seo-geo-rewriter/SKILL.md`
- **Skill source**: `skills/seo-geo-rewriter/SKILL.md` (프로젝트 내 원본)
- **Input**: Plain text article pasted in chat (+ optional keyword)
- **Output**: 제목, Post URL(slug), 메타 설명, Excerpt, 최적화 본문 HTML

**스킬 설치 (최초 1회 필수):**
```bash
ln -s /Users/hyungwoon/Documents/AI/seo-geo-agent/skills/seo-geo-rewriter ~/.claude/skills/seo-geo-rewriter
```
`unknown-skill` 오류가 나오면 위 명령어를 실행하지 않은 것. 심링크로 연결해야 Claude Code가 인식함.

### Sub-agents (`.claude/agents/`)
- **seo-analyzer** — 분석 전용 (haiku). SEO/GEO 점수, 이슈 목록 반환
- **seo-writer** — 리라이팅 전용 (sonnet). 제목, slug, 메타, Excerpt, 본문 HTML 생성

### Strategy Rules
- `config/searchlight-content-strategy.md` — 전체 전략 (source of truth)
- `~/.claude/skills/seo-geo-rewriter/rules/searchlight-strategy.md` — Skill용 요약본

## Commands

```bash
# Install dependencies
npm install

# Run CLI
node src/cli.js <input.html> [options]
# Options: -k/--keyword, -s/--schema, -o/--output, -r/--report, --no-schema, --lang ko|en

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run a single test file
node --test tests/analyzer.test.js
```

## Architecture

```
CLI (cli.js) → Analyzer (analyzer.js) → Rewriter (rewriter.js) → Reporter (reporter.js)
```

**Four-module pipeline with clean separation:**

- **cli.js** — Orchestration only. Parses args, reads input HTML, calls analyzer → rewriter → reporter, writes output files (`*.optimized.html` + `*.seo-report.md`)
- **analyzer.js** — Pure analysis, no side effects. Produces an analysis object with scores (SEO/GEO/readability), keyword extraction, heading structure, image audit, meta tag checks, GEO citability assessment
- **rewriter.js** — Immutable HTML transformation. Takes analysis + original HTML, returns optimized HTML string. Handles meta tags, heading normalization, image optimization, Schema.org JSON-LD injection
- **reporter.js** — Generates markdown report from analysis object. Scoring breakdown, issue list, implementation checklist

**Data flow:** Input HTML → analysis object → (optimized HTML + markdown report)

## Key Technical Details

- **Runtime:** Node.js 20+ with ES Modules (`"type": "module"`)
- **Only production dependency:** `node-html-parser` for DOM manipulation
- **Testing:** Node.js built-in test runner (`node:test`) + `assert/strict` — no external test frameworks
- **No build step:** Pure JavaScript, direct execution

## Scoring System

- **SEO Score** (0-100): Starts at 100, deducts per issue severity (critical: -15, high: -8~10, medium: -4~5, low: -2)
- **GEO Score** (0-100): Additive — citability blocks (up to 30pts), question headings (20pts), definition patterns (15pts), statistics/sources (15pts), lists (10pts), tables (10pts)
- **Readability** (0-100): Deducts for long sentences, long paragraphs, short content
- **Overall:** SEO × 0.4 + GEO × 0.35 + Readability × 0.25

## GEO-Specific Concepts

- **Citability blocks:** Self-contained 134-167 word passages optimized for AI citation
- **Question headings:** "What is X?" / "X란 무엇인가?" format for AI extraction
- **Direct answer patterns:** Core answer within first 40-60 words of a section
- **Definition patterns:** "X는 ... 입니다" / "X means..." / "X refers to..."

## Schema.org Notes (from SKILL.md)

- HowTo schema is deprecated (Sept 2023) — do not use
- FAQPage schema: government/medical sites only
- Use INP instead of FID for Core Web Vitals

## Language Support

Korean and English. Language detection: checks HTML `lang` attribute first, falls back to Korean character ratio analysis (>30% = Korean). Stopword filtering for both languages during keyword extraction.

## Searchlight Content Strategy

This tool is primarily used for **Searchlight (서치라이트)** — an AI recruiting/direct sourcing solution's Ghost B2B blog.

**Strategy config**: `config/searchlight-content-strategy.md` — full rules for keyword processing, slug generation, brand guidelines, CTA structure, readability constraints, and output format.

### Workflow (Searchlight Blog)

```
Input (HTML/URL + optional keywords)
  → Analyze (SEO/GEO scores, keyword extraction)
  → Rewrite (optimized HTML with slug, canonical, Schema.org)
  → Output 4 files:
      1. optimized HTML (with meta, JSON-LD, CTA)
      2. meta-pack.json (Ghost import metadata)
      3. distribution-pack.md (Naver/InBlog redistribution)
      4. seo-report.md (scores, risks, recommendations)
```

### Key Rules (quick reference)

- **Slug**: Primary keyword based, English lowercase, 3-5 words, max 60 chars
- **Keyword placement**: Primary in title(1x), H1(2x), first 100 words(1x), H2(1x)
- **Brand safety**: "서치라이트" must always appear with AI 채용/다이렉트 소싱/숏리스트/어프로치/채용 솔루션
- **CTA**: Every article ends with Searchlight CTA
- **No fabricated statistics**: cite source + year or omit numbers
- **Target detection**: default 기업(enterprise), switch to 구직자(job seeker) if salary/portfolio/cover letter content
- **Content length**: 2,500-4,500 chars total, H1 ≤ 28 chars (max 35), meta desc 120-160 chars

### Batch Processing (Ghost Migration)

For bulk content optimization → Ghost JSON import:
1. Accept multiple URLs/HTML files
2. Process each through analyzer → rewriter pipeline
3. Generate meta-pack.json per article
4. Combine into single Ghost JSON import file
5. Include distribution-pack.md for each (Naver/InBlog)
