# syntax=docker/dockerfile:1

# Image de déploiement pour Galaxy Cloud.
#
# Trois étapes : dépendances, construction, exécution. Seule la dernière est
# livrée, et elle ne contient ni sources TypeScript, ni outillage de build.
FROM meteor/galaxy-node:24.13.0 AS base
WORKDIR /app
ENV NODE_ENV=production

# ————————————————————————————————————— dépendances de construction
# `npm ci` sans `--omit=dev` : @adonisjs/assembler, @poppinss/ts-exec et vite
# sont des devDependencies, et la construction ne se fait pas sans elles.
FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

# ————————————————————————————————————— construction
FROM base AS build
ENV NODE_ENV=development
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
# `npm run build`, et non `node ace build` : depuis AdonisJS 7 le transpileur
# TypeScript se charge par le drapeau `--import=@poppinss/ts-exec`, que porte le
# script npm. Sans lui, Node cherche un `bin/console.js` qui n'existe pas encore.
RUN npm run build

# ————————————————————————————————————— exécution
FROM base AS production

# Dépendances de production uniquement, installées pour l'architecture de l'image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# `build/` contient le JavaScript compilé, le bundle client et les vues.
COPY --from=build /app/build ./

# Valeurs par défaut viables en conteneur, de sorte que seul APP_KEY soit
# réellement à fournir par la plateforme.
#
# HOST vaut 0.0.0.0 et non localhost : dans un conteneur, écouter sur localhost
# rend l'application injoignable depuis l'extérieur, et le déploiement échoue au
# contrôle de santé. PORT est écrasé par Galaxy.
ENV HOST=0.0.0.0
ENV PORT=3333
ENV LOG_LEVEL=info
ENV SESSION_DRIVER=cookie

EXPOSE 3333
CMD ["node", "bin/server.js"]
