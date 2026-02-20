import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeHtml } from '../src/analyzer.js'
import { generateReport } from '../src/reporter.js'

const sampleHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <title>프로젝트 관리 도구 비교 가이드 2025</title>
  <meta name="description" content="프로젝트 관리 도구 비교 가이드. Asana, Jira, Monday 등 주요 도구를 상세히 비교합니다.">
</head>
<body>
  <h1>프로젝트 관리 도구 비교 가이드</h1>
  <p>프로젝트 관리 도구는 팀이 작업을 계획, 추적, 협업할 수 있도록 설계된 소프트웨어입니다.</p>
  <h2>프로젝트 관리 도구란 무엇인가?</h2>
  <p>프로젝트 관리 도구란 팀의 목표 달성을 위해 작업을 체계적으로 관리하는 플랫폼입니다. 2025년 시장 규모는 72억 달러입니다.</p>
  <h2>주요 기능</h2>
  <ul><li>작업 관리</li><li>일정 추적</li></ul>
</body>
</html>`

const config = { keywords: ['프로젝트 관리'], lang: '' }

describe('generateReport', () => {
  it('should generate markdown report', () => {
    const analysis = analyzeHtml(sampleHtml, config)
    const report = generateReport(analysis, config)
    assert.ok(typeof report === 'string')
    assert.ok(report.length > 100)
  })

  it('should include scores section', () => {
    const analysis = analyzeHtml(sampleHtml, config)
    const report = generateReport(analysis, config)
    assert.ok(report.includes('SEO Score'))
    assert.ok(report.includes('GEO Citability'))
    assert.ok(report.includes('Readability'))
  })

  it('should include keyword analysis', () => {
    const analysis = analyzeHtml(sampleHtml, config)
    const report = generateReport(analysis, config)
    assert.ok(report.includes('Keyword Analysis'))
    assert.ok(report.includes('프로젝트 관리'))
  })

  it('should include heading structure', () => {
    const analysis = analyzeHtml(sampleHtml, config)
    const report = generateReport(analysis, config)
    assert.ok(report.includes('Heading Structure'))
  })

  it('should include GEO analysis', () => {
    const analysis = analyzeHtml(sampleHtml, config)
    const report = generateReport(analysis, config)
    assert.ok(report.includes('GEO'))
    assert.ok(report.includes('Citable'))
  })

  it('should include implementation checklist', () => {
    const analysis = analyzeHtml(sampleHtml, config)
    const report = generateReport(analysis, config)
    assert.ok(report.includes('Checklist'))
  })

  it('should include issues summary', () => {
    const analysis = analyzeHtml(sampleHtml, config)
    const report = generateReport(analysis, config)
    assert.ok(report.includes('Issues Found'))
  })
})
