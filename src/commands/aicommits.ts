import { execa } from 'execa';
import { black, dim, green, red, bgCyan, lightYellow } from 'kolorist';
import {
	intro,
	outro,
	spinner,
	select,
	confirm,
	isCancel,
} from '@clack/prompts';
import {
	assertGitRepo,
	getStagedDiff,
	getDetectedMessage,
	StageDiff,
} from '../utils/git.js';
import { getConfig } from '../utils/config.js';
import type { ValidConfig } from '../utils/config.js';
import { generateCommitMessage } from '../utils/openai.js';
import { KnownError, handleCliError } from '../utils/error.js';
import { generatePrompt } from '../utils/prompt.js';
import { AiService, AiType, AiTypes } from '../services/ai/ai-service.js';
import { AiServiceFactory } from '../services/ai/ai-service-factory.js';
import { OpenAiService } from '../services/ai/openai-service.js';
import { AnthropicService } from '../services/ai/anthropic-service.js';

const AI_SERVICE_MAPPING = {
	openai: OpenAiService as new (config: ValidConfig, stage: StageDiff, aiType: AiType) => AiService,
	anthropic: AnthropicService as new (config: ValidConfig, stage: StageDiff, aiType: AiType) => AiService
};

function validateAiType(config: ValidConfig) {
	let userAiTypeName = config.AI_SOURCE;
	let aiType = AiTypes.find((t) => t.name === userAiTypeName);
	if (!aiType) {
		throw new KnownError('You are setting the ai source to ' + config.AI_SOURCE + ' but key is empty');
	}

	return aiType;
}

export default async (
	excludeFiles: string[],
	stageAll: boolean,
	commitType: string | undefined,
	promptOnly: boolean,
	rawArgv: string[]
) =>
	(async () => {
		intro(bgCyan(black(' aicommits ')));
		await assertGitRepo();

		const detectingFiles = spinner();

		if (stageAll) {
			// This should be equivalent behavior to `git commit --all`
			await execa('git', ['add', '--update']);
		}

		detectingFiles.start('Detecting staged files');
		const staged = await getStagedDiff(excludeFiles);

		if (!staged) {
			detectingFiles.stop('Detecting staged files');
			throw new KnownError(
				'No staged changes found. Stage your changes manually, or automatically stage all changes with the `--all` flag.'
			);
		}

		detectingFiles.stop(
			`${getDetectedMessage(staged.files)}:\n${staged.files
				.map((file) => `     ${file}`)
				.join('\n')}`
		);
		
		const { env } = process;
		const config = await getConfig({
			OPENAI_KEY: env.OPENAI_KEY || env.OPENAI_API_KEY,
			proxy:
			env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY,
			type: commitType?.toString(),
		});

		let aiType = validateAiType(config);
		
		if (promptOnly) {
			let systemPrompt = generatePrompt('en', config['max-length'], 'conventional');
			outro(`${green('→')}  System prompt:\n ${lightYellow(systemPrompt)}`);
			outro(`${green('→')}  User prompt:\n ${lightYellow(staged.diff)}`)
			return;
		}

		const s = spinner();
		s.start('The AI is analyzing your changes');
		let messages: string[];
		try {
			let aiService = AiServiceFactory.create(
				AI_SERVICE_MAPPING[aiType.name],
				config,
				staged,
				aiType
			);
			messages = await aiService.generateCommitMessage();
		} finally {
			s.stop('Changes analyzed');
		}

		if (messages.length === 0) {
			throw new KnownError('No commit messages were generated. Try again.');
		}

		let message: string;
		[message] = messages;
		const confirmed = await confirm({
			message: `Use this commit message?\n\n   ${message}\n`,
		});

		if (!confirmed || isCancel(confirmed)) {
			outro('Commit cancelled');
			return;
		}
		// else {
		// 	const selected = await select({
		// 		message: `Pick a commit message to use: ${dim('(Ctrl+c to exit)')}`,
		// 		options: messages.map((value) => ({ label: value, value })),
		// 	});

		// 	if (isCancel(selected)) {
		// 		outro('Commit cancelled');
		// 		return;
		// 	}

		// 	message = selected as string;
		// }

		await execa('git', ['commit', '-m', message, ...rawArgv]);

		outro(`${green('✔')} Successfully committed!`);
	})().catch((error) => {
		outro(`${red('✖')} ${error.message}`);
		handleCliError(error);
		process.exit(1);
	});
