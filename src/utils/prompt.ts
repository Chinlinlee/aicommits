import type { CommitType } from './config.js';
import { summarizeFileDiffTemplate } from '../prompt-templates/summarize-file-diff.js';

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
	conventional: `#### Part 1: Choose the Best Type\nChoose a type from the type-to-description JSON below that best describes the git diff, with a maximum of 100 words as title. Add two line breaks at the end and continue with a bullet-based body:\n\n\`\`\`json\n${JSON.stringify(
		{
			docs: 'Documentation only changes',
			style:
				'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
			refactor: 'A code change that neither fixes a bug nor adds a feature',
			perf: 'A code change that improves performance',
			test: 'Adding missing tests or correcting existing tests',
			build: 'Changes that affect the build system or external dependencies',
			ci: 'Changes to our CI configuration files and scripts',
			chore: "Other changes that don't modify src or test files",
			revert: 'Reverts a previous commit',
			feat: 'A new feature',
			fix: 'A bug fix',
		},
		null,
		2
	)}\n\`\`\``,
};

export const generatePrompt = (
	locale: string,
	maxLength: number,
	type: CommitType
) =>
	[
		'### Task: Summarize Git Diff with Commit Messages\n',
		'Whole content should within ' + maxLength + ' characters\n',
		commitTypes[type],
		specifyCommitFormat(type),
		'\n#### Part 2: Summarize Git Diff\n',
		summarizeFileDiffTemplate
	]
	.filter(Boolean)
	.join('\n')