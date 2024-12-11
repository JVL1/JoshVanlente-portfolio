import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Fantasy Football Analysis',
    description: 'AI-powered fantasy football player analysis and predictions',
};

export default function FantasyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
} 