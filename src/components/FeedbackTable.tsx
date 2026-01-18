'use client';

import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	ColumnDef,
	flexRender,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import type { ProcessedFeedback } from '@/types/feedback';

interface FeedbackTableProps {
	data: ProcessedFeedback[];
}

export default function FeedbackTable({ data }: FeedbackTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

	const columns = useMemo<ColumnDef<ProcessedFeedback>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				cell: (info) => (
					<div className="font-mono text-xs text-gray-600 dark:text-gray-400">
						{String(info.getValue())}
					</div>
				),
			},
			{
				accessorKey: 'title',
				header: 'Title',
				cell: (info) => (
					<div className="font-medium max-w-xs truncate">
						{info.getValue() as string || 'No title'}
					</div>
				),
			},
			{
				accessorKey: 'source',
				header: 'Source',
				cell: (info) => (
					<span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
						{info.getValue() as string}
					</span>
				),
			},
			{
				accessorKey: 'extracted.themes',
				header: 'Themes',
				cell: (info) => {
					const themes = info.row.original.extracted?.themes || [];
					return (
						<div className="flex flex-wrap gap-1">
							{themes.slice(0, 2).map((theme) => (
								<span
									key={theme}
									className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
								>
									{theme}
								</span>
							))}
							{themes.length > 2 && (
								<span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
									+{themes.length - 2}
								</span>
							)}
						</div>
					);
				},
			},
			{
				accessorKey: 'extracted.urgency',
				header: 'Urgency',
				cell: (info) => {
					const urgency = info.getValue() as string;
					const colors: Record<string, string> = {
						critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
						high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
						medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
						low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
					};
					return (
						<span
							className={`px-2 py-1 text-xs rounded capitalize ${colors[urgency] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
						>
							{urgency}
						</span>
					);
				},
			},
			{
				accessorKey: 'extracted.value',
				header: 'Value',
				cell: (info) => {
					const value = info.getValue() as number;
					return (
						<div className="font-medium text-gray-700 dark:text-gray-300">
							{value}/100
						</div>
					);
				},
			},
			{
				accessorKey: 'extracted.sentiment',
				header: 'Sentiment',
				cell: (info) => {
					const sentiment = info.getValue() as string;
					const colors: Record<string, string> = {
						positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
						neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
						negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
					};
					return (
						<span
							className={`px-2 py-1 text-xs rounded capitalize ${colors[sentiment] || 'bg-gray-100 text-gray-800'}`}
						>
							{sentiment}
						</span>
					);
				},
			},
			{
				accessorKey: 'created_at',
				header: 'Created',
				cell: (info) => {
					const timestamp = info.getValue() as number;
					const date = new Date(timestamp * 1000);
					return (
						<div className="text-xs text-gray-600 dark:text-gray-400">
							{date.toLocaleDateString()} {date.toLocaleTimeString()}
						</div>
					);
				},
			},
		],
		[]
	);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const toggleRow = (id: string) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedRows(newExpanded);
	};

	return (
		<div className="w-full overflow-x-auto">
			<table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr
							key={headerGroup.id}
							className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700"
						>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
									onClick={header.column.getToggleSortingHandler()}
								>
									<div className="flex items-center gap-2">
										{flexRender(header.column.columnDef.header, header.getContext())}
										{{
											asc: '↑',
											desc: '↓',
										}[header.column.getIsSorted() as string] ?? null}
									</div>
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => {
						const isExpanded = expandedRows.has(row.original.id);
						return (
							<>
								<tr
									key={row.id}
									className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
									onClick={() => toggleRow(row.original.id)}
								>
									{row.getVisibleCells().map((cell) => (
										<td
											key={cell.id}
											className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
								{isExpanded && (
									<tr className="bg-gray-50 dark:bg-gray-900">
										<td colSpan={columns.length} className="px-4 py-4">
											<div className="space-y-2">
												<div className="font-medium text-gray-700 dark:text-gray-300">
													Content:
												</div>
												<div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
													{row.original.content}
												</div>
												{row.original.extracted?.themes && row.original.extracted.themes.length > 0 && (
													<div className="mt-2">
														<div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
															All Themes:
														</div>
														<div className="flex flex-wrap gap-2">
															{row.original.extracted.themes.map((theme) => (
																<span
																	key={theme}
																	className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
																>
																	{theme}
																</span>
															))}
														</div>
													</div>
												)}
											</div>
										</td>
									</tr>
								)}
							</>
						);
					})}
				</tbody>
			</table>
			{data.length === 0 && (
				<div className="text-center py-8 text-gray-500 dark:text-gray-400">
					No feedback data available
				</div>
			)}
		</div>
	);
}
