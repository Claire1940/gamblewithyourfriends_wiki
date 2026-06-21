import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { buildLanguageAlternates } from '@/lib/i18n-utils'
import { getNavPreviewData } from '@/lib/nav-preview'
import type { Language } from '@/lib/content'
import { getWikiLinks } from '@/lib/wiki-links'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import ClientBody from '../ClientBody'
import Analytics from '@/components/Analytics'
import { SocialBarAd } from '@/components/ads'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

type Props = {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}

const SITE_NAME = 'Gamble With Your Friends'
const HOME_TITLE = 'Gamble With Your Friends - Guide, Items & Achievements'
const HOME_DESCRIPTION =
	'Gamble With Your Friends guides for co-op runs, chance games, items, floors, endings, achievements, and Steam updates.'

// 生成静态参数
export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }))
}

// 生成元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params
	setRequestLocale(locale)
	const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gamblewithyourfriends.wiki').replace(/\/+$/, '')
	const homeUrl = locale === 'en' ? siteUrl : `${siteUrl}/${locale}`
	const heroImageUrl = `${siteUrl}/images/hero.webp`

	return {
		title: HOME_TITLE,
		description: HOME_DESCRIPTION,
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				'max-video-preview': -1,
				'max-image-preview': 'large',
				'max-snippet': -1,
			},
		},
		openGraph: {
			type: 'website',
			locale: locale,
			url: homeUrl,
			siteName: SITE_NAME,
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			images: [
				{
					url: heroImageUrl,
					width: 1920,
					height: 1080,
					alt: 'Gamble With Your Friends - Co-op Casino Crawler',
				},
			],
		},
		twitter: {
			card: 'summary_large_image',
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			images: [heroImageUrl],
		},
		icons: {
			icon: [
				{ url: '/favicon.ico', sizes: 'any' },
				{ url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
				{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
			],
			apple: [
				{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
			],
		},
		manifest: '/manifest.json',
		alternates: buildLanguageAlternates('/', locale as Locale, siteUrl),
	}
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params
	setRequestLocale(locale)

	// 验证 locale
	if (!routing.locales.includes(locale as Locale)) {
		notFound()
	}

	// 获取翻译消息（不需要 setRequestLocale！）
	const messages = await getMessages()
	const navPreviewData = await getNavPreviewData(locale as Language)
	const wikiLinks = getWikiLinks()

	return (
		<html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
			<head>
				<meta name="google-adsense-account" content="ca-pub-7733402184034568" />
				<Script
					crossOrigin="anonymous"
					src="https://unpkg.com/same-runtime@0.0.1/dist/index.global.js"
					strategy="beforeInteractive"
				/>
				<Script
					async
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7733402184034568"
					crossOrigin="anonymous"
					strategy="lazyOnload"
				/>
			</head>
			<body suppressHydrationWarning className="antialiased">
				<Analytics />
				<NextIntlClientProvider messages={messages}>
					<ClientBody navPreviewData={navPreviewData} wikiLinks={wikiLinks}>{children}</ClientBody>
				</NextIntlClientProvider>
				{/* 社交栏广告 */}
				<SocialBarAd adKey={process.env.NEXT_PUBLIC_AD_SOCIAL_BAR || ''} />
			</body>
		</html>
	)
}
