/**
 * SEO/GEO 분석 리포트를 마크다운 형식으로 생성합니다.
 * @param {object} analysis - 분석 결과
 * @param {object} config - CLI 설정
 * @returns {string} 마크다운 리포트
 */
export function generateReport(analysis, config) {
  const { meta, headings, content, images, links, schema, geo, scores } = analysis

  const sections = [
    buildHeader(scores),
    buildKeywordSection(content),
    buildMetaSection(meta),
    buildHeadingSection(headings),
    buildContentSection(content),
    buildGeoSection(geo),
    buildImageSection(images),
    buildLinkSection(links),
    buildSchemaSection(schema),
    ...(analysis.searchlight ? [buildSearchlightSection(analysis.searchlight)] : []),
    buildIssuesSummary(analysis),
    buildChecklist(analysis, config),
  ]

  return sections.join('\n\n---\n\n')
}

function buildHeader(scores) {
  return `# SEO/GEO Optimization Report

Generated: ${new Date().toISOString().split('T')[0]}

## Overall Scores

| 항목 | Score | 상태 |
|------|-------|------|
| SEO Score | **${scores.seo}/100** | ${scoreEmoji(scores.seo)} |
| GEO Citability | **${scores.geo}/100** | ${scoreEmoji(scores.geo)} |
| Readability | **${scores.readability}/100** | ${scoreEmoji(scores.readability)} |
| **Overall** | **${scores.overall}/100** | ${scoreEmoji(scores.overall)} |`
}

function buildKeywordSection(content) {
  if (content.keywordAnalysis.length === 0) {
    return `## Keyword Analysis

No keywords specified or detected.`
  }

  const rows = content.keywordAnalysis.map(ka => {
    const placement = [
      ka.inTitle ? 'Title' : null,
      ka.inH1 ? 'H1' : null,
      ka.inFirst100 ? 'First 100 words' : null,
      ka.inH2 ? 'H2' : null,
    ].filter(Boolean).join(', ') || 'None'

    return `| ${ka.keyword} | ${ka.density}% | ${placement} |`
  })

  return `## Keyword Analysis

| Keyword | Density | Placement |
|---------|---------|-----------|
${rows.join('\n')}`
}

function buildMetaSection(meta) {
  const titleStatus = !meta.title ? 'MISSING' : `${meta.titleLength}자`
  const descStatus = !meta.description ? 'MISSING' : `${meta.descriptionLength}자`

  return `## Meta Tags

| Element | Value | Length | Status |
|---------|-------|--------|--------|
| Title | ${truncate(meta.title, 40)} | ${titleStatus} | ${lengthStatus(meta.titleLength, 50, 60)} |
| Description | ${truncate(meta.description, 40)} | ${descStatus} | ${lengthStatus(meta.descriptionLength, 150, 160)} |
| Canonical | ${meta.canonical || 'MISSING'} | - | ${meta.canonical ? 'OK' : 'MISSING'} |
| OG Title | ${meta.ogTitle ? 'Present' : 'MISSING'} | - | ${meta.ogTitle ? 'OK' : 'MISSING'} |
| Twitter Card | ${meta.twitterCard || 'MISSING'} | - | ${meta.twitterCard ? 'OK' : 'MISSING'} |`
}

function buildHeadingSection(headings) {
  const hierarchy = headings.list.map(h => {
    const indent = '  '.repeat(parseInt(h.tag[1]) - 1)
    return `${indent}- \`<${h.tag}>\` ${h.text}`
  }).join('\n')

  return `## Heading Structure

- H1 Count: **${headings.h1Count}** ${headings.h1Count === 1 ? '(OK)' : '(FIX NEEDED)'}
- Question Headings: **${headings.questionHeadingCount}**
- Total Headings: **${headings.list.length}**

### Hierarchy

${hierarchy || 'No headings found.'}`
}

function buildContentSection(content) {
  return `## Content Analysis

| Metric | Value | Status |
|--------|-------|--------|
| Word Count | ${content.wordCount} | ${content.wordCount >= 300 ? 'OK' : 'TOO SHORT'} |
| Paragraphs | ${content.paragraphCount} | - |
| Avg Sentence Length | ${content.avgSentenceLength} words | ${content.avgSentenceLength <= 20 ? 'OK' : 'TOO LONG'} |
| Long Paragraphs (>150w) | ${content.longParagraphs.length} | ${content.longParagraphs.length === 0 ? 'OK' : 'NEEDS SPLIT'} |`
}

function buildGeoSection(geo) {
  return `## GEO (AI Search) Analysis

| Metric | Value | Status |
|--------|-------|--------|
| Citable Blocks (134-167w) | ${geo.citableBlocks} | ${geo.citableBlocks >= 3 ? 'OK' : 'NEED MORE'} |
| Question Headings | ${geo.questionHeadingCount} | ${geo.questionHeadingCount > 0 ? 'OK' : 'ADD QUESTIONS'} |
| Definition Patterns | ${geo.definitionCount} | ${geo.definitionCount > 0 ? 'OK' : 'ADD DEFINITIONS'} |
| Statistics/Sources | ${geo.statisticCount} | ${geo.statisticCount >= 2 ? 'OK' : 'ADD DATA'} |
| Lists (ul/ol) | ${geo.hasLists ? 'Yes' : 'No'} | ${geo.hasLists ? 'OK' : 'ADD LISTS'} |
| Tables | ${geo.hasTables ? 'Yes' : 'No'} | ${geo.hasTables ? 'OK' : 'CONSIDER ADDING'} |

### Citable Passages Found

${geo.passages.length > 0
    ? geo.passages.map((p, i) => `${i + 1}. **${p.wordCount} words** ${p.optimal ? '(OPTIMAL)' : ''}: "${p.preview}"`).join('\n')
    : 'No citable passages found. Add 134-167 word self-contained answer blocks.'
  }`
}

function buildImageSection(images) {
  if (images.count === 0) {
    return `## Images

No images found.`
  }

  const missingAlt = images.list.filter(i => !i.alt).length
  const missingLazy = images.list.filter(i => !i.loading).length

  return `## Images

| Metric | Value |
|--------|-------|
| Total Images | ${images.count} |
| Missing Alt Text | ${missingAlt} |
| Missing Lazy Loading | ${missingLazy} |`
}

function buildLinkSection(links) {
  return `## Links

| Type | Count |
|------|-------|
| Internal Links | ${links.internalCount} |
| External Links | ${links.externalCount} |`
}

function buildSchemaSection(schema) {
  if (schema.hasSchema) {
    const types = schema.existing.map(s => s['@type'] || 'Unknown').join(', ')
    return `## Schema.org / Structured Data

**Status**: Present
**Types**: ${types}`
  }

  return `## Schema.org / Structured Data

**Status**: MISSING - Schema.org JSON-LD will be added during optimization.`
}

function buildSearchlightSection(searchlight) {
  const brandStatus = searchlight.brandMixingRisk ? 'WARNING' : 'OK'
  const ctaStatus = searchlight.hasCta ? 'OK' : 'MISSING'

  return `## Searchlight Content Rules

| Check | Value | Status |
|-------|-------|--------|
| Target Audience | ${searchlight.targetType} | - |
| Slug | \`${searchlight.slug || 'NOT GENERATED'}\` | ${searchlight.slug ? 'OK' : 'MISSING'} |
| Brand Mentions | ${searchlight.brandMentions} | - |
| Brand Context | ${searchlight.hasBrandContext ? 'Yes' : 'No'} | ${brandStatus} |
| Brand Mixing Risk | ${searchlight.brandMixingRisk ? 'HIGH' : 'Low'} | ${brandStatus} |
| CTA Present | ${searchlight.hasCta ? 'Yes' : 'No'} | ${ctaStatus} |
| Primary in H1 | ${searchlight.primaryInH1Count}x | ${searchlight.primaryInH1Count >= 2 ? 'OK' : 'NEED 2x'} |
| Content Length | ${searchlight.charCount}자 | ${searchlight.charCount >= 2500 && searchlight.charCount <= 4500 ? 'OK' : 'OUT OF RANGE'} |`
}

function buildIssuesSummary(analysis) {
  const allIssues = [
    ...analysis.meta.issues,
    ...analysis.headings.issues,
    ...analysis.content.issues,
    ...analysis.images.issues,
    ...analysis.geo.issues,
    ...(analysis.searchlight ? analysis.searchlight.issues : []),
  ]

  const critical = allIssues.filter(i => i.severity === 'critical')
  const high = allIssues.filter(i => i.severity === 'high')
  const medium = allIssues.filter(i => i.severity === 'medium')
  const low = allIssues.filter(i => i.severity === 'low')

  const formatIssues = (issues, label) => {
    if (issues.length === 0) return ''
    return `### ${label}\n\n${issues.map(i => `- ${i.message}`).join('\n')}`
  }

  return `## Issues Found

| Severity | Count |
|----------|-------|
| Critical | ${critical.length} |
| High | ${high.length} |
| Medium | ${medium.length} |
| Low | ${low.length} |

${formatIssues(critical, 'Critical (Fix Immediately)')}

${formatIssues(high, 'High Priority')}

${formatIssues(medium, 'Medium Priority')}

${formatIssues(low, 'Low Priority')}`
}

function buildChecklist(analysis, config) {
  const items = []

  // SEO
  if (analysis.meta.issues.length > 0) items.push('- [ ] Meta tags optimized')
  if (analysis.headings.h1Count !== 1) items.push('- [ ] H1 tag fixed (single H1)')
  if (analysis.headings.issues.length > 0) items.push('- [ ] Heading hierarchy corrected')
  items.push('- [ ] Keyword density in 1-2% range')
  if (analysis.images.issues.length > 0) items.push('- [ ] Image alt text added')

  // GEO
  if (analysis.geo.citableBlocks < 3) items.push('- [ ] Citability blocks added (134-167 words)')
  if (analysis.geo.questionHeadingCount === 0) items.push('- [ ] Question-based headings added')
  if (analysis.geo.definitionCount === 0) items.push('- [ ] Definition patterns added')
  if (analysis.geo.statisticCount < 2) items.push('- [ ] Statistics/sources added')

  // Schema
  if (!analysis.schema.hasSchema) items.push('- [ ] Schema.org JSON-LD added')

  return `## Implementation Checklist

${items.join('\n')}`
}

function scoreEmoji(score) {
  if (score >= 80) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

function truncate(text, maxLen) {
  if (!text) return '-'
  return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text
}

function lengthStatus(len, min, max) {
  if (len === 0) return 'MISSING'
  if (len >= min && len <= max) return 'OK'
  if (len < min) return 'TOO SHORT'
  return 'TOO LONG'
}
