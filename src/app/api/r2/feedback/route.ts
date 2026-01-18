import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import type { ProcessedFeedback, FeedbackListResponse } from '@/types/feedback';

/**
 * GET /api/r2/feedback
 * Fetch all feedback from R2 bucket
 */
export async function GET() {
	try {
		const { env } = getCloudflareContext();
		
		if (!env.FEEDBACK_STORAGE) {
			return NextResponse.json<FeedbackListResponse>(
				{
					success: false,
					data: [],
					count: 0,
					error: 'R2 bucket binding not available',
				},
				{ status: 500 }
			);
		}

		// List all objects in the R2 bucket
		const listResult = await env.FEEDBACK_STORAGE.list();
		
		if (!listResult.objects || listResult.objects.length === 0) {
			return NextResponse.json<FeedbackListResponse>({
				success: true,
				data: [],
				count: 0,
			});
		}

		// Fetch and parse all feedback files
		const feedbackPromises = listResult.objects
			.filter(obj => obj.key.startsWith('feedback-') && obj.key.endsWith('.json'))
			.map(async (obj) => {
				try {
					const object = await env.FEEDBACK_STORAGE.get(obj.key);
					if (!object) return null;
					
					const text = await object.text();
					const feedback = JSON.parse(text) as ProcessedFeedback;
					return feedback;
				} catch (error) {
					console.error(`Error parsing feedback file ${obj.key}:`, error);
					return null;
				}
			});

		const feedbackResults = await Promise.all(feedbackPromises);
		const feedbacks = feedbackResults.filter((f): f is ProcessedFeedback => f !== null);

		// Sort by created_at descending (newest first)
		feedbacks.sort((a, b) => b.created_at - a.created_at);

		return NextResponse.json<FeedbackListResponse>({
			success: true,
			data: feedbacks,
			count: feedbacks.length,
		});
	} catch (error) {
		console.error('Error fetching feedback from R2:', error);
		return NextResponse.json<FeedbackListResponse>(
			{
				success: false,
				data: [],
				count: 0,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
