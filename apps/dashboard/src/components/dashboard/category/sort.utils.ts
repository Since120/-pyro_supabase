// components/dashboard/category/sortUtils.ts

import { Category } from './types';

export type Order = 'asc' | 'desc';

type Comparable = string | number;

/**
 * Sortiert ein Array von Kategorien nach einem bestimmten Feld.
 * Falls das Feld nicht existiert, wird der Wert als leerer String angenommen.
 */
export function sortCategories(categories: Category[], orderBy: string, order: Order): Category[] {
	return [...categories].sort((a, b) => {
		const aValue = ((a as unknown as Record<string, Comparable>)[orderBy] ?? '') as Comparable;
		const bValue = ((b as unknown as Record<string, Comparable>)[orderBy] ?? '') as Comparable;
		if (aValue < bValue) return order === 'asc' ? -1 : 1;
		if (aValue > bValue) return order === 'asc' ? 1 : -1;
		return 0;
	});
}
