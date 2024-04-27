import { AiService } from './ai-service.js';
import type { ValidConfig } from '../../utils/config.js';
import type { StageDiff } from '../../utils/git.js';
import type { AiType } from './ai-service.js';

export class AiServiceFactory {
	static create<T extends AiService>(
		className: {
			new (config: ValidConfig, stage: StageDiff, aiType: AiType): T;
		},
		config: ValidConfig,
		stage: StageDiff,
		aiType: AiType
	): T {
		return new className(config, stage, aiType);
	}
}
