'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryStats } from '@/types/feedback';

interface CategoryPieChartProps {
	data: CategoryStats[];
}

const COLORS = [
	'#3B82F6', // blue
	'#10B981', // green
	'#F59E0B', // amber
	'#EF4444', // red
	'#8B5CF6', // purple
	'#EC4899', // pink
	'#06B6D4', // cyan
	'#84CC16', // lime
	'#F97316', // orange
	'#6366F1', // indigo
];

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
				No category data available
			</div>
		);
	}

	// Limit to top 10 categories for readability
	const displayData = data.slice(0, 10);

	interface TooltipProps {
		active?: boolean;
		payload?: Array<{
			name: string;
			value: number;
			payload: { category: string; percentage: number };
		}>;
	}

	const CustomTooltip = ({ active, payload }: TooltipProps) => {
		if (active && payload && payload.length) {
			const data = payload[0];
			return (
				<div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
					<p className="font-medium text-gray-900 dark:text-gray-100">
						{data.name}
					</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Count: <span className="font-medium">{data.value}</span>
					</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Percentage: <span className="font-medium">{data.payload.percentage.toFixed(1)}%</span>
					</p>
				</div>
			);
		}
		return null;
	};

	return (
		<div className="w-full h-64">
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={displayData}
						cx="50%"
						cy="50%"
						labelLine={false}
						label={({ category, percentage }) => `${category}: ${percentage.toFixed(0)}%`}
						outerRadius={80}
						fill="#8884d8"
						dataKey="count"
					>
						{displayData.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
						))}
					</Pie>
					<Tooltip content={<CustomTooltip />} />
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
