let readFile = () => Promise.reject<Buffer>(new Error('notMocked'))

const fsMock = { readFile }
Object.defineProperty(fsMock, 'readFile', {
	get() {
		return readFile
	},
	set(value: () => Promise<Buffer>) {
		readFile = value
	},
})

export default fsMock
