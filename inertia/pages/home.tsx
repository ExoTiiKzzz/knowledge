import { useState } from 'react'
import { Globe2, Loader2, Swords, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ServerRejection, roomApi } from '@/browser/room-client'

/**
 * Point d'entrée : jouer seul, ou rejoindre un salon.
 *
 * Le solo mène à une page qui ne reparle plus au serveur et fonctionne hors
 * ligne ; le multijoueur à un salon, désigné par un code partageable.
 */
export default function Home() {
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function creer() {
    setErreur(null)
    setEnCours(true)
    try {
      const { code: neuf } = await roomApi.create()
      window.location.href = `/salon/${neuf}`
    } catch (e) {
      setErreur(e instanceof ServerRejection ? e.message : 'Impossible de créer un salon.')
      setEnCours(false)
    }
  }

  function rejoindre(event: React.FormEvent) {
    event.preventDefault()
    const propre = code.trim().toUpperCase()
    if (!propre) return
    window.location.href = `/salon/${propre}`
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
              <Globe2 className="size-6 text-muted-foreground" />
              Géo&nbsp;Quiz
            </h1>
            <p className="text-sm text-muted-foreground">
              Drapeaux, capitales et carte des 194 pays du monde, par continent.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-muted-foreground" />
                Seul
              </CardTitle>
              <CardDescription>
                À ton rythme, sans chronomètre. Fonctionne hors ligne, et ton meilleur score est
                conservé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => (window.location.href = '/solo')}>
                S'entraîner
              </Button>
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="size-4 text-muted-foreground" />
                À plusieurs
              </CardTitle>
              <CardDescription>
                Tout le monde affronte la même manche en même temps, et la rapidité rapporte des
                points.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button size="lg" variant="default" disabled={enCours} onClick={creer}>
                {enCours && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Créer un salon
              </Button>

              <form onSubmit={rejoindre} className="space-y-2">
                <Label htmlFor="code" className="text-muted-foreground">
                  ou rejoindre avec un code
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="KP4T"
                    maxLength={4}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-28 font-mono tracking-widest uppercase"
                  />
                  <Button type="submit" variant="outline" disabled={!code.trim()}>
                    Rejoindre
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {erreur && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erreur}
          </p>
        )}
      </div>
    </div>
  )
}
