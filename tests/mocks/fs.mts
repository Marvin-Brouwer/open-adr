let readFile = () => Promise.reject<Buffer>(new Error('notMocked'))

const fsMock = { readFile }
Object.defineProperty(fsMock, 'readFile', {
	get() {
		return readFile
	},
	set(value) {
		readFile = value
	},
})

export default fsMock
