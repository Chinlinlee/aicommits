import https from 'https';
import type { ClientRequest, IncomingMessage } from 'http';
import createHttpsProxyAgent from 'https-proxy-agent';
import type {
	CreateChatCompletionRequest,
	CreateChatCompletionResponse,
} from 'openai';
import { KnownError } from '../../utils/error.js';
import { CommitType, type ValidConfig } from '../../utils/config.js';
import { type StageDiff } from '../../utils/git.js';
import { AiService, type AiType } from './ai-service.js';
import { generatePrompt, getConventionalPrompt } from '../../utils/prompt.js';

export class OpenAiService extends AiService {
	private chatCompletionRequest: CreateChatCompletionRequest;

	constructor(config: ValidConfig, stage: StageDiff, aiType: AiType) {
		super(config, stage, aiType);

		this.chatCompletionRequest = {
			model: this.config.model,
			messages: [
				{
					role: 'system',
					content: generatePrompt(
						this.config.locale,
						this.config['max-length'],
						this.config.type
					),
				},
				{
					role: 'user',
					content: this.stage?.diff,
				},
			],
			temperature: this.config['temperature'],
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			max_tokens: this.config['max-tokens'],
			stream: false,
			n: 1,
		};
	}

	async generateMessage(): Promise<string> {
		try {
			const completion = await this.#createChatCompletion(this.chatCompletionRequest);
			
			let notEmptyMessage = completion.choices
									.filter((choice) => choice.message?.content)
									.map((choice) =>
										this.sanitizeMessage(choice.message!.content! as string)
									);

			let message =  this.sanitizeMessage(notEmptyMessage.at(0) as string);
			this.chatCompletionRequest.messages.push({
				role: 'assistant',
				content: message
			});
			return message;
		} catch(e) {
			const errorAsAny = e as any;
			if (errorAsAny.code === 'ENOTFOUND') {
				throw new KnownError(
					`Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). Are you connected to the internet?`
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

	async #createChatCompletion(json: CreateChatCompletionRequest) {
		const { response, data } = await this.#httpsPost(
			'api.openai.com',
			'/v1/chat/completions',
			{
				Authorization: `Bearer ${this.config.OPENAI_KEY}`,
			},
			json,
			this.config?.timeout,
			this.config?.proxy
		);
		if (
			!response.statusCode ||
			response.statusCode < 200 ||
			response.statusCode > 299
		) {
			let errorMessage = `OpenAI API Error: ${response.statusCode} - ${response.statusMessage}`;

			if (data) {
				errorMessage += `\n\n${data}`;
			}

			if (response.statusCode === 500) {
				errorMessage += '\n\nCheck the API status: https://status.openai.com';
			}

			throw new KnownError(errorMessage);
		}

		return JSON.parse(data) as CreateChatCompletionResponse;
	}

	async #httpsPost(
		hostname: string,
		path: string,
		headers: Record<string, string>,
		json: unknown,
		timeout: number,
		proxy?: string
	) {
		return new Promise<{
			request: ClientRequest;
			response: IncomingMessage;
			data: string;
		}>((resolve, reject) => {
			const postContent = JSON.stringify(json);
			const request = https.request(
				{
					port: 443,
					hostname,
					path,
					method: 'POST',
					headers: {
						...headers,
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(postContent),
					},
					timeout,
					agent: proxy ? createHttpsProxyAgent(proxy) : undefined,
				},
				(response) => {
					const body: Buffer[] = [];
					response.on('data', (chunk) => body.push(chunk));
					response.on('end', () => {
						resolve({
							request,
							response,
							data: Buffer.concat(body).toString(),
						});
					});
				}
			);
			request.on('error', reject);
			request.on('timeout', () => {
				request.destroy();
				reject(
					new KnownError(
						`Time out error: request took over ${timeout}ms. Try increasing the \`timeout\` config, or checking the OpenAI API status https://status.openai.com`
					)
				);
			});

			request.write(postContent);
			request.end();
		});
	}
}
