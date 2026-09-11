import type { NuxtApp } from '#app'

/**
 * useFetch cache policy: reuse what this session already fetched for `ttl` ms
 * (instant back-navigation), but always refetch on an explicit refresh.
 */
export const fresh =
  <T = any>(ttl: number) =>
  (key: string, app: NuxtApp, ctx: { cause: string }): T | undefined => {
    if (ctx.cause === 'refresh:manual' || ctx.cause === 'refresh:hook') return
    const d = app.payload.data[key] as { fetchedAt?: number } | undefined
    return d && (!d.fetchedAt || Date.now() - d.fetchedAt < ttl) ? (d as T) : undefined
  }
