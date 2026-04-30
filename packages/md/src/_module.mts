export { applyMdSettings as mdSettings } from './settings.mts'
export type { Contributor, Contributors } from './settings.mts'

export { gitContributors } from './contributors/git-contributors.mts'

export { default as mdSchemaLoader } from './plugins/schema-loader.mts'
export { default as mdLinter } from './plugins/schema-linter.mts'
export { default as mdSchemaInfo } from './plugins/schema-hint-provider.mts'
export { default as mdSectionify } from './plugins/sectionify.mts'
export { default as mdUnSectionify } from './plugins/un-sectionify.mts'

export { default as preserveGithubAlerts } from './plugins/preserve-github-alerts.mts'
