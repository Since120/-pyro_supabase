// components/dashboard/category/types.ts

export type Zone = {
	id: number;
	name: string;
	key?: string[];
	timeInZone: string[];
	points: string[];
};

export type Category = {
	name: string;
	zones: Zone[];
};

export interface Column {
	key: string;
	label: string;
	align?: 'left' | 'right' | 'center';
}

export interface EditCategoryData {
	selectedLevel: string;
	categoryName: string;
	role: string[];
	tracking: boolean;
	visible: boolean;
	sendSetup: boolean;
}
