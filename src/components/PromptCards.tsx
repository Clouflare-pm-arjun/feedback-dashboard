'use client';

interface PromptCard {
	id: string;
	prompt: string;
	shortcut: string;
}

const DEFAULT_PROMPTS: PromptCard[] = [
	{
		id: 'high-urgency-workers',
		prompt: 'Show me high-urgency feedback about Workers',
		shortcut: '/high-urgency-workers',
	},
	{
		id: 'negative-sentiment-week',
		prompt: 'Find negative sentiment feedback from the last week',
		shortcut: '/negative-week',
	},
	{
		id: 'common-themes',
		prompt: 'What are the most common themes in recent feedback?',
		shortcut: '/common-themes',
	},
	{
		id: 'performance-issues',
		prompt: 'Show feedback related to Performance issues',
		shortcut: '/performance',
	},
];

interface PromptCardsProps {
	onPromptClick: (prompt: string) => void;
}

export default function PromptCards({ onPromptClick }: PromptCardsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
			{DEFAULT_PROMPTS.map((card) => (
				<button
					key={card.id}
					onClick={() => onPromptClick(card.prompt)}
					className="p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
				>
					<div className="flex items-start gap-3">
						<div className="text-blue-500 group-hover:text-blue-600 dark:text-blue-400 mt-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
								<path
									fillRule="evenodd"
									d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="flex-1">
							<div className="text-xs text-blue-500 dark:text-blue-400 font-mono mb-1">
								{card.shortcut}
							</div>
							<div className="text-sm text-gray-700 dark:text-gray-300">
								{card.prompt}
							</div>
						</div>
					</div>
				</button>
			))}
		</div>
	);
}
