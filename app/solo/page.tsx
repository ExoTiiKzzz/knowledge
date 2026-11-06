'use client'

import { useRef, useState } from 'react'
import { usePassport } from '@/components/Passport'
import { QuizGame, type FinishedGame, type Played, type Stop } from '@/components/QuizGame'
import { QuizResults } from '@/components/QuizResults'
import { QuizSetup } from '@/components/QuizSetup'
import { Eyebrow } from '@/components/ui'
import { bestOf, type Earned } from '@/lib/progress'
import {
  buildQuiz,
  retryQuiz,
  type Mode,
  type Question,
  type QuestionCount,
  type Scope,
} from '@/lib/quiz'

type Screen =
  | { name: 'setup' }
  /** `round` distingue deux parties de contenu identique (rejouer les mêmes erreurs). */
  /** `retry` : une partie limitée aux erreurs de la précédente, qui ne compte pas pour le record. */
  | { name: 'playing'; stops: Stop[]; round: number; retry: boolean }
  | { name: 'results'; answers: Played[]; earned: Earned | null | undefined; round: number }

/**
 * Le solo : réglage, partie, résultat.
 *
 * Tout se joue dans le navigateur. Le passeport d'un invité y vit aussi, si
 * bien qu'une fois la page chargée, le solo n'a plus besoin d'aucun serveur.
 */
export default function SoloPage() {
  const { progress, record } = usePassport()
  const [mode, setMode] = useState<Mode>('flags')
  const [scope, setScope] = useState<Scope>(null)
  const [count, setCount] = useState<QuestionCount>(20)
  const [screen, setScreen] = useState<Screen>({ name: 'setup' })
  const round = useRef(0)

  function start(questions: Question[], retry = false) {
    if (questions.length === 0) return
    setScreen({
      name: 'playing',
      stops: questions.map((question) => ({ mode, question })),
      round: ++round.current,
      retry,
    })
  }

  function finish(game: FinishedGame, finished: number, retry: boolean) {
    // Le résultat s'affiche aussitôt ; ce que le carnet en retient le rejoint
    // quand il répond. Un enregistrement en échec n'empêche pas de voir son score.
    setScreen({ name: 'results', answers: game.answered, earned: undefined, round: finished })
    const settle = (earned: Earned | null) =>
      setScreen((current) =>
        // Une réponse tardive ne doit pas réécrire l'écran d'une autre partie.
        current.name === 'results' && current.round === finished ? { ...current, earned } : current,
      )
    record({ kind: 'solo', mode, scope, answers: game.recorded, retry }).then(settle, () => settle(null))
  }

  return (
    <main className="w-full flex-1 px-4 py-8 sm:px-8 sm:py-10">
      {screen.name === 'setup' && (
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header className="space-y-1">
            <Eyebrow>Solo · vol libre</Eyebrow>
            <h1 className="text-4xl text-ink sm:text-5xl">Où partons-nous ?</h1>
            <p className="text-ink-soft">
              Drapeaux, capitales et carte des pays du monde. Chaque bonne réponse tamponne ton carnet.
            </p>
          </header>
          <QuizSetup
            mode={mode}
            scope={scope}
            count={count}
            bestScore={progress ? bestOf(progress, mode, scope) : undefined}
            onModeChange={setMode}
            onScopeChange={setScope}
            onCountChange={setCount}
            onStart={() => start(buildQuiz(mode, scope, count))}
          />
        </div>
      )}

      {screen.name === 'playing' && (
        <>
          <h1 className="sr-only">Partie solo</h1>
          <QuizGame
            // Remonter le composant force un état de jeu neuf à chaque partie.
            key={screen.round}
            stops={screen.stops}
            scope={scope}
            onFinish={(game) => finish(game, screen.round, screen.retry)}
            onQuit={() => setScreen({ name: 'setup' })}
          />
        </>
      )}

      {screen.name === 'results' && (
        <>
          <h1 className="sr-only">Résultat de la partie</h1>
          <QuizResults
            kind="solo"
            answers={screen.answers}
            earned={screen.earned}
            onRetryMistakes={() => start(retryQuiz(screen.answers), true)}
            onReplay={() => start(buildQuiz(mode, scope, count))}
            onBackToSetup={() => setScreen({ name: 'setup' })}
          />
        </>
      )}
    </main>
  )
}
