'use client';

import dynamic from 'next/dynamic';
import type { PDFViewerProps } from '@react-pdf/renderer';

export const PDFViewer = dynamic<PDFViewerProps>(
	() => import('@react-pdf/renderer').then((module) => module.PDFViewer),
	{
		ssr: false,
	}
);
