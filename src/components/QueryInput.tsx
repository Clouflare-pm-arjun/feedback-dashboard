'use client';

import { useState, FormEvent } from 'react';

interface QueryInputProps {
	onSearch: (query: string) => void;
	isLoading?: boolean;
}

export default function QueryInput({ onSearch, isLoading = false }: QueryInputProps) {
	const [query, setQuery] = useState('');

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (query.trim()) {
			onSearch(query.trim());
		}
	};

	return (
		<div className="w-full">
			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Ask anything. Type @ for mentions and / for shortcuts."
					className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					disabled={isLoading}
				/>
				<button
					type="submit"
					disabled={isLoading || !query.trim()}
					className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
				>
					{isLoading ? 'Searching...' : 'Search'}
				</button>
			</form>
		</div>
	);
}
