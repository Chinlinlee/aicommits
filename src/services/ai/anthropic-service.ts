import Anthropic from '@anthropic-ai/sdk';

import { AiService } from './ai-service.js';
import type { ValidConfig, CommitType } from '../../utils/config.js';
import type { StageDiff } from '../../utils/git.js';
import type { AiType } from './ai-service.js';
import { generatePrompt, getConventionalPrompt, getSummarizePrompt} from '../../utils/prompt.js';
import { KnownError } from '../../utils/error.js';

export class AnthropicService extends AiService {
	private anthropic: Anthropic;
	private chatCompletionRequest: Anthropic.Messages.MessageCreateParamsNonStreaming;
	constructor(config: ValidConfig, stage: StageDiff, aiType: AiType) {
		super(config, stage, aiType);
		this.anthropic = new Anthropic({
			apiKey: this.config.ANTHROPIC_KEY,
		});

		this.chatCompletionRequest = {
			model: this.config.ANTHROPIC_MODEL,
			max_tokens: this.config['max-tokens'],
			temperature: this.config['temperature'],
			messages: [
				{
					role: 'user',
					content: `Here is the diff:\n${this.stage!.diff}`
				}
			],
			system: getSummarizePrompt(this.config.locale, this.config['max-length'])
		};
	}

	async generateMessage(): Promise<string> {
		try {
			const result = await this.anthropic.messages.create(this.chatCompletionRequest);
			const completion = result.content[0].text;
			if (completion) {
				this.chatCompletionRequest.messages.push({
					role: 'assistant',
					content: completion
				});

				return this.sanitizeMessage(completion);
			}
			return '';
		} catch (error) {
			const errorAsAny = error as any;
			if (errorAsAny.code === 'ENOTFOUND') {
				throw new KnownError(
					`Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall})`
				);
			}
			throw errorAsAny;
		}
	}

	async generateConventionalCommitMessage(type: CommitType): Promise<string> {
		this.chatCompletionRequest.messages.push({
			role: 'user',
			content: getConventionalPrompt(type)
		});
		return await this.generateMessage();
	}
}
