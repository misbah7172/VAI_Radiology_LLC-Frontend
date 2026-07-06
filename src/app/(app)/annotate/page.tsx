import type { Metadata } from 'next';
import AnnotatePageClient from '@/components/annotate/AnnotatePageClient';

export const metadata: Metadata = {
  title: 'Annotate — VAI Radiology',
  description: 'Draw and manage polygon annotations on medical images',
};

export default function AnnotatePage() {
  return <AnnotatePageClient />;
}
