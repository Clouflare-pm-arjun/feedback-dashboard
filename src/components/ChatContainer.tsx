'use client';

import ReactMarkdown from 'react-markdown';

export interface ChatMessage {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	isStreaming?: boolean;
}

interface ChatContainerProps {
	messages: ChatMessage[];
	isStreaming?: boolean;
}

export default function ChatContainer({ messages, isStreaming = false }: ChatContainerProps) {
	return (
		<div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-4">
			<div className="space-y-4 max-h-96 overflow-y-auto">
				{messages.length === 0 ? (
					<div className="text-center text-gray-500 dark:text-gray-400 py-8">
						Start a conversation by searching or clicking a prompt
					</div>
				) : (
					messages.map((message) => {
						if (message.type === 'user') {
							return (
								<div key={message.id} className="flex items-start gap-3 justify-end">
									{message.isStreaming && (
										<div className="flex-shrink-0 mt-1">
											<div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
										</div>
									)}
									<div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
										<div className="font-medium">{message.content}</div>
									</div>
								</div>
							);
						} else {
							return (
								<div key={message.id} className="flex items-start gap-3">
									<div className="max-w-full text-left text-gray-900 dark:text-gray-100 prose prose-sm dark:prose-invert max-w-none">
										<ReactMarkdown
											components={{
												h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
												h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
												h3: ({ children }) => <h3 className="text-lg font-semibold mt-2 mb-1">{children}</h3>,
												p: ({ children }) => <p className="mb-2">{children}</p>,
												ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
												ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
												li: ({ children }) => <li className="ml-4">{children}</li>,
												code: ({ children, className }) => {
													const isInline = !className;
													return isInline ? (
														<code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
															{children}
														</code>
													) : (
														<code className={className}>{children}</code>
													);
												},
												strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
											}}
										>
											{message.content}
										</ReactMarkdown>
										{message.isStreaming && (
											<span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1 align-middle" />
										)}
									</div>
								</div>
							);
						}
					})
				)}
			</div>
		</div>
	);
}
