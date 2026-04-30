import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { Contributor, Contributors } from '../settings.mts'

const execFileAsync = promisify(execFile)

async function runGit(...arguments_: string[]): Promise<string> {
	const { stdout } = await execFileAsync('git', arguments_, { encoding: 'utf8' })
	return stdout.trim()
}

function extractGithubSlug(email: string): string | undefined {
	// Matches both "{slug}@users.noreply.github.com" and "{id}+{slug}@users.noreply.github.com"
	const match = /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/.exec(email)
	return match?.[1]
}

function slugifyName(fullName: string): string {
	return fullName
		.toLowerCase()
		.normalize('NFD')
		.replaceAll(/\p{Diacritic}/gu, '')
		.replaceAll(/[^\w\s-]/g, '')
		.replaceAll(/\s+/g, '-')
		.replaceAll(/-+/g, '-')
		.replaceAll(/^-|-$/g, '')
}

function normalizeGithubRemote(remoteUrl: string): string | undefined {
	// Matches https://github.com/org/repo(.git) and git@github.com:org/repo(.git)
	const httpsMatch = /github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/.exec(remoteUrl)
	if (httpsMatch) return `https://github.com/${httpsMatch[1]}/graphs/contributors`

	const sshMatch = /github\.com:([^/]+\/[^/]+?)(?:\.git)?$/.exec(remoteUrl)
	if (sshMatch) return `https://github.com/${sshMatch[1]}/graphs/contributors`

	return undefined
}

export async function gitContributors(): Promise<Contributors> {
	const [logOutput, remoteUrl] = await Promise.all([
		runGit('log', '--pretty=%aN|%aE', 'HEAD'),
		runGit('remote', 'get-url', 'origin').catch(() => ''),
	])

	const seen = new Set<string>()
	const who: Contributor[] = []

	for (const line of logOutput.split('\n')) {
		const separator = line.indexOf('|')
		if (separator === -1) continue

		const fullName = line.slice(0, separator).trim()
		const email = line.slice(separator + 1).trim()
		if (!fullName || !email) continue

		const githubSlug = extractGithubSlug(email)
		const slug = githubSlug ?? slugifyName(fullName)

		if (seen.has(slug)) continue
		seen.add(slug)

		who.push({
			slug,
			fullName,
			profileUrl: githubSlug
				? `https://github.com/${githubSlug}`
				: `mailto:${email}`,
		})
	}

	const source = normalizeGithubRemote(remoteUrl) ?? remoteUrl

	return { who, source: `git contributors found in the current repository: ${source}` }
}
