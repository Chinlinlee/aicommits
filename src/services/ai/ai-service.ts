import { ValidConfig } from '../../utils/config.js';
import { StageDiff } from '../../utils/git.js';

export const AI_TYPE = {
	OPEN_AI: {
		name: 'openai',
		keyName: 'OPENAI_KEY',
	},
	ANTHROPIC: {
		name: 'anthropic',
		keyName: 'ANTHROPIC_KEY',
	}
} as const;
export type AiType = (typeof AI_TYPE)[keyof typeof AI_TYPE];
export const AiTypes: AiType[] = Object.values(AI_TYPE).map((v) => v);

export abstract class AiService {
	protected config: ValidConfig;
	protected stage: StageDiff | undefined;
	protected aiType: AiType;

	protected constructor(
		config: ValidConfig,
		stage: StageDiff | undefined,
		aiType: AiType
	) {
		this.config = config;
		this.stage = stage;
		this.aiType = aiType;
	}

	abstract generateCommitMessage(): Promise<string[]>;

	protected sanitizeMessage(message: string) {
		return message
				.trim()
				.replace(/(\w)\.$/, '$1');
	}

	protected deduplicateMessages(array: string[]) {
		return Array.from(new Set(array));
	}
}
