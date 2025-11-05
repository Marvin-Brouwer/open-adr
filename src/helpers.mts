export type ValidatedUrl = [url: URL, error: undefined]
export type FaultyUrl = [url: undefined, error: Error]

export function validateUrl(url?: string): ValidatedUrl | FaultyUrl {
	try {
		// Fall through empty string for errors
		return [new URL(url!), undefined]
	}
	catch (error) {
		return [undefined, error as Error]
	}
}
