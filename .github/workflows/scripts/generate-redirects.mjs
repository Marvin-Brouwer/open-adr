// @ts-check
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(fileURLToPath(import.meta.url), '..', '..', '..', '..')
const configPath = path.join(ROOT, 'redirects.yml')
const outDirectory = path.join(ROOT, '_site')

/** @param {string} content */
function parseRedirects(content) {
	/** @type {Record<string, string>} */
	const redirects = {}
	for (const line of content.split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const match = trimmed.match(/^(\S+?):\s+['"]?(.+?)['"]?\s*$/)
		if (match) redirects[match[1]] = match[2]
	}
	return redirects
}

const redirects = parseRedirects(readFileSync(configPath, 'utf8'))

mkdirSync(outDirectory, { recursive: true })

/** @param {string} targetUrl @param {string} title */
function makeRedirectHtml(targetUrl, title) {
	const hashIndex = targetUrl.indexOf('#')
	const baseUrl = hashIndex === -1 ? targetUrl : targetUrl.slice(0, hashIndex)
	const defaultHash = hashIndex === -1 ? '' : targetUrl.slice(hashIndex)
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script>
(function () {
  var base = ${JSON.stringify(baseUrl)};
  var defaultHash = ${JSON.stringify(defaultHash)};
  var hash = window.location.hash || defaultHash;
  window.location.replace(base + hash);
})();
</script>
<noscript>
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
</noscript>
</head>
<body>
<p>Redirecting to <a href="${targetUrl}">${targetUrl}</a>\u2026</p>
</body>
</html>`
}

// Root (index) page — redirect if configured, otherwise emit a listing
const indexUrl = redirects['index']
if (indexUrl) {
	writeFileSync(path.join(outDirectory, 'index.html'), makeRedirectHtml(indexUrl, 'Redirecting\u2026'))
}
else {
	const slugs = Object.keys(redirects).filter(k => k !== '404')
	const listItems = slugs
		.map(slug => `  <li><a href="./${slug}/">${slug}</a> &rarr; <a href="${redirects[slug]}">${redirects[slug]}</a></li>`)
		.join('\n')
	writeFileSync(
		path.join(outDirectory, 'index.html'),
		`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>md-schema redirects</title></head>
<body>
<h1>md-schema redirects</h1>
<ul>
${listItems}
</ul>
</body>
</html>
`,
	)
}

// 404 page — redirect if configured
const notFoundUrl = redirects['404']
if (notFoundUrl) {
	writeFileSync(path.join(outDirectory, '404.html'), makeRedirectHtml(notFoundUrl, 'Page not found'))
}

// Per-slug redirect pages (skip reserved keys)
const RESERVED = new Set(['index', '404'])
for (const [slug, targetUrl] of Object.entries(redirects)) {
	if (RESERVED.has(slug)) continue
	const slugDirectory = path.join(outDirectory, slug)
	mkdirSync(slugDirectory, { recursive: true })
	writeFileSync(path.join(slugDirectory, 'index.html'), makeRedirectHtml(targetUrl, 'Redirecting\u2026'))
}

const slugCount = Object.keys(redirects).filter(k => !RESERVED.has(k)).length

// eslint-disable-next-line no-undef
console.log(
	`Generated ${slugCount} slug redirect(s) in _site`,
)
