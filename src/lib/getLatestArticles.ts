import { getAllContent, CONTENT_TYPES } from '@/lib/content'
import type { ContentItem, Language } from '@/lib/content'

export interface ContentItemWithType extends ContentItem {
  contentType: string
}

/**
 * 获取最新文章（服务器端）
 * @param locale 语言
 * @param max 最大数量
 * @returns 排序后的文章列表
 */
export async function getLatestArticles(
  locale: Language,
  max: number = 30
): Promise<ContentItemWithType[]> {
  // 获取所有内容类型的文章
  const allArticles: ContentItemWithType[] = []

  for (const contentType of CONTENT_TYPES) {
    const items = await getAllContent(contentType, locale)
    allArticles.push(...items.map(item => ({ ...item, contentType })))
  }

  // 首页 Latest Updates：按最近更新时间降序（优先 lastModified，回退 date）
  const getUpdateTime = (article: ContentItemWithType): number => {
    if (article.frontmatter.lastModified) {
      return new Date(article.frontmatter.lastModified).getTime()
    }
    if (article.frontmatter.date) {
      return new Date(article.frontmatter.date).getTime()
    }
    return 0
  }

  allArticles.sort((a, b) => {
    const timeDiff = getUpdateTime(b) - getUpdateTime(a)
    if (timeDiff !== 0) return timeDiff
    return a.slug.localeCompare(b.slug)
  })

  return allArticles.slice(0, max)
}
