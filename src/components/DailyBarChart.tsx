'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyStats } from '@/types/feedback';

interface DailyBarChartProps {
	data: DailyStats[];
}

export default function DailyBarChart({ data }: DailyBarChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
				No daily data available
			</div>
		);
	}

	interface TooltipProps {
		active?: boolean;
		payload?: Array<{ value: number }>;
		label?: string;
	}

	const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
					<p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
						{label}
					</p>
					<p className="text-sm text-blue-600 dark:text-blue-400">
						Feedback: <span className="font-medium">{payload[0].value}</span>
					</p>
				</div>
			);
		}
		return null;
	};

	// Format date for display (MM/DD/YYYY)
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	};

	// Calculate max count for Y-axis domain
	const maxCount = Math.max(...data.map(d => d.count), 1);
	// Generate Y-axis ticks with step of 1
	const yAxisTicks = Array.from({ length: maxCount + 1 }, (_, i) => i);

	return (
		<div className="w-full h-64 -mx-2">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
					<XAxis
						dataKey="date"
						tickFormatter={formatDate}
						stroke="#6b7280"
						style={{ fontSize: '11px' }}
						angle={-45}
						textAnchor="end"
						height={50}
					/>
					<YAxis 
						stroke="#6b7280" 
						style={{ fontSize: '12px' }}
						domain={[0, maxCount]}
						ticks={yAxisTicks}
						allowDecimals={false}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
