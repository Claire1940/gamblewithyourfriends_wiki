import { getLatestArticles } from '@/lib/getLatestArticles'
import { buildModuleLinkMap } from '@/lib/buildModuleLinkMap'
import type { Language } from '@/lib/content'
import type { Metadata } from 'next'
import { buildLanguageAlternates } from '@/lib/i18n-utils'
import { type Locale } from '@/i18n/routing'
import HomePageClient from './HomePageClient'

interface PageProps {
  params: Promise<{ locale: string }>
}

const HOME_TITLE = 'Gamble With Your Friends - Guide, Items & Achievements'
const HOME_DESCRIPTION =
  'Gamble With Your Friends guide covering co-op casino runs, odds, items, floors, endings, achievements, system requirements, and latest Steam updates.'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gamblewithyourfriends.wiki').replace(/\/+$/, '')
  const homeUrl = locale === 'en' ? siteUrl : `${siteUrl}/${locale}`
  const heroImageUrl = `${siteUrl}/images/hero.webp`

  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    alternates: buildLanguageAlternates('/', locale as Locale, siteUrl),
    openGraph: {
      type: 'website',
      url: homeUrl,
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
  }
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params

  // 服务器端获取最新文章数据
  const latestArticles = await getLatestArticles(locale as Language, 30)
  const moduleLinkMap = await buildModuleLinkMap(locale as Language)

  return <HomePageClient latestArticles={latestArticles} moduleLinkMap={moduleLinkMap} locale={locale} />
}
