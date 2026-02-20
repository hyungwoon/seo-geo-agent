import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeHtml } from '../src/analyzer.js'
import { rewriteHtml } from '../src/rewriter.js'

const bareHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>짧은제목</title>
</head>
<body>
  <h2>첫 번째 섹션</h2>
  <p>프로젝트 관리 도구는 팀 생산성을 높이는 중요한 소프트웨어입니다.</p>
  <img src="test.png">
</body>
</html>`

const config = {
  keywords: ['프로젝트 관리'],
  schemaType: '',
  generateSchema: true,
  lang: 'ko',
}

describe('rewriteHtml', () => {
  it('should add meta description when missing', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('meta name="description"'))
  })

  it('should add meta robots', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('meta name="robots"'))
  })

  it('should add Open Graph tags', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('og:title'))
    assert.ok(result.includes('og:type'))
  })

  it('should add Twitter Card tags', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('twitter:card'))
  })

  it('should promote first H2 to H1 when H1 is missing', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('<h1>'))
  })

  it('should add loading=lazy to images', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('loading="lazy"'))
  })

  it('should add alt text to images without alt', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('alt='))
  })

  it('should add Schema.org JSON-LD', () => {
    const analysis = analyzeHtml(bareHtml, config)
    const result = rewriteHtml(bareHtml, analysis, config)
    assert.ok(result.includes('application/ld+json'))
    assert.ok(result.includes('schema.org'))
  })

  it('should not add schema when generateSchema is false', () => {
    const noSchemaConfig = { ...config, generateSchema: false }
    const analysis = analyzeHtml(bareHtml, noSchemaConfig)
    const result = rewriteHtml(bareHtml, analysis, noSchemaConfig)
    assert.ok(!result.includes('application/ld+json'))
  })
})

describe('rewriteHtml - multiple H1s', () => {
  const multiH1Html = `<!DOCTYPE html>
<html>
<head><title>Test Page Title For SEO Optimization</title></head>
<body>
  <h1>First H1</h1>
  <p>Content</p>
  <h1>Second H1</h1>
  <p>More content</p>
</body>
</html>`

  it('should keep only one H1 and convert others to H2', () => {
    const analysis = analyzeHtml(multiH1Html, { keywords: [], lang: 'en' })
    const result = rewriteHtml(multiH1Html, analysis, { ...config, generateSchema: false })
    const h1Count = (result.match(/<h1/g) || []).length
    assert.equal(h1Count, 1)
    assert.ok(result.includes('<h2'))
  })
})

describe('rewriteHtml - existing schema preserved', () => {
  const htmlWithSchema = `<!DOCTYPE html>
<html>
<head>
  <title>Test Page with Schema Already Here</title>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
</head>
<body><h1>Test</h1><p>Content here for testing purposes.</p></body>
</html>`

  it('should not duplicate schema if already present', () => {
    const analysis = analyzeHtml(htmlWithSchema, { keywords: [], lang: 'en' })
    const result = rewriteHtml(htmlWithSchema, analysis, config)
    const schemaCount = (result.match(/application\/ld\+json/g) || []).length
    assert.equal(schemaCount, 1)
  })
})
