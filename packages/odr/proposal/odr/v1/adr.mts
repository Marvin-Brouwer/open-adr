declare const document: any
declare const require: any



export const architectureDecisionRecord = document(
	nodes: [
	require('section[0]')({
		level: 1,
		match(node) {
			if (!node.name.startsWith('# `ADR` '))
				return 'An ADR should contain a main section, starting with "# `ADR` title"'
		}
	})
]
)