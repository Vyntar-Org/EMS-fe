import React, { useState } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	getPaginationRowModel,
} from '@tanstack/react-table';
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TablePagination,
	useTheme,
} from '@mui/material';
import { List } from 'react-window';
import ResponsiveTextWrapper from './ResponsiveTextWrapper';

export const CustomTable = ({
	data,
	columns,
	fillWidth = false,
	pageIndex: serverPageIndex,
	pageSize: serverPageSize,
	totalRowCount,
	onPageChange,
	onRowsPerPageChange,
}) => {
	const theme = useTheme();
	const isServerSide = Boolean(onPageChange && onRowsPerPageChange);

	const [localPagination, setLocalPagination] = useState({
		pageIndex: 0,
		pageSize: 50,
	});

	const activePageIndex = isServerSide
		? serverPageIndex
		: localPagination.pageIndex;
	const activePageSize = isServerSide
		? serverPageSize
		: localPagination.pageSize;

	const table = useReactTable({
		data,
		columns,
		pageCount: isServerSide
			? Math.ceil((totalRowCount || 0) / activePageSize)
			: undefined,
		state: {
			pagination: {
				pageIndex: activePageIndex,
				pageSize: activePageSize,
			},
		},
		manualPagination: isServerSide,

		onPaginationChange: (updater) => {
			if (!isServerSide) {
				setLocalPagination(updater);
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
	});

	const { rows } = table.getRowModel();

	const cellWidthSx = fillWidth
		? { flex: 1, minWidth: 0 }
		: (size) => ({
				minWidth: size,
				maxWidth: size,
		  });

	const finalTotalCount = isServerSide
		? totalRowCount || 0
		: table.getPrePaginationRowModel().rows.length;

	const RenderRow = React.useCallback(
		({ index, style }) => {
			const row = rows[index];
			if (!row) return null;

			return (
				<TableRow
					component="div"
					style={{
						...style,
						display: 'flex',
						width: fillWidth ? '100%' : undefined,
						backgroundColor:
							index % 2 === 0
								? theme.palette.background.paper
								: theme.palette.surface.zebra,
					}}
					sx={{
						transition: 'background-color 0.15s ease',
						'&:hover': {
							backgroundColor: `${theme.palette.action.hover} !important`,
						},
					}}
					key={row.id}
				>
					{row.getVisibleCells().map((cell) => (
						<TableCell
							align="center"
							component="div"
							key={cell.id}
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								...(fillWidth
									? cellWidthSx
									: cellWidthSx(cell.column.getSize())),
								p: 1,
								border: '1px solid',
								borderColor: 'divider',
							}}
						>
							<ResponsiveTextWrapper
								value={flexRender(
									cell.column.columnDef.cell,
									cell.getContext()
								)}
								fontSize="12px"
								fontWeight={500}
							/>
						</TableCell>
					))}
				</TableRow>
			);
		},
		[rows, fillWidth, theme]
	);

	const handleLocalPageChange = (event, newPage) => {
		table.setPageIndex(newPage);
	};

	const handleLocalRowsPerPageChange = (event) => {
		table.setPageSize(parseInt(event.target.value, 10));
	};

	return (
		<Paper
			sx={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				borderRadius: 1,
				overflow: 'hidden',
			}}
		>
			<Box height="100%" width="100%" overflow="auto">
				<Table component="div" sx={{ width: '100%' }}>
					<TableHead
						component="div"
						sx={{
							display: 'block',
							position: 'sticky',
							top: 0,
							zIndex: 2,
							width: '100%',
						}}
					>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								component="div"
								key={headerGroup.id}
								sx={{
									display: 'flex',
									width: '100%',
									backgroundColor: 'primary.main',
								}}
							>
								{headerGroup.headers.map((header) => (
									<TableCell
										align="center"
										component="div"
										key={header.id}
										sx={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											...(fillWidth
												? cellWidthSx
												: {
														flex: header.column.columnDef.size || 1,
														minWidth: header?.getSize(),
														maxWidth: header?.getSize(),
												  }),
											p: 1,
											color: 'primary.contrastText',
											border: '1px solid',
											borderColor: 'divider',
										}}
									>
										<ResponsiveTextWrapper
											value={
												header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext()
													  )
											}
											fontSize="14px"
											fontWeight="bold"
										/>
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHead>
					<TableBody component="div" sx={{ width: '100%' }}>
						<List
							rowCount={rows.length}
							rowHeight={32}
							rowComponent={RenderRow}
							rowProps={{}}
							style={{ width: '100%' }}
						/>
					</TableBody>
				</Table>
			</Box>

			<TablePagination
				rowsPerPageOptions={[50, 100, 150, 200]}
				component="div"
				count={finalTotalCount}
				rowsPerPage={activePageSize}
				page={activePageIndex}
				onPageChange={isServerSide ? onPageChange : handleLocalPageChange}
				onRowsPerPageChange={
					isServerSide ? onRowsPerPageChange : handleLocalRowsPerPageChange
				}
				sx={{
					overflow: 'hidden',
					border: '1px solid',
					borderRadius: 1,
					borderColor: 'divider',
					backgroundColor: 'surface.zebra',
					'.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows':
						{
							color: 'text.secondary',
							fontSize: '14px',
							fontWeight: 500,
						},
				}}
			/>
		</Paper>
	);
};
