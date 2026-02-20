import { parse } from 'node-html-parser'

/**
 * 분석 결과를 바탕으로 HTML을 SEO/GEO 최적화 리라이팅합니다.
 * @param {string} html - 원본 HTML
 * @param {object} analysis - 분석 결과
 * @param {object} config - CLI 설정
 * @returns {string} 최적화된 HTML
 */
export function rewriteHtml(html, analysis, config) {
  const root = parse(html, { comment: true })

  optimizeHead(root, analysis, config)
  optimizeHeadings(root, analysis)
  optimizeImages(root)
  addCitabilityEnhancements(root, analysis)

  if (config.generateSchema) {
    addSchemaMarkup(root, analysis, config)
  }

  return root.toString()
}

function optimizeHead(root, analysis, config) {
  let head = root.querySelector('head')
  if (!head) {
    const html = root.querySelector('html')
    if (html) {
      html.insertAdjacentHTML('afterbegin', '<head></head>')
      head = root.querySelector('head')
    } else {
      return
    }
  }

  const { meta, content, lang } = analysis
  const primaryKeyword = content.keywords[0] || ''

  // Title 최적화
  if (!meta.title || meta.titleLength < 30 || meta.titleLength > 65) {
    const h1 = root.querySelector('h1')
    const h1Text = h1?.text?.trim() || primaryKeyword
    const newTitle = buildOptimizedTitle(h1Text, primaryKeyword, lang)

    const titleEl = root.querySelector('title')
    if (titleEl) {
      titleEl.set_content(newTitle)
    } else {
      head.insertAdjacentHTML('afterbegin', `<title>${escapeHtml(newTitle)}</title>`)
    }
  }

  // Meta description 최적화
  if (!meta.description || meta.descriptionLength < 120 || meta.descriptionLength > 165) {
    const bodyText = root.querySelector('body')?.text || root.text
    const newDescription = buildOptimizedDescription(bodyText, primaryKeyword, lang)
    const descEl = root.querySelector('meta[name="description"]')

    if (descEl) {
      descEl.setAttribute('content', newDescription)
    } else {
      head.insertAdjacentHTML('beforeend', `\n<meta name="description" content="${escapeAttr(newDescription)}">`)
    }
  }

  // Meta robots
  if (!meta.robots) {
    head.insertAdjacentHTML('beforeend', '\n<meta name="robots" content="index, follow">')
  }

  // Open Graph tags
  if (!meta.ogTitle) {
    const title = root.querySelector('title')?.text || ''
    head.insertAdjacentHTML('beforeend', `\n<meta property="og:title" content="${escapeAttr(title)}">`)
    head.insertAdjacentHTML('beforeend', `\n<meta property="og:type" content="article">`)
  }
  if (!meta.ogDescription) {
    const desc = root.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    head.insertAdjacentHTML('beforeend', `\n<meta property="og:description" content="${escapeAttr(desc)}">`)
  }

  // Twitter Card
  if (!meta.twitterCard) {
    const title = root.querySelector('title')?.text || ''
    const desc = root.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    head.insertAdjacentHTML('beforeend', '\n<meta name="twitter:card" content="summary_large_image">')
    head.insertAdjacentHTML('beforeend', `\n<meta name="twitter:title" content="${escapeAttr(title)}">`)
    head.insertAdjacentHTML('beforeend', `\n<meta name="twitter:description" content="${escapeAttr(desc)}">`)
  }
}

function buildOptimizedTitle(h1Text, keyword, lang) {
  let title = h1Text

  if (keyword && !title.toLowerCase().includes(keyword.toLowerCase())) {
    title = `${keyword} - ${title}`
  }

  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }

  return title
}

function buildOptimizedDescription(bodyText, keyword, lang) {
  const sentences = bodyText
    .replace(/\s+/g, ' ')
    .split(/[.!?。！？]\s+/)
    .filter(s => s.trim().length > 20)

  let description = ''

  // 키워드가 포함된 문장 우선
  if (keyword) {
    const keywordSentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase()))
    if (keywordSentence) {
      description = keywordSentence.trim()
    }
  }

  if (!description && sentences.length > 0) {
    description = sentences[0].trim()
  }

  if (description.length > 157) {
    description = description.substring(0, 155) + '...'
  } else if (description.length < 120 && sentences.length > 1) {
    description = (sentences[0] + '. ' + sentences[1]).trim()
    if (description.length > 157) {
      description = description.substring(0, 155) + '...'
    }
  }

  return description
}

function optimizeHeadings(root, analysis) {
  const { headings } = analysis

  // H1이 없으면 첫 번째 H2를 H1으로 승격
  if (headings.h1Count === 0) {
    const firstH2 = root.querySelector('h2')
    if (firstH2) {
      const text = firstH2.text
      firstH2.replaceWith(`<h1>${escapeHtml(text)}</h1>`)
    }
  }

  // H1이 여러 개면 두 번째부터 H2로 변경
  if (headings.h1Count > 1) {
    const h1s = root.querySelectorAll('h1')
    for (let i = 1; i < h1s.length; i++) {
      const text = h1s[i].text
      const attrs = extractAttributes(h1s[i])
      h1s[i].replaceWith(`<h2${attrs}>${escapeHtml(text)}</h2>`)
    }
  }
}

function optimizeImages(root) {
  const images = root.querySelectorAll('img')

  for (const img of images) {
    // loading="lazy" 추가
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy')
    }

    // alt 속성이 없으면 src에서 추출
    if (!img.getAttribute('alt')) {
      const src = img.getAttribute('src') || ''
      const filename = src.split('/').pop()?.split('.')[0] || ''
      const altText = filename.replace(/[-_]/g, ' ').trim()
      img.setAttribute('alt', altText || 'image')
    }
  }
}

function addCitabilityEnhancements(root, analysis) {
  const { geo, lang } = analysis

  // FAQ 섹션이 없고, 질문형 헤딩도 부족하면 FAQ placeholder 코멘트 추가
  if (geo.questionHeadingCount === 0) {
    const body = root.querySelector('body')
    if (body) {
      const faqComment = lang === 'ko'
        ? '<!-- SEO/GEO: 질문형 헤딩과 FAQ 섹션 추가를 권장합니다 -->'
        : '<!-- SEO/GEO: Consider adding question-based headings and FAQ section -->'
      body.insertAdjacentHTML('beforeend', `\n${faqComment}`)
    }
  }
}

function addSchemaMarkup(root, analysis, config) {
  const { schema } = analysis

  // 이미 Schema가 있으면 추가하지 않음
  if (schema.hasSchema) return

  const schemaType = config.schemaType || detectSchemaType(root, analysis)
  const schemaData = buildSchemaData(schemaType, root, analysis)

  if (!schemaData) return

  const head = root.querySelector('head')
  const target = head || root

  target.insertAdjacentHTML(
    'beforeend',
    `\n<script type="application/ld+json">\n${JSON.stringify(schemaData, null, 2)}\n</script>`
  )
}

function detectSchemaType(root, analysis) {
  const text = (root.text || '').toLowerCase()

  if (text.includes('가격') || text.includes('price') || text.includes('구매') || text.includes('buy')) {
    return 'Product'
  }
  if (text.includes('자주 묻는') || text.includes('faq') || text.includes('질문')) {
    return 'FAQPage'
  }
  if (text.includes('회사') || text.includes('about us') || text.includes('our company')) {
    return 'Organization'
  }

  return 'Article'
}

function buildSchemaData(type, root, analysis) {
  const title = root.querySelector('title')?.text || root.querySelector('h1')?.text || ''
  const description = root.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  const now = new Date().toISOString().split('T')[0]

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  switch (type) {
    case 'Article':
    case 'BlogPosting':
      return {
        ...baseSchema,
        '@type': type,
        headline: title.substring(0, 110),
        description,
        datePublished: now,
        dateModified: now,
        author: {
          '@type': 'Person',
          name: '[저자명을 입력하세요]',
        },
      }

    case 'Product':
      return {
        ...baseSchema,
        name: title,
        description,
      }

    case 'FAQPage': {
      const faqs = extractFaqFromContent(root)
      return {
        ...baseSchema,
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    }

    case 'Organization':
      return {
        ...baseSchema,
        name: title,
        description,
      }

    case 'Service':
      return {
        ...baseSchema,
        name: title,
        description,
      }

    case 'LocalBusiness':
      return {
        ...baseSchema,
        name: title,
        description,
      }

    default:
      return {
        ...baseSchema,
        '@type': 'Article',
        headline: title,
        description,
      }
  }
}

function extractFaqFromContent(root) {
  const faqs = []
  const headings = root.querySelectorAll('h2, h3')

  for (const heading of headings) {
    if (/[?？]/.test(heading.text)) {
      const question = heading.text.trim()
      let answer = ''
      let sibling = heading.nextElementSibling

      while (sibling && !['H1', 'H2', 'H3', 'H4'].includes(sibling.tagName)) {
        answer += sibling.text + ' '
        sibling = sibling.nextElementSibling
      }

      if (answer.trim()) {
        faqs.push({ question, answer: answer.trim() })
      }
    }
  }

  return faqs
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function extractAttributes(element) {
  const id = element.getAttribute('id')
  const cls = element.getAttribute('class')
  let attrs = ''
  if (id) attrs += ` id="${escapeAttr(id)}"`
  if (cls) attrs += ` class="${escapeAttr(cls)}"`
  return attrs
}
