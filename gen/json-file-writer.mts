// json-file-writer.mts
import fs from 'node:fs/promises'
import path from 'node:path'

import { JSONSchemaAST } from './json-schema-builder.builder.mts'

/**
 * Options for the JSON file writer
 */
export interface FileWriterOptions {
	/**
	 * The base directory where files will be written
	 */
	baseDirectory: string

	/**
	 * Whether to erase the output directory before writing
	 * @default true
	 */
	eraseOutputDirectory: boolean
}

/**
 * Writes JSON schema files to disk
 */
export class JsonFileWriter {
	constructor(private readonly options: FileWriterOptions) {}

	/**
	 * Writes all schemas to their respective files
	 *
	 * @param schemas - Map of file paths to their JSON Schema AST
	 */
	async write(schemas: Map<string, JSONSchemaAST>): Promise<void> {
		const { baseDirectory, eraseOutputDirectory } = this.options

		// Erase output directory if option is enabled
		if (eraseOutputDirectory) {
			try {
				await fs.rm(baseDirectory, { recursive: true, force: true })
			}
			catch {
				// Ignore errors if directory doesn't exist
			}
		}

		// Write all schemas
		for (const [file, ast] of schemas.entries()) {
			const outPath = path.resolve(baseDirectory, file)
			await fs.mkdir(path.dirname(outPath), { recursive: true })
			await fs.writeFile(outPath, JSON.stringify(ast, undefined, '\t') + '\n', 'utf8')
		}
	}
}
