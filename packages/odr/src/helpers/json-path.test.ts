import { describe, it, expect } from 'vitest'

import { trailJsonPath } from './json-path.mjs'

describe('trailJsonPath', () => {
	const data = {
		user: {
			name: 'Alice',
			posts: [
				{ title: 'Hello', tags: ['intro', 'welcome'] },
				{ title: 'World', tags: ['misc'] },
			],
		},
	}

	it('returns a trail from leaf to root', () => {
		const result = trailJsonPath<unknown>(data, '/user/posts[1]/title')

		expect(result).toEqual([
			'World', // leaf
			{ title: 'World', tags: ['misc'] }, // parent (post)
			data.user.posts, // posts array
			data.user, // user object
			data, // root
		])
	})

	it('returns root only for \'/\'', () => {
		const result = trailJsonPath<unknown>(data, '/')
		expect(result).toEqual([data])
	})

	it('returns empty array if the path is broken', () => {
		const result = trailJsonPath<unknown>(data, '/user/doesNotExist/foo')
		expect(result).toEqual([])
	})

	it('handles nested array access', () => {
		const result = trailJsonPath<unknown>(data, '/user/posts[0]/tags[1]')

		expect(result).toEqual([
			'welcome',
			data.user.posts[0].tags,
			data.user.posts[0],
			data.user.posts,
			data.user,
			data,
		])
	})
})
