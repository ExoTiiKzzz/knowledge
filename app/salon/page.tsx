'use client'

import { useMutation } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/convex/_generated/api'
import { Button, Eyebrow, Icon, Input, Sheet } from '@/components/ui'
import { currentToken, rejectionMessage } from '@/components/room/common'
import { rememberName, rememberedName } from '@/lib/identity'
import { MAX_PLAYERS } from '@/lib/room'

/** A room code: four characters, as convex/rooms.ts draws them. */
const CODE_LENGTH = 4

/**
 * The way into multiplayer: open a salon, or join one by its code.
 *
 * Both need a name, asked once here. Joining is tried from this page rather than
 * on arrival in the salon, so that a wrong code, a full salon or a name already
 * taken is said right where it was typed.
 */
export default function SalonEntryPage() {
  const router = useRouter()
  const create = useMutation(api.rooms.create)
  const join = useMutation(api.rooms.join)

  const nameInput = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // The remembered name is written straight into the field rather than held in
  // state: the server render cannot read localStorage, and this way the
  // prerendered HTML and the first client render agree.
  useEffect(() => {
    const input = nameInput.current
    if (input && !input.value) input.value = rememberedName()
  }, [])

  async function enter(kind: 'create' | 'join', action: (token: string, name: string) => Promise<string>) {
    const name = nameInput.current?.value.trim() ?? ''
    if (!name) {
      setError('Choisis un nom.')
      nameInput.current?.focus()
      return
    }

    setBusy(kind)
    setError(null)
    try {
      rememberName(name)
      const target = await action(currentToken(), name)
      router.push(`/salon/${target}`)
    } catch (e) {
      setError(
        rejectionMessage(e, kind === 'create' ? 'Impossible de créer un salon.' : 'Le serveur est injoignable.'),
      )
      setBusy(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-8">
      <section className="space-y-3">
        <Eyebrow>Vol de groupe · jusqu&apos;à {MAX_PLAYERS} joueurs</Eyebrow>
        <h1 className="text-5xl leading-[1.05] text-ink">Salon</h1>
        <p className="max-w-xl text-ink-soft">
          Tout le monde affronte la même manche en même temps, et la rapidité rapporte des
          points. Un code suffit pour inviter.
        </p>
      </section>

      <Sheet className="space-y-6 p-5 sm:p-8">
        <div className="space-y-1">
          <label htmlFor="player-name">
            <Eyebrow>Nom du passager</Eyebrow>
          </label>
          <Input
            id="player-name"
            ref={nameInput}
            maxLength={24}
            autoComplete="nickname"
            placeholder="Ton nom"
            aria-describedby="player-name-hint"
          />
          <p id="player-name-hint" className="text-sm text-ink-soft">
            Le nom sous lequel les autres te verront. Aucun compte, aucun mot de passe.
          </p>
        </div>

        <div className="grid gap-6 border-t-2 border-dashed border-rule pt-6 sm:grid-cols-2 sm:gap-0">
          <div className="flex flex-col gap-4 sm:pr-6">
            <div className="space-y-1">
              <h2 className="text-2xl text-ink">Nouveau salon</h2>
              <p className="text-sm text-ink-soft">
                Tu en deviens l&apos;hôte : tu règles et lances les parties.
              </p>
            </div>
            <Button
              size="lg"
              className="self-start"
              disabled={busy !== null}
              onClick={() => void enter('create', (token, name) => create({ token, name }))}
            >
              <Icon name="plane" />
              {busy === 'create' ? 'Création…' : 'Créer un salon'}
            </Button>
          </div>

          <form
            className="flex flex-col gap-4 border-t-2 border-dashed border-rule pt-6 sm:border-t-0 sm:border-l-2 sm:pt-0 sm:pl-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (code.length !== CODE_LENGTH) return
              void enter('join', async (token, name) => {
                await join({ code, token, name })
                return code
              })
            }}
          >
            <div className="space-y-1">
              <h2 className="text-2xl text-ink">Rejoindre</h2>
              <label htmlFor="room-code" className="text-sm text-ink-soft">
                Avec le code que l&apos;hôte t&apos;a donné.
              </label>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <input
                id="room-code"
                value={code}
                // Only what a code can hold: letters and digits, upper case.
                onChange={(event) =>
                  setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH))
                }
                placeholder="KP4T"
                maxLength={CODE_LENGTH}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="h-12 w-40 border-0 border-b-[3px] border-navy bg-transparent px-1 font-mono text-3xl font-semibold tracking-[0.3em] text-navy uppercase outline-none placeholder:text-ink-soft/40 focus-visible:border-stamp"
              />
              <Button type="submit" variant="outline" size="lg" disabled={busy !== null || code.length !== CODE_LENGTH}>
                {busy === 'join' ? 'Embarquement…' : 'Rejoindre'}
              </Button>
            </div>
          </form>
        </div>
      </Sheet>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md border-2 border-stamp/30 bg-stamp/[0.06] px-3 py-2 text-sm text-stamp-deep"
        >
          <Icon name="cross" />
          {error}
        </p>
      )}
    </main>
  )
}
