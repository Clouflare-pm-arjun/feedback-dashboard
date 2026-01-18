import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import type { StatsResponse, CategoryStats, DailyStats, ProcessedFeedback } from '@/types/feedback';

/**
 * GET /api/stats
 * Calculate aggregated statistics for charts
 */
export async function GET() {
	try {
		const { env } = getCloudflareContext();

		if (!env.FEEDBACK_STORAGE) {
			return NextResponse.json<StatsResponse>(
				{
					success: false,
					categories: [],
					daily: [],
					error: 'R2 bucket binding not available',
				},
				{ status: 500 }
			);
		}

		// List all objects in the R2 bucket
		const listResult = await env.FEEDBACK_STORAGE.list();
		
		if (!listResult.objects || listResult.objects.length === 0) {
			return NextResponse.json<StatsResponse>({
				success: true,
				categories: [],
				daily: [],
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

		// Calculate category distribution (from themes)
		const categoryMap = new Map<string, number>();
		let totalCategoryCount = 0;

		for (const feedback of feedbacks) {
			if (feedback.extracted && feedback.extracted.themes) {
				for (const theme of feedback.extracted.themes) {
					const count = categoryMap.get(theme) || 0;
					categoryMap.set(theme, count + 1);
					totalCategoryCount++;
				}
			}
		}

		const categories: CategoryStats[] = Array.from(categoryMap.entries())
			.map(([category, count]) => ({
				category,
				count,
				percentage: totalCategoryCount > 0 ? (count / totalCategoryCount) * 100 : 0,
			}))
			.sort((a, b) => b.count - a.count);

		// Calculate daily distribution
		const dailyMap = new Map<string, number>();

		for (const feedback of feedbacks) {
			const date = new Date(feedback.created_at * 1000);
			const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
			const count = dailyMap.get(dateStr) || 0;
			dailyMap.set(dateStr, count + 1);
		}

		const daily: DailyStats[] = Array.from(dailyMap.entries())
			.map(([date, count]) => ({
				date,
				count,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));

		return NextResponse.json<StatsResponse>({
			success: true,
			categories,
			daily,
		});
	} catch (error) {
		console.error('Error calculating statistics:', error);
		return NextResponse.json<StatsResponse>(
			{
				success: false,
				categories: [],
				daily: [],
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
