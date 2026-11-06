import { getAuthUserId } from '@convex-dev/auth/server'
import { query } from './_generated/server'

/** The signed-in player, or null for a Guest. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const user = await ctx.db.get(userId)
    if (!user) return null

    return {
      name: user.name ?? user.email ?? 'Voyageur',
      image: user.image ?? null,
    }
  },
})
