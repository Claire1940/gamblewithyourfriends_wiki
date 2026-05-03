'use client'

import { useEffect, useState, Suspense, lazy } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Gamepad2,
  Hammer,
  MessageCircle,
  Package,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useMessages } from 'next-intl'
import { VideoFeature } from '@/components/home/VideoFeature'
import { LatestGuidesAccordion } from '@/components/home/LatestGuidesAccordion'
import { NativeBannerAd, AdBanner } from '@/components/ads'
import { SidebarAd } from '@/components/ads/SidebarAd'
import { scrollToSection } from '@/lib/scrollToSection'
import { DynamicIcon } from '@/components/ui/DynamicIcon'
import type { ContentItemWithType } from '@/lib/getLatestArticles'
import type { ModuleLinkMap } from '@/lib/buildModuleLinkMap'

// Lazy load heavy components
const HeroStats = lazy(() => import('@/components/home/HeroStats'))
const FAQSection = lazy(() => import('@/components/home/FAQSection'))
const CTASection = lazy(() => import('@/components/home/CTASection'))

// Loading placeholder
const LoadingPlaceholder = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`} />
)

// Conditionally render text as a link or plain span
function LinkedTitle({
  linkData,
  children,
  className,
  locale,
}: {
  linkData: { url: string; title: string } | null | undefined
  children: React.ReactNode
  className?: string
  locale: string
}) {
  if (!linkData?.url) {
    return <span className={className}>{children}</span>
  }

  const normalizedUrl = linkData.url.startsWith('/') ? linkData.url : `/${linkData.url}`
  const href = locale === 'en' ? normalizedUrl : `/${locale}${normalizedUrl}`

  return (
    <a href={href} className={`hover:underline decoration-dotted underline-offset-4 ${className || ''}`}>
      {children}
    </a>
  )
}

interface HomePageClientProps {
  latestArticles: ContentItemWithType[]
  moduleLinkMap: ModuleLinkMap
  locale: string
}

export default function HomePageClient({ latestArticles, moduleLinkMap, locale }: HomePageClientProps) {
  const t = useMessages() as any
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gamblewithyourfriends.wiki').replace(/\/+$/, '')
  const steamStoreUrl = 'https://store.steampowered.com/app/3892270/Gamble_With_Your_Friends/'
  const steamCommunityUrl = 'https://steamcommunity.com/app/3892270'
  const discordUrl = 'https://discord.gg/8GZwxBqhxN'
  const xUrl = 'https://x.com/tenstackstudios'
  const redditUrl = 'https://www.reddit.com/r/Tenstack'
  const youtubeUrl = 'https://www.youtube.com/@tenstackstudios'
  const steamPatchNotesUrl = 'https://steamdb.info/app/3892270/patchnotes/'
  const localizedPath = (path: string) => (locale === 'en' ? path : `/${locale}${path}`)

  // Structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Gamble With Your Friends',
        description:
          'Gamble With Your Friends guides covering co-op quota runs, chance games, sketchy items, floors, endings, and achievements on Steam.',
        image: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: 'Gamble With Your Friends - Co-op Casino Crawler',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Gamble With Your Friends',
        alternateName: 'TENSTACK',
        url: siteUrl,
        description:
          'Official community references and player guides for Gamble With Your Friends on Steam.',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          '@type': 'ImageObject',
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: 'Gamble With Your Friends - Co-op Casino Crawler',
        },
        sameAs: [
          steamStoreUrl,
          steamCommunityUrl,
          discordUrl,
          xUrl,
          redditUrl,
          youtubeUrl,
        ],
      },
      {
        '@type': 'VideoGame',
        name: 'Gamble With Your Friends',
        gamePlatform: ['PC', 'Steam'],
        applicationCategory: 'Game',
        genre: ['Co-op', 'Simulation', 'Adventure', 'Roguelike'],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 6,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TENSTACK',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: steamStoreUrl,
        },
      },
    ],
  }

  // FAQ accordion states
  const [faqExpanded, setFaqExpanded] = useState<number | null>(null)
  const [platformExpanded, setPlatformExpanded] = useState<number | null>(null)
  const [troubleshootingExpanded, setTroubleshootingExpanded] = useState<number | null>(null)

  const releaseInfoItems = Array.isArray(t.modules?.lucidBlocksQualiaAndBaseBuilding?.items)
    ? t.modules.lucidBlocksQualiaAndBaseBuilding.items
    : (t.modules?.lucidBlocksQualiaAndBaseBuilding?.cards || []).map((card: any) => ({
        label: card?.name || '',
        value: card?.name || '',
        detail: card?.description || '',
      }))

  const quotaStrategySteps = Array.isArray(t.modules?.lucidBlocksWorldRegions?.steps)
    ? t.modules.lucidBlocksWorldRegions.steps
    : (t.modules?.lucidBlocksWorldRegions?.regions || []).map((region: any) => ({
        title: region?.name || '',
        body: region?.description || '',
        action: `Use timing window: ${region?.type || 'Planned Window'}.`,
        avoid: 'Avoid unplanned all-in bets outside your team call.',
      }))

  const floorGuideCards = Array.isArray(t.modules?.lucidBlocksCreaturesAndEnemies?.floors)
    ? t.modules.lucidBlocksCreaturesAndEnemies.floors
    : (t.modules?.lucidBlocksCreaturesAndEnemies?.creatures || []).map((creature: any) => ({
        tier: creature?.name || '',
        role: creature?.role || 'Floor Note',
        gamePool: ['Check current floor table pool'],
        achievementGoals: [creature?.description || 'Use this floor as a pacing checkpoint.'],
        teamPlan: creature?.description || '',
      }))

  const gamesOfChanceItems = Array.isArray(t.modules?.lucidBlocksMobilityGear?.items)
    ? t.modules.lucidBlocksMobilityGear.items.map((item: any) => ({
        game: item?.game || item?.name || 'Game',
        floors: Array.isArray(item?.floors) ? item.floors : item?.type ? [item.type] : ['Floor pool varies'],
        achievementTargets: Array.isArray(item?.achievementTargets) ? item.achievementTargets : ['Check current achievement route'],
        howToUse: item?.howToUse || item?.description || 'Use with team bankroll discipline and a stop point.',
      }))
    : []

  const bestTableStrategyItems = Array.isArray(t.modules?.lucidBlocksFarmingAndGrowth?.items)
    ? t.modules.lucidBlocksFarmingAndGrowth.items.map((item: any) => ({
        tier: item?.tier || '',
        label: item?.label || item?.name || 'Table Tier',
        tables: Array.isArray(item?.tables) ? item.tables : [],
        floorClues: item?.floorClues || '',
        risk: item?.risk || '',
        bestFor: item?.bestFor || '',
        strategy: item?.strategy || item?.description || '',
        itemSynergy: Array.isArray(item?.itemSynergy) ? item.itemSynergy : [],
        avoidWhen: item?.avoidWhen || '',
      }))
    : (t.modules?.lucidBlocksFarmingAndGrowth?.sections || []).map((section: any, index: number) => ({
        tier: ['S', 'A', 'B', 'C', 'D'][index] || `${index + 1}`,
        label: section?.name || 'Table Tier',
        tables: [],
        floorClues: '',
        risk: 'Varies',
        bestFor: 'Planned runs with clear team roles.',
        strategy: section?.description || '',
        itemSynergy: [],
        avoidWhen: 'Avoid unplanned table swaps while chasing losses.',
      }))

  const itemsAndTicketsCards = Array.isArray(t.modules?.lucidBlocksBestEarlyUnlocks?.items)
    ? t.modules.lucidBlocksBestEarlyUnlocks.items.map((item: any) => ({
        title: item?.title || item?.name || 'Item',
        cost: item?.cost || item?.priority || 'Variable',
        category: item?.category || 'Utility',
        useCase: item?.useCase || item?.description || '',
        bestTiming: item?.bestTiming || 'Use it for a planned table sequence.',
        avoidWhen: item?.avoidWhen || 'Avoid using this item without a team call.',
      }))
    : (t.modules?.lucidBlocksBestEarlyUnlocks?.priorities || []).map((item: any) => ({
        title: item?.name || 'Item Priority',
        cost: item?.priority || 'High Priority',
        category: 'Ticket Priority',
        useCase: item?.description || '',
        bestTiming: 'Use this priority during lobby planning before each casino day.',
        avoidWhen: 'Avoid reactive spending after losses without checking team plan.',
      }))

  const achievementGuideItems = Array.isArray(t.modules?.lucidBlocksAchievementTracker?.items)
    ? t.modules.lucidBlocksAchievementTracker.items.map((item: any) => ({
        category: item?.category || 'Achievement Category',
        count: item?.count || 0,
        recommendedOrder: item?.recommendedOrder || '',
        achievementNames: Array.isArray(item?.achievementNames) ? item.achievementNames : [],
        whatToDo: item?.whatToDo || '',
        routeTip: item?.routeTip || '',
      }))
    : (t.modules?.lucidBlocksAchievementTracker?.groups || []).map((group: any) => ({
        category: group?.name || 'Achievement Category',
        count: Array.isArray(group?.achievements) ? group.achievements.length : 0,
        recommendedOrder: 'Planned route',
        achievementNames: Array.isArray(group?.achievements)
          ? group.achievements.map((achievement: any) => achievement?.title).filter(Boolean)
          : [],
        whatToDo: Array.isArray(group?.achievements) && group.achievements[0]?.description
          ? group.achievements[0].description
          : '',
        routeTip: 'Pick one category per run to avoid scattered progress.',
      }))

  const endingGuideItems = Array.isArray(t.modules?.lucidBlocksSingleplayerAndPlatformFAQ?.items)
    ? t.modules.lucidBlocksSingleplayerAndPlatformFAQ.items.map((item: any) => ({
        title: item?.title || 'Ending Route',
        summary: item?.summary || '',
        content: Array.isArray(item?.content) ? item.content : [],
      }))
    : (t.modules?.lucidBlocksSingleplayerAndPlatformFAQ?.faqs || []).map((faq: any) => ({
        title: faq?.question || 'Ending Route',
        summary: faq?.answer || '',
        content: faq?.answer ? [faq.answer] : [],
      }))

  const systemRequirementRows = Array.isArray(t.modules?.lucidBlocksSteamDeckAndController?.items)
    ? t.modules.lucidBlocksSteamDeckAndController.items.map((item: any) => ({
        spec: item?.spec || 'Requirement',
        minimum: item?.minimum || '-',
        recommended: item?.recommended || '-',
        note: item?.note || '',
      }))
    : (t.modules?.lucidBlocksSteamDeckAndController?.faqs || []).map((faq: any) => ({
        spec: faq?.question || 'Requirement',
        minimum: '-',
        recommended: '-',
        note: faq?.answer || '',
      }))

  const platformAndMobileItems = Array.isArray(t.modules?.lucidBlocksSettingsAndAccessibility?.items)
    ? t.modules.lucidBlocksSettingsAndAccessibility.items.map((item: any) => ({
        title: item?.title || 'Platform Item',
        summary: item?.summary || '',
        content: item?.content || '',
        status: item?.status || 'Status',
      }))
    : (t.modules?.lucidBlocksSettingsAndAccessibility?.settings || []).map((item: any) => ({
        title: item?.name || 'Platform Item',
        summary: item?.type || '',
        content: item?.description || '',
        status: item?.type || 'Status',
      }))

  const playerCountCards = Array.isArray(t.modules?.lucidBlocksUpdatesAndPatchNotes?.items)
    ? t.modules.lucidBlocksUpdatesAndPatchNotes.items.map((item: any) => ({
        label: item?.label || 'Stat',
        value: item?.value || '-',
        caption: item?.caption || '',
        type: item?.type || 'metric',
      }))
    : (t.modules?.lucidBlocksUpdatesAndPatchNotes?.entries || []).map((entry: any) => ({
        label: entry?.title || 'Stat',
        value: entry?.type || '-',
        caption: entry?.description || '',
        type: entry?.type || 'metric',
      }))

  const troubleshootingItems = Array.isArray(t.modules?.lucidBlocksCrashFixAndTroubleshooting?.items)
    ? t.modules.lucidBlocksCrashFixAndTroubleshooting.items.map((item: any) => ({
        title: item?.title || 'Troubleshooting Item',
        summary: item?.summary || '',
        content: item?.content || '',
        steps: Array.isArray(item?.steps) ? item.steps : [],
      }))
    : (t.modules?.lucidBlocksCrashFixAndTroubleshooting?.steps || []).map((step: any) => ({
        title: step?.title || 'Troubleshooting Step',
        summary: step?.description || '',
        content: step?.description || '',
        steps: [step?.description || 'Follow the official support process.'],
      }))

  const bestTableIcons = [TrendingUp, Star, Sparkles, Gamepad2, AlertTriangle]
  const itemsAndTicketsIcons = [Star, Hammer, Settings, TrendingUp, MessageCircle, AlertTriangle, ClipboardCheck, ExternalLink, Clock, ArrowRight, Package, Sparkles]
  const achievementGuideIcons = [ClipboardCheck, BookOpen, Gamepad2, TrendingUp, Star, Settings, ExternalLink]
  const systemRequirementIcons = [Settings, Gamepad2, ClipboardCheck, Sparkles, ExternalLink, TrendingUp, Package, AlertTriangle]
  const platformAndMobileIcons = [Gamepad2, MessageCircle, Settings, BookOpen, Package, ExternalLink, TrendingUp, Star]
  const playerCountIcons = [TrendingUp, Clock, Star, ClipboardCheck, MessageCircle, Sparkles, ExternalLink]
  const troubleshootingIcons = [AlertTriangle, MessageCircle, BookOpen, Settings, TrendingUp, Sparkles, ClipboardCheck, ExternalLink, Hammer]

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal-visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 左侧广告容器 - Fixed 定位 */}
      <aside
        className="hidden xl:block fixed top-20 w-40 z-10"
        style={{ left: 'calc((100vw - 896px) / 2 - 180px)' }}
      >
        <SidebarAd type="sidebar-160x300" adKey={process.env.NEXT_PUBLIC_AD_SIDEBAR_160X300} />
      </aside>

      {/* 右侧广告容器 - Fixed 定位 */}
      <aside
        className="hidden xl:block fixed top-20 w-40 z-10"
        style={{ right: 'calc((100vw - 896px) / 2 - 180px)' }}
      >
        <SidebarAd type="sidebar-160x600" adKey={process.env.NEXT_PUBLIC_AD_SIDEBAR_160X600} />
      </aside>

      {/* 广告位 1: 移动端横幅 Sticky */}
      {/* <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div> */}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-6">
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-sm font-medium">{t.hero.badge}</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </a>
              <a
                href={steamStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-lg transition-colors"
              >
                {t.hero.playOnSteamCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* 广告位 2: 原生横幅 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ''} />

      {/* Video Section */}
      <section className="px-4 py-12">
        <div className="scroll-reveal container mx-auto max-w-4xl">
          <div className="relative rounded-2xl overflow-hidden">
            <VideoFeature
              videoId="j_WVqza2yRk"
              title="GAMBLE WITH YOUR FRIENDS IS OUT NOW!"
              posterImage="/images/hero.webp"
            />
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <LatestGuidesAccordion articles={latestArticles} locale={locale} max={30} />

      {/* 广告位 3: 标准横幅 728×90 */}
      <AdBanner type="banner-728x90" adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90} />

      {/* Tools Grid - 16 Navigation Cards */}
      <section className="px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t.tools.title}{' '}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {t.tools.cards.map((card: any, index: number) => {
              // 映射卡片索引到 section ID
              const sectionIds = [
                'steam-download-and-price', 'gameplay-overview', 'beginner-guide', 'co-op-multiplayer',
                'release-date', 'quota-strategy', 'floors-guide', 'games-of-chance',
                'best-tables-strategy', 'items-and-tickets', 'achievements-guide', 'endings-guide',
                'system-requirements', 'platforms-and-mobile', 'player-count-and-reviews', 'troubleshooting-and-updates'
              ]
              const sectionId = sectionIds[index]

              return (
                <a
                  key={index}
                  href={`#${sectionId}`}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection(sectionId)
                  }}
                  className="scroll-reveal group p-6 rounded-xl border border-border
                             bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                             transition-all duration-300 cursor-pointer text-left
                             hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg mb-4
                                  bg-[hsl(var(--nav-theme)/0.1)]
                                  flex items-center justify-center
                                  group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                                  transition-colors">
                    <DynamicIcon
                      name={card.icon}
                      className="w-6 h-6 text-[hsl(var(--nav-theme-light))]"
                    />
                  </div>
                  <h3 className="font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* 广告位 4: 方形广告 300×250 */}
      <AdBanner type="banner-300x250" adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250} />

      {/* Module 1: Steam Download and Price */}
      <section id="steam-download-and-price" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <LinkedTitle linkData={moduleLinkMap['lucidBlocksBeginnerGuide']} locale={locale}>
                {t.modules.lucidBlocksBeginnerGuide.title}
              </LinkedTitle>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t.modules.lucidBlocksBeginnerGuide.intro}
            </p>
          </div>

          {/* Steps */}
          <div className="scroll-reveal space-y-4 mb-10">
            {t.modules.lucidBlocksBeginnerGuide.steps.map((step: any, index: number) => (
              <div key={index} className="flex gap-4 p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border-2 border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center">
                  <span className="text-xl font-bold text-[hsl(var(--nav-theme-light))]">{index + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksBeginnerGuide::steps::${index}`]} locale={locale}>
                      {step.title}
                    </LinkedTitle>
                  </h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tips */}
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-lg">Quick Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.lucidBlocksBeginnerGuide.quickTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 广告位 5: 中型横幅 468×60 */}
      <AdBanner type="banner-468x60" adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60} />

      {/* Module 2: Gameplay Overview */}
      <section id="gameplay-overview" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksApotheosisCrafting']} locale={locale}>{t.modules.lucidBlocksApotheosisCrafting.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksApotheosisCrafting.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {t.modules.lucidBlocksApotheosisCrafting.cards.map((card: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <h3 className="font-bold text-lg mb-2 text-[hsl(var(--nav-theme-light))]">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksApotheosisCrafting::cards::${index}`]} locale={locale}>
                    {card.name}
                  </LinkedTitle>
                </h3>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </div>
            ))}
          </div>
          <div className="scroll-reveal flex flex-wrap gap-3 justify-center">
            {t.modules.lucidBlocksApotheosisCrafting.milestones.map((m: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm">
                <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />{m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Module 3: Beginner Guide */}
      <section id="beginner-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksToolsAndWeapons']} locale={locale}>{t.modules.lucidBlocksToolsAndWeapons.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksToolsAndWeapons.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.lucidBlocksToolsAndWeapons.items.map((item: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Hammer className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{item.type}</span>
                </div>
                <h3 className="font-bold mb-2">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksToolsAndWeapons::items::${index}`]} locale={locale}>
                    {item.name}
                  </LinkedTitle>
                </h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 4: Co-op Multiplayer */}
      <section id="co-op-multiplayer" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksStorageAndInventory']} locale={locale}>{t.modules.lucidBlocksStorageAndInventory.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksStorageAndInventory.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {t.modules.lucidBlocksStorageAndInventory.solutions.map((s: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksStorageAndInventory::solutions::${index}`]} locale={locale}>
                      {s.name}
                    </LinkedTitle>
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{s.role}</span>
                </div>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold">Management Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.lucidBlocksStorageAndInventory.managementTips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Module 5: Release Date */}
      <section id="release-date" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksQualiaAndBaseBuilding']} locale={locale}>{t.modules.lucidBlocksQualiaAndBaseBuilding.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksQualiaAndBaseBuilding.intro}</p>
          </div>

          <div className="scroll-reveal hidden md:block rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_2fr] gap-0 bg-[hsl(var(--nav-theme)/0.14)] border-b border-border">
              <div className="p-4 text-sm font-semibold">Field</div>
              <div className="p-4 text-sm font-semibold">Value</div>
              <div className="p-4 text-sm font-semibold">Detail</div>
            </div>
            {releaseInfoItems.map((item: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_2fr] gap-0 border-b border-border/70 last:border-b-0 bg-white/[0.02] hover:bg-[hsl(var(--nav-theme)/0.06)] transition-colors"
              >
                <div className="p-4 font-semibold text-[hsl(var(--nav-theme-light))]">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksQualiaAndBaseBuilding::items::${index}`]} locale={locale}>
                    {item.label}
                  </LinkedTitle>
                </div>
                <div className="p-4 text-sm font-medium">{item.value}</div>
                <div className="p-4 text-sm text-muted-foreground">{item.detail}</div>
              </div>
            ))}
          </div>

          <div className="scroll-reveal md:hidden space-y-4">
            {releaseInfoItems.map((item: any, index: number) => (
              <div key={index} className="p-5 bg-white/5 border border-border rounded-xl">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Field</p>
                <p className="font-semibold text-[hsl(var(--nav-theme-light))] mb-3">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksQualiaAndBaseBuilding::items::${index}`]} locale={locale}>
                    {item.label}
                  </LinkedTitle>
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Value</p>
                <p className="text-sm font-medium mb-3">{item.value}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Detail</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 6: Quota Strategy */}
      <section id="quota-strategy" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksWorldRegions']} locale={locale}>{t.modules.lucidBlocksWorldRegions.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksWorldRegions.intro}</p>
          </div>
          <div className="scroll-reveal space-y-4">
            {quotaStrategySteps.map((step: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--nav-theme)/0.16)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center font-bold text-[hsl(var(--nav-theme-light))]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">
                      <LinkedTitle linkData={moduleLinkMap[`lucidBlocksWorldRegions::steps::${index}`]} locale={locale}>
                        {step.title}
                      </LinkedTitle>
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">{step.body}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)]">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                          <span className="text-sm font-semibold">Do This</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.action}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)]">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                          <span className="text-sm font-semibold">Avoid This</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.avoid}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 7: Floors Guide */}
      <section id="floors-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksCreaturesAndEnemies']} locale={locale}>{t.modules.lucidBlocksCreaturesAndEnemies.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksCreaturesAndEnemies.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4">
            {floorGuideCards.map((floor: any, index: number) => (
              <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-xl text-[hsl(var(--nav-theme-light))]">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksCreaturesAndEnemies::floors::${index}`]} locale={locale}>
                      {floor.tier}
                    </LinkedTitle>
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">{floor.role}</span>
                </div>

                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Game Pool</p>
                  <div className="flex flex-wrap gap-2">
                    {floor.gamePool.map((game: string, gi: number) => (
                      <span key={gi} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.25)]">
                        {game}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Achievement Goals</p>
                  </div>
                  <ul className="space-y-2">
                    {floor.achievementGoals.map((goal: string, ai: number) => (
                      <li key={ai} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[hsl(var(--nav-theme-light))] flex-shrink-0" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.3)]">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Team Plan</p>
                  <p className="text-sm text-muted-foreground">{floor.teamPlan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 8: Games of Chance */}
      <section id="games-of-chance" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksMobilityGear']} locale={locale}>{t.modules.lucidBlocksMobilityGear.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksMobilityGear.intro}</p>
          </div>

          <div className="scroll-reveal hidden md:block rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_1.2fr_1.8fr] gap-0 bg-[hsl(var(--nav-theme)/0.14)] border-b border-border">
              <div className="p-4 text-sm font-semibold">Game</div>
              <div className="p-4 text-sm font-semibold">Floors</div>
              <div className="p-4 text-sm font-semibold">Achievement Targets</div>
              <div className="p-4 text-sm font-semibold">How To Use</div>
            </div>
            {gamesOfChanceItems.map((item: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_1.2fr_1.8fr] gap-0 border-b border-border/70 last:border-b-0 bg-white/[0.02] hover:bg-[hsl(var(--nav-theme)/0.06)] transition-colors"
              >
                <div className="p-4 font-semibold text-[hsl(var(--nav-theme-light))]">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksMobilityGear::items::${index}`]} locale={locale}>
                    {item.game}
                  </LinkedTitle>
                </div>
                <div className="p-4 text-sm text-muted-foreground">{item.floors.join(', ')}</div>
                <div className="p-4 text-sm text-muted-foreground">{item.achievementTargets.join(', ')}</div>
                <div className="p-4 text-sm text-muted-foreground">{item.howToUse}</div>
              </div>
            ))}
          </div>

          <div className="scroll-reveal md:hidden space-y-4">
            {gamesOfChanceItems.map((item: any, index: number) => (
              <div key={index} className="p-5 bg-white/5 border border-border rounded-xl">
                <h3 className="font-bold text-[hsl(var(--nav-theme-light))] mb-2">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksMobilityGear::items::${index}`]} locale={locale}>
                    {item.game}
                  </LinkedTitle>
                </h3>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Floors</p>
                <p className="text-sm text-muted-foreground mb-3">{item.floors.join(', ')}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Achievement Targets</p>
                <p className="text-sm text-muted-foreground mb-3">{item.achievementTargets.join(', ')}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">How To Use</p>
                <p className="text-sm text-muted-foreground">{item.howToUse}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 6: 移动端横幅 320×50 */}
      <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />

      {/* Module 9: Best Tables Strategy */}
      <section id="best-tables-strategy" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksFarmingAndGrowth']} locale={locale}>{t.modules.lucidBlocksFarmingAndGrowth.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksFarmingAndGrowth.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 lg:grid-cols-2 gap-5">
            {bestTableStrategyItems.map((item: any, index: number) => {
              const TierIcon = bestTableIcons[index % bestTableIcons.length]

              return (
                <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center">
                        <TierIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Tier {item.tier || index + 1}</div>
                        <h3 className="font-bold text-lg">
                          <LinkedTitle linkData={moduleLinkMap[`lucidBlocksFarmingAndGrowth::items::${index}`]} locale={locale}>
                            {item.label}
                          </LinkedTitle>
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                      {item.risk || 'Risk Varies'}
                    </span>
                  </div>

                  {Array.isArray(item.tables) && item.tables.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tables</p>
                      <div className="flex flex-wrap gap-2">
                        {item.tables.map((table: string, tableIndex: number) => (
                          <span key={tableIndex} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.25)]">
                            {table}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.floorClues && (
                    <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.07)] border border-[hsl(var(--nav-theme)/0.25)]">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Floor Clues</p>
                      <p className="text-sm text-muted-foreground">{item.floorClues}</p>
                    </div>
                  )}

                  {item.bestFor && (
                    <div className="mb-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Best For</p>
                      <p className="text-sm text-muted-foreground">{item.bestFor}</p>
                    </div>
                  )}

                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Strategy</p>
                    <p className="text-sm text-muted-foreground">{item.strategy}</p>
                  </div>

                  {Array.isArray(item.itemSynergy) && item.itemSynergy.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Item Synergy</p>
                      <div className="flex flex-wrap gap-2">
                        {item.itemSynergy.map((synergy: string, synergyIndex: number) => (
                          <span key={synergyIndex} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.25)]">
                            {synergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.avoidWhen && (
                    <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.07)] border border-[hsl(var(--nav-theme)/0.25)]">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Avoid When</p>
                      <p className="text-sm text-muted-foreground">{item.avoidWhen}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 10: Items and Tickets */}
      <section id="items-and-tickets" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksBestEarlyUnlocks']} locale={locale}>{t.modules.lucidBlocksBestEarlyUnlocks.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksBestEarlyUnlocks.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsAndTicketsCards.map((item: any, index: number) => {
              const ItemIcon = itemsAndTicketsIcons[index % itemsAndTicketsIcons.length]

              return (
                <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center">
                      <ItemIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksBestEarlyUnlocks::items::${index}`]} locale={locale}>
                      {item.title}
                    </LinkedTitle>
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Cost</p>
                  <p className="text-sm font-semibold text-[hsl(var(--nav-theme-light))] mb-3">{item.cost}</p>

                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Use Case</p>
                  <p className="text-sm text-muted-foreground mb-3">{item.useCase}</p>

                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Best Timing</p>
                  <p className="text-sm text-muted-foreground mb-3">{item.bestTiming}</p>

                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Avoid When</p>
                  <p className="text-sm text-muted-foreground">{item.avoidWhen}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 11: Achievements Guide */}
      <section id="achievements-guide" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksAchievementTracker']} locale={locale}>{t.modules.lucidBlocksAchievementTracker.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksAchievementTracker.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-5">
            {achievementGuideItems.map((item: any, index: number) => {
              const AchievementIcon = achievementGuideIcons[index % achievementGuideIcons.length]

              return (
                <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center">
                        <AchievementIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                      </div>
                      <h3 className="font-bold text-lg">
                        <LinkedTitle linkData={moduleLinkMap[`lucidBlocksAchievementTracker::items::${index}`]} locale={locale}>
                          {item.category}
                        </LinkedTitle>
                      </h3>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                      {item.count} Goals
                    </span>
                  </div>

                  {item.recommendedOrder && (
                    <div className="mb-4 p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.07)] border border-[hsl(var(--nav-theme)/0.25)]">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Recommended Order</p>
                      <p className="text-sm text-muted-foreground">{item.recommendedOrder}</p>
                    </div>
                  )}

                  {Array.isArray(item.achievementNames) && item.achievementNames.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Achievement Names</p>
                      <div className="flex flex-wrap gap-2">
                        {item.achievementNames.map((name: string, nameIndex: number) => (
                          <span key={nameIndex} className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.25)]">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.whatToDo && (
                    <div className="mb-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">What To Do</p>
                      <p className="text-sm text-muted-foreground">{item.whatToDo}</p>
                    </div>
                  )}

                  {item.routeTip && (
                    <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.07)] border border-[hsl(var(--nav-theme)/0.25)]">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Route Tip</p>
                      <p className="text-sm text-muted-foreground">{item.routeTip}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 12: Endings Guide */}
      <section id="endings-guide" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksSingleplayerAndPlatformFAQ']} locale={locale}>{t.modules.lucidBlocksSingleplayerAndPlatformFAQ.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksSingleplayerAndPlatformFAQ.intro}</p>
          </div>
          <div className="scroll-reveal space-y-2">
            {endingGuideItems.map((item: any, index: number) => (
              <div key={index} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqExpanded(faqExpanded === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.summary && <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>}
                  </div>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${faqExpanded === index ? "rotate-180" : ""}`} />
                </button>
                {faqExpanded === index && (
                  <div className="px-5 pb-5">
                    <ul className="space-y-2">
                      {item.content.map((line: string, lineIndex: number) => (
                        <li key={lineIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 text-[hsl(var(--nav-theme-light))] flex-shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module 13: System Requirements */}
      <section id="system-requirements" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <LinkedTitle linkData={moduleLinkMap['lucidBlocksSteamDeckAndController']} locale={locale}>
                {t.modules.lucidBlocksSteamDeckAndController.title}
              </LinkedTitle>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t.modules.lucidBlocksSteamDeckAndController.intro}
            </p>
          </div>

          <div className="scroll-reveal hidden md:block rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1.8fr] bg-[hsl(var(--nav-theme)/0.14)] border-b border-border">
              <div className="p-4 text-sm font-semibold">Spec</div>
              <div className="p-4 text-sm font-semibold">Minimum</div>
              <div className="p-4 text-sm font-semibold">Recommended</div>
              <div className="p-4 text-sm font-semibold">Notes</div>
            </div>
            {systemRequirementRows.map((row: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-[1.2fr_1fr_1fr_1.8fr] border-b border-border/70 last:border-b-0 bg-white/[0.02] hover:bg-[hsl(var(--nav-theme)/0.06)] transition-colors"
              >
                <div className="p-4 font-semibold text-[hsl(var(--nav-theme-light))]">
                  <LinkedTitle linkData={moduleLinkMap[`lucidBlocksSteamDeckAndController::items::${index}`]} locale={locale}>
                    {row.spec}
                  </LinkedTitle>
                </div>
                <div className="p-4 text-sm">{row.minimum}</div>
                <div className="p-4 text-sm">{row.recommended}</div>
                <div className="p-4 text-sm text-muted-foreground">{row.note}</div>
              </div>
            ))}
          </div>

          <div className="scroll-reveal md:hidden space-y-4">
            {systemRequirementRows.map((row: any, index: number) => {
              const RequirementIcon = systemRequirementIcons[index % systemRequirementIcons.length]
              return (
                <div key={index} className="p-5 bg-white/5 border border-border rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center">
                      <RequirementIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <h3 className="font-bold">
                      <LinkedTitle linkData={moduleLinkMap[`lucidBlocksSteamDeckAndController::items::${index}`]} locale={locale}>
                        {row.spec}
                      </LinkedTitle>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Minimum</p>
                      <p className="text-sm font-medium">{row.minimum}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Recommended</p>
                      <p className="text-sm font-medium">{row.recommended}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{row.note}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 14: Platforms and Mobile */}
      <section id="platforms-and-mobile" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksSettingsAndAccessibility']} locale={locale}>{t.modules.lucidBlocksSettingsAndAccessibility.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksSettingsAndAccessibility.intro}</p>
          </div>
          <div className="scroll-reveal space-y-3">
            {platformAndMobileItems.map((item: any, index: number) => {
              const PlatformIcon = platformAndMobileIcons[index % platformAndMobileIcons.length]
              const isOpen = platformExpanded === index

              return (
                <div key={index} className="border border-border rounded-xl overflow-hidden bg-white/[0.02]">
                  <button
                    onClick={() => setPlatformExpanded(isOpen ? null : index)}
                    className="w-full p-5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center flex-shrink-0">
                          <PlatformIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                        </div>
                        <div>
                          <h3 className="font-bold mb-1">
                            <LinkedTitle linkData={moduleLinkMap[`lucidBlocksSettingsAndAccessibility::items::${index}`]} locale={locale}>
                              {item.title}
                            </LinkedTitle>
                          </h3>
                          {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
                          {item.status}
                        </span>
                        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground">
                      {item.content}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 15: Player Count and Reviews */}
      <section id="player-count-and-reviews" className="scroll-mt-24 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksUpdatesAndPatchNotes']} locale={locale}>{t.modules.lucidBlocksUpdatesAndPatchNotes.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksUpdatesAndPatchNotes.intro}</p>
          </div>
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerCountCards.map((item: any, index: number) => {
              const PlayerIcon = playerCountIcons[index % playerCountIcons.length]

              return (
                <div key={index} className="p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center">
                      <PlayerIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] uppercase">
                      {item.type.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    <LinkedTitle linkData={moduleLinkMap[`lucidBlocksUpdatesAndPatchNotes::items::${index}`]} locale={locale}>
                      {item.label}
                    </LinkedTitle>
                  </p>
                  <p className="text-3xl font-bold text-[hsl(var(--nav-theme-light))] mb-3">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.caption}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Module 16: Troubleshooting and Updates */}
      <section id="troubleshooting-and-updates" className="scroll-mt-24 px-4 py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold mb-4"><LinkedTitle linkData={moduleLinkMap['lucidBlocksCrashFixAndTroubleshooting']} locale={locale}>{t.modules.lucidBlocksCrashFixAndTroubleshooting.title}</LinkedTitle></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{t.modules.lucidBlocksCrashFixAndTroubleshooting.intro}</p>
          </div>
          <div className="scroll-reveal space-y-3 mb-8">
            {troubleshootingItems.map((item: any, index: number) => {
              const TroubleshootingIcon = troubleshootingIcons[index % troubleshootingIcons.length]
              const isOpen = troubleshootingExpanded === index

              return (
                <div key={index} className="border border-border rounded-xl overflow-hidden bg-white/[0.02]">
                  <button
                    onClick={() => setTroubleshootingExpanded(isOpen ? null : index)}
                    className="w-full p-5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--nav-theme)/0.14)] border border-[hsl(var(--nav-theme)/0.35)] flex items-center justify-center flex-shrink-0">
                          <TroubleshootingIcon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                        </div>
                        <div>
                          <h3 className="font-bold mb-1">
                            <LinkedTitle linkData={moduleLinkMap[`lucidBlocksCrashFixAndTroubleshooting::items::${index}`]} locale={locale}>
                              {item.title}
                            </LinkedTitle>
                          </h3>
                          {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      {item.content && <p className="text-sm text-muted-foreground mb-4">{item.content}</p>}
                      {Array.isArray(item.steps) && item.steps.length > 0 && (
                        <ul className="space-y-2">
                          {item.steps.map((step: string, stepIndex: number) => (
                            <li key={stepIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 mt-0.5 text-[hsl(var(--nav-theme-light))] flex-shrink-0" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="scroll-reveal p-6 bg-[hsl(var(--nav-theme)/0.08)] border border-[hsl(var(--nav-theme)/0.35)] rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[hsl(var(--nav-theme-light))] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-[hsl(var(--nav-theme-light))] mb-2">Need direct support channels?</h3>
                <p className="text-sm text-muted-foreground mb-3">Use these official destinations for live help and update tracking.</p>
                <div className="flex flex-wrap gap-3">
                  <a href={discordUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                    <MessageCircle className="w-4 h-4" /> Discord <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={steamCommunityUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                    Steam Community <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={steamPatchNotesUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-sm hover:bg-[hsl(var(--nav-theme)/0.2)] transition-colors">
                    SteamDB Patch Notes <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner type="banner-728x90" adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90} />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">{t.footer.description}</p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.discord}
                  </a>
                </li>
                <li>
                  <a
                    href={xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.twitter}
                  </a>
                </li>
                <li>
                  <a
                    href={redditUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.reddit || 'Reddit'}
                  </a>
                </li>
                <li>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.youtube || 'YouTube'}
                  </a>
                </li>
                <li>
                  <a
                    href={steamCommunityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamCommunity}
                  </a>
                </li>
                <li>
                  <a
                    href={steamStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamStore}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Links */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={localizedPath('/about')}
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.about}
                  </a>
                </li>
                <li>
                  <a
                    href={localizedPath('/privacy-policy')}
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.privacy}
                  </a>
                </li>
                <li>
                  <a
                    href={localizedPath('/terms-of-service')}
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.terms}
                  </a>
                </li>
                <li>
                  <a
                    href={localizedPath('/copyright')}
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.copyrightNotice}
                  </a>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.footer.copyright}</p>
              <p className="text-xs text-muted-foreground">{t.footer.disclaimer}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
