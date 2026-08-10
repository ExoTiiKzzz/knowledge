import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

/**
 * Inertia 5 ne fournit qu'une classe de base : `init` prépare `ctx.inertia`,
 * `dispose` nettoie en fin de requête, et le corps du middleware nous appartient.
 */
export default class InertiaMiddleware extends BaseInertiaMiddleware {
  /** Props transmises à toutes les pages. Aucune pour l'instant. */
  async share() {
    return {}
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)
    try {
      return await next()
    } finally {
      this.dispose(ctx)
    }
  }
}
