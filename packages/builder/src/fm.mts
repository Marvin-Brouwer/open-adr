export const FmKind: unique symbol = Symbol('fm-kind')

export interface FmStringDescriptor {
	readonly [FmKind]: 'string'
}

export interface FmNumberDescriptor {
	readonly [FmKind]: 'number'
}

export interface FmBooleanDescriptor {
	readonly [FmKind]: 'boolean'
}

export interface FmDateDescriptor {
	readonly [FmKind]: 'date'
}

export interface FmEnumOptions<T extends string = string> {
	readonly values: readonly T[]
	readonly message?: (values: readonly T[]) => string
}

export interface FmEnumDescriptor<T extends string = string> {
	readonly [FmKind]: 'enum'
	readonly values: readonly T[]
	readonly message?: (values: readonly T[]) => string
}

export interface FmListDescriptor {
	readonly [FmKind]: 'list'
	readonly item: FmItemDescriptor
}

export interface FmContributorsDescriptor {
	readonly [FmKind]: 'contributors'
}

export interface FmOptionalDescriptor {
	readonly [FmKind]: 'optional'
	readonly item: FmItemDescriptor
}

export interface FmCustomContext {
	filePath: string
}

export interface FmCustomDescriptor {
	readonly [FmKind]: 'custom'
	readonly schema?: object
	readonly validate?: (value: unknown, context: FmCustomContext) => string | undefined
}

export interface FmObjectDescriptor {
	readonly [FmKind]: 'object'
	readonly properties: Readonly<Record<string, FmItemDescriptor>>
}

export type FmItemDescriptor
	= | FmStringDescriptor
	| FmNumberDescriptor
	| FmBooleanDescriptor
	| FmDateDescriptor
	| FmEnumDescriptor
	| FmListDescriptor
	| FmContributorsDescriptor
	| FmOptionalDescriptor
	| FmCustomDescriptor

export type FmDescriptor = FmItemDescriptor | FmObjectDescriptor

function fmEnum<T extends string>(...values: T[]): FmEnumDescriptor<T>
function fmEnum<T extends string>(options: FmEnumOptions<T>): FmEnumDescriptor<T>
function fmEnum<T extends string>(...values: [FmEnumOptions<T>] | T[]): FmEnumDescriptor<T> {
	const first = values[0]
	if (values.length === 1 && first !== null && typeof first === 'object' && 'values' in (first as object)) {
		const options = first
		return options.message === undefined
			? { [FmKind]: 'enum', values: options.values }
			: { [FmKind]: 'enum', values: options.values, message: options.message }
	}
	return { [FmKind]: 'enum', values: values as readonly T[] }
}

export const fm = {
	string(): FmStringDescriptor {
		return { [FmKind]: 'string' }
	},
	number(): FmNumberDescriptor {
		return { [FmKind]: 'number' }
	},
	boolean(): FmBooleanDescriptor {
		return { [FmKind]: 'boolean' }
	},
	date(): FmDateDescriptor {
		return { [FmKind]: 'date' }
	},
	enum: fmEnum,
	list(item: FmItemDescriptor): FmListDescriptor {
		return { [FmKind]: 'list', item }
	},
	contributors(): FmContributorsDescriptor {
		return { [FmKind]: 'contributors' }
	},
	optional(item: FmItemDescriptor): FmOptionalDescriptor {
		return { [FmKind]: 'optional', item }
	},
	custom(options: Pick<FmCustomDescriptor, 'schema' | 'validate'>): FmCustomDescriptor {
		return { [FmKind]: 'custom', ...options }
	},
	object(properties: Record<string, FmItemDescriptor>): FmObjectDescriptor {
		return { [FmKind]: 'object', properties }
	},
} as const

export interface FmSchemaOptions {
	contributorSlugs?: readonly string[]
}

export function compileFmSchema(descriptor: FmObjectDescriptor, options: FmSchemaOptions): object {
	const properties: Record<string, object> = {}
	for (const [key, value] of Object.entries(descriptor.properties)) {
		properties[key] = compileFmItemSchema(value, options)
	}
	const required = Object.entries(descriptor.properties)
		.filter(([, d]) => d[FmKind] !== 'optional')
		.map(([key]) => key)
	return {
		type: 'object',
		properties,
		required,
		additionalProperties: true,
	}
}

function compileFmItemSchema(descriptor: FmItemDescriptor, options: FmSchemaOptions): object {
	const kind = descriptor[FmKind]
	switch (kind) {
		case 'string': {
			return { type: 'string' }
		}
		case 'number': {
			return { type: 'number' }
		}
		case 'boolean': {
			return { type: 'boolean' }
		}
		case 'date': {
			return { type: 'string', format: 'date' }
		}
		case 'enum': {
			return { type: 'string', enum: (descriptor as FmEnumDescriptor).values }
		}
		case 'list': {
			return {
				type: 'array',
				items: compileFmItemSchema((descriptor).item, options),
			}
		}
		case 'contributors': {
			// Enum validation and custom error message are handled by a dedicated
			// validation pass in frontmatter-fields.mts; AJV only does the type check.
			return { type: 'array', items: { type: 'string' } }
		}
		case 'optional': {
			return compileFmItemSchema((descriptor).item, options)
		}
		case 'custom': {
			return (descriptor).schema ?? { type: 'string' }
		}
		default: {
			return {}
		}
	}
}
