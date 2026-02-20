import { parse } from 'node-html-parser'

/**
 * HTML 콘텐츠를 SEO/GEO 관점에서 분석합니다.
 * @param {string} html - 원본 HTML
 * @param {object} config - CLI 설정
 * @returns {object} 분석 결과
 */
export function analyzeHtml(html, config) {
  const root = parse(html)

  const meta = analyzeMeta(root)
  const headings = analyzeHeadings(root)
  const content = analyzeContent(root, config)
  const images = analyzeImages(root)
  const links = analyzeLinks(root)
  const schema = analyzeExistingSchema(root)
  const geo = analyzeGeoCitability(root)
  const lang = detectLanguage(root, config)

  const searchlight = analyzeSearchlightRules(root, content, meta)
  const scores = calculateScores({ meta, headings, content, images, links, schema, geo })

  return { meta, headings, content, images, links, schema, geo, lang, scores, keywords: content.keywords, searchlight }
}

function analyzeMeta(root) {
  const title = root.querySelector('title')?.text?.trim() || ''
  const descriptionEl = root.querySelector('meta[name="description"]')
  const description = descriptionEl?.getAttribute('content')?.trim() || ''
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
  const robots = root.querySelector('meta[name="robots"]')?.getAttribute('content') || ''
  const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
  const ogDescription = root.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
  const twitterCard = root.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || ''

  return {
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    twitterCard,
    issues: buildMetaIssues({ title, description, ogTitle, twitterCard }),
  }
}

function buildMetaIssues({ title, description, ogTitle, twitterCard }) {
  const issues = []

  if (!title) issues.push({ severity: 'critical', message: 'title 태그가 없습니다' })
  else if (title.length < 30) issues.push({ severity: 'high', message: `title이 너무 짧습니다 (${title.length}자, 권장: 50-60자)` })
  else if (title.length > 60) issues.push({ severity: 'medium', message: `title이 너무 깁니다 (${title.length}자, 권장: 50-60자)` })

  if (!description) issues.push({ severity: 'critical', message: 'meta description이 없습니다' })
  else if (description.length < 120) issues.push({ severity: 'high', message: `description이 너무 짧습니다 (${description.length}자, 권장: 150-160자)` })
  else if (description.length > 160) issues.push({ severity: 'medium', message: `description이 너무 깁니다 (${description.length}자, 권장: 150-160자)` })

  if (!ogTitle) issues.push({ severity: 'medium', message: 'Open Graph title이 없습니다' })
  if (!twitterCard) issues.push({ severity: 'low', message: 'Twitter Card 메타 태그가 없습니다' })

  return issues
}

function analyzeHeadings(root) {
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  const headings = []
  const issues = []

  for (const tag of headingTags) {
    const elements = root.querySelectorAll(tag)
    for (const el of elements) {
      headings.push({ tag, text: el.text.trim() })
    }
  }

  const h1Count = headings.filter(h => h.tag === 'h1').length
  if (h1Count === 0) issues.push({ severity: 'critical', message: 'H1 태그가 없습니다' })
  if (h1Count > 1) issues.push({ severity: 'high', message: `H1 태그가 ${h1Count}개입니다 (1개만 권장)` })

  // 계층 건너뜀 체크
  for (let i = 1; i < headings.length; i++) {
    const prevLevel = parseInt(headings[i - 1].tag[1])
    const currLevel = parseInt(headings[i].tag[1])
    if (currLevel > prevLevel + 1) {
      issues.push({
        severity: 'medium',
        message: `헤딩 계층 건너뜀: ${headings[i - 1].tag} → ${headings[i].tag} ("${headings[i].text}")`,
      })
    }
  }

  const questionHeadings = headings.filter(h => /[?？]/.test(h.text))

  return { list: headings, h1Count, questionHeadingCount: questionHeadings.length, issues }
}

function analyzeContent(root, config) {
  const body = root.querySelector('body')
  const textContent = body ? body.text : root.text
  const words = extractWords(textContent)
  const wordCount = words.length

  const paragraphs = root.querySelectorAll('p')
  const longParagraphs = []
  for (const p of paragraphs) {
    const pWords = extractWords(p.text)
    if (pWords.length > 150) {
      longParagraphs.push({ text: p.text.substring(0, 80) + '...', wordCount: pWords.length })
    }
  }

  const keywords = config.keywords.length > 0
    ? config.keywords
    : extractTopKeywords(textContent)

  const keywordAnalysis = keywords.map(keyword => {
    const density = calculateKeywordDensity(textContent, keyword)
    const inTitle = (root.querySelector('title')?.text || '').toLowerCase().includes(keyword.toLowerCase())
    const inH1 = root.querySelectorAll('h1').some(h => h.text.toLowerCase().includes(keyword.toLowerCase()))
    const first100Words = words.slice(0, 100).join(' ').toLowerCase()
    const inFirst100 = first100Words.includes(keyword.toLowerCase())
    const inH2 = root.querySelectorAll('h2').some(h => h.text.toLowerCase().includes(keyword.toLowerCase()))

    return { keyword, density, inTitle, inH1, inFirst100, inH2 }
  })

  const sentences = textContent.split(/[.!?。！？]\s+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.length > 0
    ? Math.round(sentences.reduce((sum, s) => sum + extractWords(s).length, 0) / sentences.length)
    : 0

  return {
    wordCount,
    paragraphCount: paragraphs.length,
    longParagraphs,
    keywords,
    keywordAnalysis,
    avgSentenceLength,
    issues: buildContentIssues({ wordCount, longParagraphs, avgSentenceLength, keywordAnalysis }),
  }
}

function buildContentIssues({ wordCount, longParagraphs, avgSentenceLength, keywordAnalysis }) {
  const issues = []

  if (wordCount < 300) issues.push({ severity: 'high', message: `콘텐츠가 너무 짧습니다 (${wordCount}단어)` })

  for (const lp of longParagraphs) {
    issues.push({ severity: 'medium', message: `긴 단락: ${lp.wordCount}단어 - "${lp.text}"` })
  }

  if (avgSentenceLength > 25) {
    issues.push({ severity: 'medium', message: `평균 문장 길이가 깁니다 (${avgSentenceLength}단어, 권장: 20 이하)` })
  }

  for (const ka of keywordAnalysis) {
    if (ka.density < 0.5) issues.push({ severity: 'high', message: `"${ka.keyword}" 밀도가 너무 낮습니다 (${ka.density}%)` })
    if (ka.density > 3) issues.push({ severity: 'high', message: `"${ka.keyword}" 키워드 스터핑 위험 (${ka.density}%)` })
    if (!ka.inTitle) issues.push({ severity: 'high', message: `"${ka.keyword}"가 title에 없습니다` })
    if (!ka.inH1) issues.push({ severity: 'high', message: `"${ka.keyword}"가 H1에 없습니다` })
    if (!ka.inFirst100) issues.push({ severity: 'medium', message: `"${ka.keyword}"가 첫 100단어에 없습니다` })
  }

  return issues
}

function analyzeImages(root) {
  const images = root.querySelectorAll('img')
  const results = []
  const issues = []

  for (const img of images) {
    const src = img.getAttribute('src') || ''
    const alt = img.getAttribute('alt') || ''
    const loading = img.getAttribute('loading') || ''

    results.push({ src, alt, loading })

    if (!alt) issues.push({ severity: 'high', message: `alt 속성 없음: ${src}` })
    if (!loading) issues.push({ severity: 'low', message: `loading="lazy" 없음: ${src}` })
  }

  return { list: results, count: images.length, issues }
}

function analyzeLinks(root) {
  const anchors = root.querySelectorAll('a')
  const internal = []
  const external = []

  for (const a of anchors) {
    const href = a.getAttribute('href') || ''
    const text = a.text.trim()

    if (href.startsWith('http://') || href.startsWith('https://')) {
      external.push({ href, text })
    } else if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      internal.push({ href, text })
    }
  }

  return { internal, external, internalCount: internal.length, externalCount: external.length }
}

function analyzeExistingSchema(root) {
  const scripts = root.querySelectorAll('script[type="application/ld+json"]')
  const schemas = []

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.text)
      schemas.push(data)
    } catch {
      // invalid JSON-LD
    }
  }

  return { existing: schemas, hasSchema: schemas.length > 0 }
}

export function analyzeGeoCitability(root) {
  const body = root.querySelector('body')
  const sections = body ? body.querySelectorAll('section, article, [role="main"], main') : []

  let citableBlocks = 0
  let totalSections = 0
  const passages = []

  const containers = sections.length > 0 ? sections : [body || root]

  for (const section of containers) {
    const paragraphs = section.querySelectorAll('p')
    let sectionText = ''

    for (const p of paragraphs) {
      sectionText += p.text + ' '
    }

    const words = extractWords(sectionText)
    totalSections++

    if (words.length >= 100 && words.length <= 200) {
      citableBlocks++
      passages.push({
        wordCount: words.length,
        preview: sectionText.substring(0, 100).trim() + '...',
        optimal: words.length >= 134 && words.length <= 167,
      })
    }
  }

  // 질문형 헤딩 체크
  const headings = root.querySelectorAll('h1, h2, h3')
  const questionHeadings = Array.from(headings).filter(h => /[?？]|무엇|어떻게|왜|언제|누가|what|how|why|when|who/i.test(h.text))

  // 직접 답변 패턴 체크 (첫 문장이 정의/답변)
  const definitionPatterns = body ? (body.text.match(/은\s|는\s|란\s|이란\s|means\s|refers\sto\s|is\sa\s|is\sthe\s/g) || []) : []

  // 통계/출처 인용 체크
  const statisticPatterns = body ? (body.text.match(/\d+%|\d+억|\d+만|\$[\d,]+|billion|million|according\sto|에\s따르면|기준/g) || []) : []

  const hasLists = root.querySelectorAll('ul, ol').length > 0
  const hasTables = root.querySelectorAll('table').length > 0

  return {
    citableBlocks,
    totalSections,
    passages,
    questionHeadingCount: questionHeadings.length,
    definitionCount: definitionPatterns.length,
    statisticCount: statisticPatterns.length,
    hasLists,
    hasTables,
    issues: buildGeoIssues({ citableBlocks, questionHeadings, definitionPatterns, statisticPatterns, hasLists, hasTables }),
  }
}

function buildGeoIssues({ citableBlocks, questionHeadings, definitionPatterns, statisticPatterns, hasLists, hasTables }) {
  const issues = []

  if (citableBlocks < 3) {
    issues.push({ severity: 'high', message: `Citability 블록이 부족합니다 (${citableBlocks}개, 권장: 3개 이상)` })
  }
  if (questionHeadings.length === 0) {
    issues.push({ severity: 'high', message: '질문형 헤딩이 없습니다 (AI 검색 인용에 중요)' })
  }
  if (definitionPatterns.length === 0) {
    issues.push({ severity: 'medium', message: '정의 패턴이 없습니다 ("X는 ~입니다" 형식 권장)' })
  }
  if (statisticPatterns.length < 2) {
    issues.push({ severity: 'medium', message: `통계/출처 인용이 부족합니다 (${statisticPatterns.length}개)` })
  }
  if (!hasLists) {
    issues.push({ severity: 'medium', message: '리스트(ul/ol)가 없습니다 (구조화된 정보 권장)' })
  }
  if (!hasTables) {
    issues.push({ severity: 'low', message: '비교 테이블이 없습니다 (데이터 구조화 권장)' })
  }

  return issues
}

function analyzeSearchlightRules(root, content, meta) {
  const bodyText = root.querySelector('body')?.text || root.text || ''
  const issues = []

  // Brand mixing detection
  const brandMentions = (bodyText.match(/서치라이트/g) || []).length
  const brandContextKeywords = ['AI 채용', '다이렉트 소싱', '숏리스트', '어프로치', '채용 솔루션']
  const hasBrandContext = brandContextKeywords.some(kw => bodyText.includes(kw))

  if (brandMentions > 0 && !hasBrandContext) {
    issues.push({
      severity: 'high',
      message: '"서치라이트" 사용 시 AI 채용/다이렉트 소싱/숏리스트/어프로치/채용 솔루션 중 1개 이상 동반 필요',
    })
  }

  // CTA detection
  const lastParagraphs = root.querySelectorAll('p')
  const lastPText = lastParagraphs.length > 0
    ? lastParagraphs[lastParagraphs.length - 1].text
    : ''
  const hasCta = /서치라이트|searchlight/i.test(lastPText)

  if (!hasCta && brandMentions > 0) {
    issues.push({
      severity: 'medium',
      message: '마지막 단락에 서치라이트 CTA가 없습니다',
    })
  }

  // Target audience detection
  const jobSeekerKeywords = ['연봉', '포트폴리오', '자기소개서', '취업 전략']
  const isJobSeekerContent = jobSeekerKeywords.some(kw => bodyText.includes(kw))
  const targetType = isJobSeekerContent ? '구직자' : '기업'

  // Slug generation
  const primaryKeyword = content.keywords[0] || ''
  const slug = generateSlug(primaryKeyword)

  // H1 primary keyword count (rule: 2 times in H1)
  const h1Elements = root.querySelectorAll('h1')
  const h1Text = h1Elements.map(el => el.text).join(' ')
  const primaryInH1Count = primaryKeyword
    ? (h1Text.toLowerCase().match(new RegExp(escapeRegex(primaryKeyword.toLowerCase()), 'g')) || []).length
    : 0

  if (primaryKeyword && primaryInH1Count < 2) {
    issues.push({
      severity: 'medium',
      message: `H1에 Primary 키워드("${primaryKeyword}")가 ${primaryInH1Count}회 포함 (권장: 2회)`,
    })
  }

  // Content length check (2500-4500 chars)
  const charCount = bodyText.replace(/\s+/g, '').length
  if (charCount < 2500) {
    issues.push({ severity: 'medium', message: `콘텐츠가 짧습니다 (${charCount}자, 권장: 2500-4500자)` })
  } else if (charCount > 4500) {
    issues.push({ severity: 'low', message: `콘텐츠가 깁니다 (${charCount}자, 권장: 2500-4500자)` })
  }

  // H1 length check (28 chars recommended, 35 max)
  const h1Text0 = h1Elements.length > 0 ? h1Elements[0].text.trim() : ''
  if (h1Text0.length > 35) {
    issues.push({ severity: 'high', message: `H1이 너무 깁니다 (${h1Text0.length}자, 최대: 35자)` })
  } else if (h1Text0.length > 28) {
    issues.push({ severity: 'low', message: `H1이 권장 길이를 초과합니다 (${h1Text0.length}자, 권장: 28자 이내)` })
  }

  return {
    brandMentions,
    hasBrandContext,
    brandMixingRisk: brandMentions > 0 && !hasBrandContext,
    hasCta,
    targetType,
    slug,
    primaryInH1Count,
    charCount,
    issues,
  }
}

function generateSlug(keyword) {
  if (!keyword) return ''

  const koToEn = {
    '다이렉트 소싱': 'direct-sourcing',
    'AI 채용': 'ai-recruiting',
    '채용 솔루션': 'recruiting-solution',
    '숏리스트': 'shortlist',
    '어프로치': 'approach',
    '채용': 'recruiting',
    '인재': 'talent',
    '면접': 'interview',
    '이력서': 'resume',
    '구인': 'hiring',
    '소싱': 'sourcing',
    '채용 속도': 'recruitment-speed',
    '개선': 'optimization',
    '전략': 'strategy',
    '가이드': 'guide',
    '방법': 'how-to',
    '비교': 'comparison',
  }

  let slug = keyword.toLowerCase().trim()

  // Try known Korean → English mappings
  for (const [ko, en] of Object.entries(koToEn)) {
    slug = slug.replace(new RegExp(escapeRegex(ko.toLowerCase()), 'g'), en)
  }

  // Remove remaining Korean characters
  slug = slug.replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')

  // Clean up
  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // Truncate to 60 chars
  if (slug.length > 60) {
    slug = slug.substring(0, 60).replace(/-$/, '')
  }

  return slug
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function calculateScores({ meta, headings, content, images, links, schema, geo }) {
  const seo = calculateSeoScore({ meta, headings, content, images, links, schema })
  const geoScore = calculateGeoScore(geo)
  const readability = calculateReadabilityScore(content)
  const overall = Math.round(seo * 0.4 + geoScore * 0.35 + readability * 0.25)

  return { seo, geo: geoScore, readability, overall }
}

function calculateSeoScore({ meta, headings, content, images, schema }) {
  let score = 100

  for (const issue of meta.issues) {
    if (issue.severity === 'critical') score -= 15
    else if (issue.severity === 'high') score -= 10
    else if (issue.severity === 'medium') score -= 5
    else score -= 2
  }

  for (const issue of headings.issues) {
    if (issue.severity === 'critical') score -= 15
    else if (issue.severity === 'high') score -= 10
    else if (issue.severity === 'medium') score -= 5
  }

  for (const issue of content.issues) {
    if (issue.severity === 'high') score -= 8
    else if (issue.severity === 'medium') score -= 4
  }

  for (const issue of images.issues) {
    if (issue.severity === 'high') score -= 5
    else score -= 2
  }

  if (!schema.hasSchema) score -= 10

  return Math.max(0, Math.min(100, score))
}

function calculateGeoScore(geo) {
  let score = 0

  // Citability 블록 (최대 30점)
  score += Math.min(30, geo.citableBlocks * 10)

  // 질문형 헤딩 (최대 20점)
  score += Math.min(20, geo.questionHeadingCount * 7)

  // 정의 패턴 (최대 15점)
  score += Math.min(15, geo.definitionCount * 5)

  // 통계/출처 (최대 15점)
  score += Math.min(15, geo.statisticCount * 3)

  // 리스트 (10점)
  if (geo.hasLists) score += 10

  // 테이블 (10점)
  if (geo.hasTables) score += 10

  return Math.min(100, score)
}

function calculateReadabilityScore(content) {
  let score = 100

  if (content.avgSentenceLength > 30) score -= 30
  else if (content.avgSentenceLength > 25) score -= 20
  else if (content.avgSentenceLength > 20) score -= 10

  if (content.longParagraphs.length > 0) {
    score -= Math.min(30, content.longParagraphs.length * 10)
  }

  if (content.wordCount < 300) score -= 20

  return Math.max(0, Math.min(100, score))
}

function extractWords(text) {
  return text
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
}

function calculateKeywordDensity(text, keyword) {
  const words = extractWords(text)
  if (words.length === 0) return 0

  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const matches = lowerText.split(lowerKeyword).length - 1

  return Number(((matches / words.length) * 100).toFixed(1))
}

function extractTopKeywords(text) {
  const words = extractWords(text.toLowerCase())
  const stopWordsKo = new Set(['의', '가', '이', '은', '는', '을', '를', '에', '와', '과', '도', '로', '에서', '으로', '한', '하는', '있는', '그', '이것', '저', '것', '수', '등', '및'])
  const stopWordsEn = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'its', 'it', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom'])

  const freq = new Map()
  for (const word of words) {
    if (word.length < 2 || stopWordsKo.has(word) || stopWordsEn.has(word)) continue
    freq.set(word, (freq.get(word) || 0) + 1)
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word)
}

function detectLanguage(root, config) {
  if (config.lang) return config.lang

  const htmlLang = root.querySelector('html')?.getAttribute('lang') || ''
  if (htmlLang) return htmlLang.split('-')[0]

  const text = root.text || ''
  const koreanChars = (text.match(/[가-힣]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length

  return koreanChars / totalChars > 0.3 ? 'ko' : 'en'
}
