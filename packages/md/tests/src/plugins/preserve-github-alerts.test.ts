import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { assert, describe, test } from 'vitest'

import preserveGithubAlerts from '../../../src/plugins/preserve-github-alerts.mts'

describe('preserveGithubAlerts', () => {
	const processor = unified()
		.use(remarkParse)
		.use(preserveGithubAlerts)
		.use(remarkStringify)

	test('preserves [!NOTE] alert syntax', async () => {
		const input = '> [!NOTE]\n> Some important note'
		const result = await processor.process(input)
		const output = String(result)

		assert.include(output, '[!NOTE]')
		assert.notInclude(output, String.raw`\[!NOTE]`)
	})

	test('preserves [!WARNING] alert syntax', async () => {
		const input = '> [!WARNING]\n> Be careful here'
		const result = await processor.process(input)
		const output = String(result)

		assert.include(output, '[!WARNING]')
		assert.notInclude(output, String.raw`\[!WARNING]`)
	})

	test('preserves [!TIP] alert syntax', async () => {
		const input = '> [!TIP]\n> A helpful tip'
		const result = await processor.process(input)
		const output = String(result)

		assert.include(output, '[!TIP]')
	})

	test('preserves [!IMPORTANT] alert syntax', async () => {
		const input = '> [!IMPORTANT]\n> Key information'
		const result = await processor.process(input)
		const output = String(result)

		assert.include(output, '[!IMPORTANT]')
	})

	test('preserves [!CAUTION] alert syntax', async () => {
		const input = '> [!CAUTION]\n> Dangerous action'
		const result = await processor.process(input)
		const output = String(result)

		assert.include(output, '[!CAUTION]')
	})

	test('does not affect regular blockquotes', async () => {
		const input = '> Just a regular blockquote'
		const result = await processor.process(input)
		const output = String(result)

		assert.include(output, '> Just a regular blockquote')
	})
})
