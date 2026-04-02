import { assert, describe, test } from 'vitest'

import { scan } from '../../../src/nodes/node-helper.mts'

import type { Literal, Parent } from 'unist'

describe('scan', () => {
	test('no children, no result', async () => {
		// ARRANGE
		const sut: Parent = {
			type: 'root',
			children: [

			],
		}

		// ACT
		const result = await scan<Literal>(sut, 'h1')

		// ASSERT
		assert.isEmpty(result)
	})

	test('1 matching element, 1 result', async () => {
		// ARRANGE
		const sut: Parent = {
			type: 'root',
			children: [
				{ type: 'h1', value: 'heading level one' } as Literal,
				{ type: 'p', value: 'some text' } as Literal,
			],
		}

		// ACT
		const result = await scan<Literal>(sut, 'h1')

		// ASSERT
		assert.equal(result.length, 1)
		assert.equal(result[0].type, 'h1')
	})

	test('4 matching elements, 4 result', async () => {
		// ARRANGE
		const sut: Parent = {
			type: 'root',
			children: [
				{ type: 'h1', value: 'heading level one' } as Literal,
				{ type: 'p', value: 'some text' } as Literal,
				{ type: 'h2', value: 'heading level two' } as Literal,
				{ type: 'p', value: 'some text' } as Literal,
				{ type: 'h2', value: 'heading level two' } as Literal,
				{ type: 'p', value: 'some text' } as Literal,
				{ type: 'h2', value: 'heading level two' } as Literal,
				{ type: 'p', value: 'some text' } as Literal,
				{ type: 'h2', value: 'heading level two' } as Literal,
				{ type: 'p', value: 'some text' } as Literal,
			],
		}

		// ACT
		const result = await scan<Literal>(sut, { type: 'h2' })

		// ASSERT
		assert.equal(result.length, 4)
	})
})
