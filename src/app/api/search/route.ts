import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import type { SearchResponse, SearchResult, ProcessedFeedback } from '@/types/feedback';

/**
 * POST /api/search
 * Search feedback using AutoRAG
 */
export async function POST(request: NextRequest) {
	try {
		const { env } = getCloudflareContext();

		if (!env.AI) {
			return NextResponse.json<SearchResponse>(
				{
					success: false,
					results: [],
					query: '',
					count: 0,
					error: 'AI Search binding not available',
				},
				{ status: 500 }
			);
		}

		const body = (await request.json()) as { query?: string; stream?: boolean };
		const query = body.query || '';
		const stream = body.stream ?? true; // Default to streaming

		if (!query || typeof query !== 'string') {
			return NextResponse.json<SearchResponse>(
				{
					success: false,
					results: [],
					query: '',
					count: 0,
					error: 'Query parameter is required',
				},
				{ status: 400 }
			);
		}

		// Call AI Search using aiSearch method with streaming enabled
		// When stream: true, aiSearch returns a Response (ReadableStream)
		// When stream: false, aiSearch returns AutoRagAiSearchResponse directly
		if (stream) {
			const streamResponse = await env.AI.autorag('feedback-ai-search').aiSearch({
				query,
				max_num_results: 50,
				rewrite_query: true,
				stream: true,
			});

			// Return the stream directly
			return new Response(streamResponse.body, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
				},
			});
		}

		// Non-streaming path (fallback)
		const searchData = await env.AI.autorag('feedback-ai-search').aiSearch({
			query,
			max_num_results: 50,
			rewrite_query: true,
			stream: false,
		});
		// Non-streaming path returns AutoRagAiSearchResponse with response field
		// For non-streaming, we don't update the feedback table, just return the response text
		return NextResponse.json<SearchResponse>({
			success: true,
			results: [],
			query,
			count: 0,
			response: 'response' in searchData ? searchData.response : '',
		});
	} catch (error) {
		console.error('Error searching feedback:', error);
		return NextResponse.json<SearchResponse>(
			{
				success: false,
				results: [],
				query: '',
				count: 0,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
