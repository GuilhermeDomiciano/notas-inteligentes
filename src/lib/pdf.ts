import { chromium, Browser } from 'playwright'

export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>) {
  const browser = await chromium.launch()
  try { return await fn(browser) } finally { await browser.close() }
}

export async function renderPdfFromUrl(url: string, opts?: { format?: string; landscape?: boolean }) {
  return withBrowser(async (browser) => {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({
      format: opts?.format ?? 'A4',
      landscape: opts?.landscape ?? false,
      printBackground: true,
      preferCSSPageSize: true,
    })
    return Buffer.from(pdf)
  })
}

