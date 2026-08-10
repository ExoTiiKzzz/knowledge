/**
 * Inertia 5 types its pages through module augmentation: without this
 * declaration, `renderInertia('room')` is refused on the server.
 */
declare module '@adonisjs/inertia/types' {
  interface InertiaPages {
    home: Record<string, never>
    solo: Record<string, never>
    room: Record<string, never>
  }
}

export {}
