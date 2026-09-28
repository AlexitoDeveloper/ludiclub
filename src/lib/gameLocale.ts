import { Game } from '../types'

/**
 * Supported UI languages.
 */
export type AppLanguage = 'es' | 'en'

/**
 * Returns the appropriate display title for a game based on the active language.
 *
 * - 'es': returns `game.title_es` if available, otherwise falls back to `game.title` (English).
 * - 'en': always returns `game.title` (the original English/international title).
 *
 * `game.title` is always the original English title and is NEVER overwritten with Spanish.
 * `game.title_es` is the Spanish title set by the BGG backfill cron job (nullable).
 *
 * Usage:
 *   import { getGameTitle } from '../lib/gameLocale'
 *   <span>{getGameTitle(game, language)}</span>
 */
/**
 * Sanitizes game text, unescaping HTML entities (like &#039;, &amp;, &quot;)
 * and removing erroneous backslash escaping (like \', \", \&#039;) from BGG imports.
 */
export function sanitizeGameText(text: string | null | undefined): string {
  if (!text) return ''
  let result = text

  // Fix double-escaped entity prefixes: e.g. &amp;#039; -> &#039;
  result = result.replace(/&amp;#/g, '&#')
  // Remove backslashes before quotes or entities: e.g. \' or \&#039;
  result = result.replace(/\\+(['"])/g, '$1').replace(/\\+&/g, '&')

  // Run entity unescaping in a loop (up to 3 passes to handle nested/double encoded entities)
  for (let i = 0; i < 3; i++) {
    const prev = result
    result = result
      // Numeric decimal entities (&#39;, &#039;, &#0039;, etc.)
      .replace(/&#0*(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      // Numeric hex entities (&#x27;, &#x0027;, etc.)
      .replace(/&#x0*([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      // Common named entities
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&hellip;/g, '…')
      .replace(/&nbsp;/g, ' ')
    if (result === prev) break
  }

  return result.trim()
}

export function getGameTitle(game: Game | null | undefined, lang: string = 'es'): string {
  if (!game) return ''
  const isSpanish = !lang || lang.startsWith('es')
  if (isSpanish && game.title_es) {
    return sanitizeGameText(game.title_es)
  }
  // English mode or fallback to original title
  return sanitizeGameText(game.title)
}

/**
 * Returns the appropriate publisher name for a game based on the active language.
 *
 * - 'es': returns `game.es_publisher` if available, otherwise falls back to `game.publisher`.
 * - 'en': returns `game.publisher` (the original publisher).
 *
 * Returns null when no publisher data is available for the selected language.
 *
 * Usage:
 *   import { getGamePublisher } from '../lib/gameLocale'
 *   <span>{getGamePublisher(game, language)}</span>
 */
export function getGamePublisher(game: Game | null | undefined, lang: string = 'es'): string | null {
  if (!game) return null
  const isSpanish = !lang || lang.startsWith('es')
  if (isSpanish && game.es_publisher) {
    return sanitizeGameText(game.es_publisher)
  }
  return game.publisher ? sanitizeGameText(game.publisher) : null
}

/**
 * Returns the appropriate cover image URL for a game based on the active language.
 *
 * - 'es': returns `game.image_url_es` if available, otherwise falls back to `game.image_url`.
 * - 'en': always returns `game.image_url`.
 */
export function getGameCover(game: Game | null | undefined, lang: string = 'es'): string | null {
  if (!game) return null
  const isSpanish = !lang || lang.startsWith('es')
  const rawUrl = isSpanish && game.image_url_es ? game.image_url_es : (game.image_url ?? null)
  if (!rawUrl) return null
  if (rawUrl.startsWith('//')) return `https:${rawUrl}`
  return rawUrl
}

