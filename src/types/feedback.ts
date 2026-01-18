/**
 * Feedback interface matching the aggregator's Feedback structure
 */
export interface Feedback {
	id: string;
	source: 'support' | 'discord' | 'github' | 'email' | 'twitter' | 'forum';
	source_id?: string;
	title?: string;
	content: string;
	author?: string;
	author_email?: string;
	status?: 'pending' | 'processing' | 'processed';
	metadata?: Record<string, unknown>;
	created_at: number;
	updated_at: number;
}

/**
 * Processed feedback with extracted data
 */
export interface ProcessedFeedback extends Feedback {
	extracted: {
		themes: string[]; // Array of theme strings from predefined list
		urgency: 'low' | 'medium' | 'high' | 'critical';
		value: number; // Numeric score (0-100)
		sentiment: 'positive' | 'neutral' | 'negative';
	};
}

/**
 * API Response for R2 feedback list
 */
export interface FeedbackListResponse {
	success: boolean;
	data: ProcessedFeedback[];
	count: number;
	error?: string;
}

/**
 * AI Search result
 */
export interface SearchResult {
	id: string;
	score: number;
	feedback: ProcessedFeedback;
}

/**
 * API Response for search
 */
export interface SearchResponse {
	success: boolean;
	results: SearchResult[];
	query: string;
	count: number;
	response?: string; // For streaming/non-streaming AI response
	error?: string;
}

/**
 * Category statistics for pie chart
 */
export interface CategoryStats {
	category: string;
	count: number;
	percentage: number;
}

/**
 * Daily statistics for bar chart
 */
export interface DailyStats {
	date: string; // YYYY-MM-DD format
	count: number;
}

/**
 * API Response for statistics
 */
export interface StatsResponse {
	success: boolean;
	categories: CategoryStats[];
	daily: DailyStats[];
	error?: string;
}
