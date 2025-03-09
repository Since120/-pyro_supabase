import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

// NOTE: We did not use React Components for Icons, because
//  you may one to get the config from the server.

// NOTE: First level elements are groups.

export interface DashboardConfig {
	// Overriden by Settings Context.
	layout: 'horizontal' | 'vertical';
	// Overriden by Settings Context.
	navColor: 'blend_in' | 'discrete' | 'evident';
	navItems: NavItemConfig[];
}

export const dashboardConfig = {
	layout: 'vertical',
	navColor: 'evident',
	navItems: [
		{
			key: 'dashboards',
			title: 'Dashboards',
			items: [{ key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'house' }],
		},
		{
			key: 'misc',
			title: 'Misc',
			items: [{ key: 'blank', title: 'Blank', href: paths.dashboard.blank, icon: 'file-dashed' }],
		},
	],
} satisfies DashboardConfig;
