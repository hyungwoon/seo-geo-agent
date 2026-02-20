import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeHtml, analyzeGeoCitability } from '../src/analyzer.js'
import { parse } from 'node-html-parser'

describe('analyzeHtml', () => {
  const sampleHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <title>프로젝트 관리 도구 완벽 가이드 2025</title>
  <meta name="description" content="프로젝트 관리 도구의 종류, 비교, 선택 방법을 상세히 알아봅니다. 팀 생산성을 높이는 최적의 도구를 찾아보세요.">
</head>
<body>
  <h1>프로젝트 관리 도구 완벽 가이드</h1>
  <p>프로젝트 관리 도구는 팀이 작업을 계획하고 추적하는 소프트웨어입니다.</p>
  <h2>프로젝트 관리 도구란 무엇인가?</h2>
  <p>프로젝트 관리 도구란 팀이 작업을 계획, 추적, 협업할 수 있도록 설계된 소프트웨어입니다. 2025년 기준 시장 규모는 72억 달러에 달합니다.</p>
  <h2>주요 기능</h2>
  <ul><li>작업 관리</li><li>일정 추적</li></ul>
  <img src="test.png" alt="프로젝트 관리 대시보드">
</body>
</html>`

  it('should detect language as Korean', () => {
    const result = analyzeHtml(sampleHtml, { keywords: [], lang: '' })
    assert.equal(result.lang, 'ko')
  })

  it('should find exactly one H1', () => {
    const result = analyzeHtml(sampleHtml, { keywords: [], lang: '' })
    assert.equal(result.headings.h1Count, 1)
  })

  it('should detect question headings', () => {
    const result = analyzeHtml(sampleHtml, { keywords: [], lang: '' })
    assert.ok(result.headings.questionHeadingCount >= 1)
  })

  it('should analyze meta title', () => {
    const result = analyzeHtml(sampleHtml, { keywords: [], lang: '' })
    assert.ok(result.meta.title.includes('프로젝트 관리'))
    assert.ok(result.meta.titleLength > 0)
  })

  it('should analyze meta description', () => {
    const result = analyzeHtml(sampleHtml, { keywords: [], lang: '' })
    assert.ok(result.meta.description.length > 0)
  })

  it('should find images', () => {
    const result = analyzeHtml(sampleHtml, { keywords: [], lang: '' })
    assert.equal(result.images.count, 1)
  })

  it('should calculate scores', () => {
    const result = analyzeHtml(sampleHtml, { keywords: [], lang: '' })
    assert.ok(result.scores.seo >= 0 && result.scores.seo <= 100)
    assert.ok(result.scores.geo >= 0 && result.scores.geo <= 100)
    assert.ok(result.scores.readability >= 0 && result.scores.readability <= 100)
    assert.ok(result.scores.overall >= 0 && result.scores.overall <= 100)
  })

  it('should use provided keywords', () => {
    const result = analyzeHtml(sampleHtml, { keywords: ['프로젝트 관리'], lang: '' })
    assert.equal(result.content.keywordAnalysis[0].keyword, '프로젝트 관리')
  })

  it('should detect keyword in title', () => {
    const result = analyzeHtml(sampleHtml, { keywords: ['프로젝트 관리'], lang: '' })
    assert.equal(result.content.keywordAnalysis[0].inTitle, true)
  })
})

describe('analyzeHtml - missing elements', () => {
  const bareHtml = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <p>Some very short content here.</p>
</body>
</html>`

  it('should flag missing title as critical', () => {
    const result = analyzeHtml(bareHtml, { keywords: [], lang: '' })
    const critical = result.meta.issues.find(i => i.severity === 'critical' && i.message.includes('title'))
    assert.ok(critical)
  })

  it('should flag missing description as critical', () => {
    const result = analyzeHtml(bareHtml, { keywords: [], lang: '' })
    const critical = result.meta.issues.find(i => i.severity === 'critical' && i.message.includes('description'))
    assert.ok(critical)
  })

  it('should flag missing H1', () => {
    const result = analyzeHtml(bareHtml, { keywords: [], lang: '' })
    const issue = result.headings.issues.find(i => i.message.includes('H1'))
    assert.ok(issue)
  })

  it('should detect low GEO score for bare HTML', () => {
    const result = analyzeHtml(bareHtml, { keywords: [], lang: '' })
    assert.ok(result.scores.geo < 30)
  })
})

describe('analyzeGeoCitability', () => {
  it('should detect definition patterns', () => {
    const html = `<body><p>프로젝트 관리는 팀의 작업을 효율적으로 수행하기 위한 프로세스입니다.</p></body>`
    const root = parse(html)
    const result = analyzeGeoCitability(root)
    assert.ok(result.definitionCount >= 1)
  })

  it('should detect statistics', () => {
    const html = `<body><p>시장 규모는 72억 달러이며 연평균 13.7% 성장합니다.</p></body>`
    const root = parse(html)
    const result = analyzeGeoCitability(root)
    assert.ok(result.statisticCount >= 1)
  })

  it('should detect lists', () => {
    const html = `<body><ul><li>Item 1</li></ul></body>`
    const root = parse(html)
    const result = analyzeGeoCitability(root)
    assert.equal(result.hasLists, true)
  })

  it('should detect tables', () => {
    const html = `<body><table><tr><td>Data</td></tr></table></body>`
    const root = parse(html)
    const result = analyzeGeoCitability(root)
    assert.equal(result.hasTables, true)
  })
})
