import type { CommitType } from './config.js';
import { summarizeFileDiffTemplate } from '../prompt-templates/summarize-file-diff.js';
import { conventionalCommitTemplate } from '../prompt-templates/conventional.js';

const commitTypeFormats: Record<CommitType, string> = {
	'': '<commit message>',
	conventional: '<type>(<optional scope>): <commit message>',
};
const specifyCommitFormat = (type: CommitType) =>
	`The output response must be in format:\n${commitTypeFormats[type]}`;

const commitTypes: Record<CommitType, string> = {
	'': '',

	/**
	 * References:
	 * Commitlint:
	 * https://github.com/conventional-changelog/commitlint/blob/18fbed7ea86ac0ec9d5449b4979b762ec4305a92/%40commitlint/config-conventional/index.js#L40-L100
	 *
	 * Conventional Changelog:
	 * https://github.com/conventional-changelog/conventional-changelog/blob/d0e5d5926c8addba74bc962553dd8bcfba90e228/packages/conventional-changelog-conventionalcommits/writer-opts.js#L182-L193
	 */
	conventional: conventionalCommitTemplate,
};

export const generatePrompt = (
	locale: string,
	maxLength: number,
	type: CommitType
) =>
	[
		'### Task: Summarize Git Diff with Commit Messages\n',
		'- Message language: ' + locale,
		'- Whole content should within ' + maxLength + ' characters\n',
		'#### Summarize Git Diff\n',
		summarizeFileDiffTemplate
	]
	.filter(Boolean)
	.join('\n')

export const getSummarizePrompt = (locale: string, maxLength: number) =>
	[
		'### Task: Summarize Git Diff with Commit Messages\n',
		'- Message language: ' + locale,
		'- Whole content should within ' + maxLength + ' characters\n',
		'#### Summarize Git Diff\n',
		summarizeFileDiffTemplate
	]
	.filter(Boolean)
	.join('\n')

export const getConventionalPrompt = (type: CommitType) => commitTypes[type]