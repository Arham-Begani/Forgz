// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Forge — Autonomous Venture Orchestrator',
    description: 'Transform a raw business concept into a production-ready, market-validated venture in minutes with AI-powered agents.',
    keywords: ['startup', 'AI', 'venture', 'business', 'automation'],
    authors: [{ name: 'Forge' }],
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
        { media: '(prefers-color-scheme: dark)', color: '#111110' },
    ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">{children}</body>
        </html>
    )
}
