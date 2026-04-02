export type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

interface JsonObject {
	[key: string]: JsonValue
}

/**
 * ## `trailJsonPath`
 *
 * Traverse the object using simple JSON path.
 * Only supports properties and indexers.
 * Returns a trail starting from the leaf back to the root.
 */
export function trailJsonPath<TOut>(object: unknown, path: string): (TOut | JsonPrimitive)[] {
	if (!path || path === '/') return [object as TOut]

	// parse path into segments: ["user","posts","1","title"]
	const parts = path
		.split('/')
		.filter(Boolean)
		.flatMap((part) => {
			if (!part.includes(']')) return [part]
			return part.split('[').map(sub => sub.replaceAll(']', ''))
		})

	let current: JsonValue | null | undefined = object as JsonObject
	const trail: JsonValue[] = [current]

	for (const key of parts) {
		if (current === null || current === undefined) {
			return []
		}

		if (typeof current !== 'object') {
			return []
		}

		let next: JsonValue | undefined

		if (Array.isArray(current)) {
			const index = Number(key)
			if (Number.isNaN(index) || index < 0 || index >= current.length) {
				return []
			}
			next = current[index]
		}
		else {
			next = (current)[key]
			if (next === undefined) return []
		}

		current = next
		trail.push(current)
	}

	// built root -> leaf, return leaf -> root
	return trail.toReversed() as TOut[]
}
