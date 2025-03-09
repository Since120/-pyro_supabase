// components/dashboard/category/SortableTableCell.tsx

'use client';

import React from 'react';
import { TableCell, TableSortLabel } from '@mui/material';
import { Order } from './sort.utils';

export interface SortableTableCellProps {
	columnKey: string;
	label: string;
	orderBy: string;
	order: Order;
	onRequestSort: (property: string) => void;
	align?: 'left' | 'right' | 'center';
}

const SortableTableCell: React.FC<SortableTableCellProps> = ({
	columnKey,
	label,
	orderBy,
	order,
	onRequestSort,
	align = 'left',
}) => {
	return (
		<TableCell align={align}>
			<TableSortLabel
				active={orderBy === columnKey}
				direction={orderBy === columnKey ? order : 'asc'}
				onClick={() => onRequestSort(columnKey)}
			>
				{label}
			</TableSortLabel>
		</TableCell>
	);
};

export default SortableTableCell;
