'use client';

import * as React from 'react';
import createCache from '@emotion/cache';
import type { EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import stylisRTLPlugin from 'stylis-plugin-rtl';

export type Direction = 'ltr' | 'rtl';

function styleCache(): EmotionCache {
	return createCache({ key: 'mui-rtl', prepend: true, stylisPlugins: [stylisRTLPlugin] });
}

export interface RTLProps {
	children: React.ReactNode;
	direction?: Direction;
}

export function Rtl({ children, direction = 'ltr' }: RTLProps): React.JSX.Element {
	if (direction === 'rtl') {
		return <CacheProvider value={styleCache()}>{children}</CacheProvider>;
	}

	return <React.Fragment>{children}</React.Fragment>;
}
