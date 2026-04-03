import { assert, describe, test } from 'vitest'

import { applyMdSettings, mdSettingDefaults, type MdSettingsDefinition } from '../../src/settings.mts'

describe('applyMdSettings', () => {
	test('no config, defaults applied', () => {
		// ARRANGE
		const input: MdSettingsDefinition | undefined = undefined

		// ACT
		const result = applyMdSettings(input)

		// ASSERT
		assert.deepEqual(result, mdSettingDefaults)
	})

	test('include undefined, defaults applied', () => {
		// ARRANGE
		const input: MdSettingsDefinition = {
			include: undefined,
		}

		// ACT
		const result = applyMdSettings(input)

		// ASSERT
		assert.deepEqual(result, mdSettingDefaults)
	})

	test('allowedSchemas undefined, defaults applied', () => {
		// ARRANGE
		const input: MdSettingsDefinition = {
			allowedSchemas: undefined,
		}

		// ACT
		const result = applyMdSettings(input)

		// ASSERT
		assert.deepEqual(result, mdSettingDefaults)
	})

	test('include set, defaults appended', () => {
		// ARRANGE
		const input: MdSettingsDefinition = {
			include: ['updated value'],
		}

		// ACT
		const result = applyMdSettings(input)

		// ASSERT
		assert.deepEqual(result, {
			...mdSettingDefaults,
			include: ['updated value'],
		})
	})

	test('allowedSchemas set, defaults appended', () => {
		// ARRANGE
		const input: MdSettingsDefinition = {
			allowedSchemas: [],
		}

		// ACT
		const result = applyMdSettings(input)

		// ASSERT
		assert.deepEqual(result, {
			...mdSettingDefaults,
			allowedSchemas: [],
		})
	})
	test('all values set, all values used', () => {
		// ARRANGE
		const input: MdSettingsDefinition = {
			include: ['updated value'],
			allowedSchemas: [],
			schemas: { 'adr@1': '@md-schema/odr' },
		}

		// ACT
		const result = applyMdSettings(input)

		// ASSERT
		assert.deepEqual(result, input)
	})
})
