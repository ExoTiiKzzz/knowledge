import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: false,
    directives: {},
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: true,
    /*
     * L'API des salons (/api/rooms) est exemptée, et ce n'est pas un relâchement : la
     * protection CSRF défend contre une requête forgée que le navigateur
     * authentifierait tout seul, par un cookie. Ici l'autorité est le jeton du
     * joueur, transmis dans le corps de la requête — un site tiers ne peut pas le
     * connaître, donc il n'a rien à usurper. Aucun cookie ne porte de privilège.
     */
    exceptRoutes: (ctx) => {
      const url = ctx.request.url()
      // `/__transmit/*` porte l'abonnement au flux d'événements, lui aussi en POST.
      return url.startsWith('/api/rooms') || url.startsWith('/__transmit')
    },
    enableXsrfCookie: false,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig