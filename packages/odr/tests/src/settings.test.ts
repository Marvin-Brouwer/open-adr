import { assert, describe, test } from 'vitest'

import { applyOdrSettings, odrSettingDefaults, type OdrSettingsDefinition } from '../../src/settings.mts'

describe('applyOdrSettings', () => {
	test('no config, defaults applied', () => {
		// ARRANGE
		const input: OdrSettingsDefinition | undefined = undefined

		// ACT
		const result = applyOdrSettings(input)

		// ASSERT
		assert.deepEqual(result, odrSettingDefaults)
	})

	test('include undefined, defaults applied', () => {
		// ARRANGE
		const input: OdrSettingsDefinition = {
			include: undefined,
		}

		// ACT
		const result = applyOdrSettings(input)

		// ASSERT
		assert.deepEqual(result, odrSettingDefaults)
	})

	test('allowedSchemas undefined, defaults applied', () => {
		// ARRANGE
		const input: OdrSettingsDefinition = {
			allowedSchemas: undefined,
		}

		// ACT
		const result = applyOdrSettings(input)

		// ASSERT
		assert.deepEqual(result, odrSettingDefaults)
	})

	test('include set, defaults appended', () => {
		// ARRANGE
		const input: OdrSettingsDefinition = {
			include: ['updated value'],
		}

		// ACT
		const result = applyOdrSettings(input)

		// ASSERT
		assert.deepEqual(result, {
			...odrSettingDefaults,
			include: ['updated value'],
		})
	})

	test('allowedSchemas set, defaults appended', () => {
		// ARRANGE
		const input: OdrSettingsDefinition = {
			allowedSchemas: [],
		}

		// ACT
		const result = applyOdrSettings(input)

		// ASSERT
		assert.deepEqual(result, {
			...odrSettingDefaults,
			allowedSchemas: [],
		})
	})
	test('all values set, all values used', () => {
		// ARRANGE
		const input: OdrSettingsDefinition = {
			include: ['updated value'],
			allowedSchemas: [],
		}

		// ACT
		const result = applyOdrSettings(input)

		// ASSERT
		assert.deepEqual(result, input)
	})
})
