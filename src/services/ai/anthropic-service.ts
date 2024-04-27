import Anthropic from '@anthropic-ai/sdk';

import { AiService } from './ai-service.js';
import type { ValidConfig } from '../../utils/config.js';
import type { StageDiff } from '../../utils/git.js';
import type { AiType } from './ai-service.js';
import { generatePrompt } from '../../utils/prompt.js';
import { KnownError } from '../../utils/error.js';

export class AnthropicService extends AiService {
	private anthropic: Anthropic;

	constructor(config: ValidConfig, stage: StageDiff, aiType: AiType) {
		super(config, stage, aiType);
		this.anthropic = new Anthropic({
			apiKey: this.config.ANTHROPIC_KEY,
		});
	}

	async generateCommitMessage(): Promise<string[]> {
		try {
			const diff = this.stage?.diff!;

			const { locale, type } = this.config;
			const maxLength = this.config['max-length'];
			const prompt = generatePrompt(locale, maxLength, type);

			const result = await this.anthropic.messages.create({
				model: this.config.ANTHROPIC_MODEL,
				max_tokens: this.config['max-tokens'],
				temperature: this.config['temperature'],
				messages: [
					{
						role: 'user',
						content: `Here is the diff:\n${diff}`
					}
				],
				system: prompt
			});
			const completion = result.content[0].text;
			if (completion) {
				return [this.sanitizeMessage(completion)];
			}
			return [];
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
}
