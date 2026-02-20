#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, basename, dirname, extname } from 'node:path'
import { parseArgs } from 'node:util'
import { analyzeHtml } from './analyzer.js'
import { rewriteHtml } from './rewriter.js'
import { generateReport } from './reporter.js'

const HELP = `
seo-geo-rewriter - HTML 콘텐츠를 SEO/GEO 최적화하여 리라이팅합니다.

Usage:
  seo-rewrite <input.html> [options]

Options:
  -k, --keyword <keyword>   타겟 키워드 (쉼표 구분으로 복수 지정 가능)
  -s, --schema <type>       Schema.org 타입 (Article, Product, FAQPage, Organization, Service, LocalBusiness)
  -o, --output <path>       출력 파일 경로 (기본: <input>.optimized.html)
  -r, --report              SEO/GEO 리포트 생성 (기본: 활성)
  --no-report               리포트 생성 비활성화
  --no-schema               Schema.org JSON-LD 생성 비활성화
  --lang <lang>             콘텐츠 언어 (기본: auto-detect, ko/en)
  -h, --help                도움말

Examples:
  seo-rewrite article.html
  seo-rewrite article.html -k "프로젝트 관리,팀 협업"
  seo-rewrite product.html -s Product -k "무선 이어폰"
  seo-rewrite page.html -o output/optimized.html --lang ko
`

function parseCliArgs() {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: {
        keyword: { type: 'string', short: 'k' },
        schema: { type: 'string', short: 's' },
        output: { type: 'string', short: 'o' },
        report: { type: 'boolean', short: 'r', default: true },
        'no-report': { type: 'boolean', default: false },
        'no-schema': { type: 'boolean', default: false },
        lang: { type: 'string', default: '' },
        help: { type: 'boolean', short: 'h', default: false },
      },
    })

    if (values.help || positionals.length === 0) {
      console.log(HELP)
      process.exit(0)
    }

    const inputPath = resolve(positionals[0])
    const ext = extname(inputPath)
    const base = basename(inputPath, ext)
    const dir = dirname(inputPath)

    return {
      inputPath,
      keywords: values.keyword ? values.keyword.split(',').map(k => k.trim()) : [],
      schemaType: values.schema || '',
      outputPath: values.output ? resolve(values.output) : resolve(dir, `${base}.optimized${ext}`),
      reportPath: resolve(dir, `${base}.seo-report.md`),
      generateReport: !values['no-report'],
      generateSchema: !values['no-schema'],
      lang: values.lang,
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
    console.log(HELP)
    process.exit(1)
  }
}

async function main() {
  const config = parseCliArgs()

  console.log(`\n[1/4] Reading: ${config.inputPath}`)
  const html = await readFile(config.inputPath, 'utf-8')

  console.log('[2/4] Analyzing HTML...')
  const analysis = analyzeHtml(html, config)

  console.log('[3/4] Rewriting with SEO/GEO optimization...')
  const optimizedHtml = rewriteHtml(html, analysis, config)

  console.log(`[4/4] Writing output: ${config.outputPath}`)
  await writeFile(config.outputPath, optimizedHtml, 'utf-8')

  if (config.generateReport) {
    const report = generateReport(analysis, config)
    await writeFile(config.reportPath, report, 'utf-8')
    console.log(`Report: ${config.reportPath}`)
  }

  console.log('\nDone! SEO/GEO optimization complete.')
  printScoreSummary(analysis)
}

function printScoreSummary(analysis) {
  const { scores } = analysis
  console.log('\n--- Score Summary ---')
  console.log(`SEO Score:        ${scores.seo}/100`)
  console.log(`GEO Citability:   ${scores.geo}/100`)
  console.log(`Readability:      ${scores.readability}/100`)
  console.log(`Overall:          ${scores.overall}/100`)
}

main().catch(error => {
  console.error(`Fatal error: ${error.message}`)
  process.exit(1)
})
