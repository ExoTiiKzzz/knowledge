// Tells Convex to trust the JWTs that Convex Auth itself issues. CONVEX_SITE_URL is
// provided by the deployment; JWT_PRIVATE_KEY and JWKS were set by `npx @convex-dev/auth`.
const authConfig = {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: 'convex',
    },
  ],
}

export default authConfig
