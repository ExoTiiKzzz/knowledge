import { useRef, useState } from 'react'
import { Globe2 } from 'lucide-react'
import { QuizSetup } from '@/components/QuizSetup'
import { QuizGame } from '@/components/QuizGame'
import { QuizResults } from '@/components/QuizResults'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import { getBestScore, saveBestScore } from '@/browser/best-scores'
import {
  MODES,
  buildQuiz,
  retryQuiz,
  type Answered,
  type Mode,
  type Question,
  type QuestionCount,
  type Scope,
} from '@/lib/quiz'

type Screen =
  | { name: 'setup' }
  /** `round` distingue deux séries de contenu identique (rejouer les mêmes erreurs). */
  | { name: 'playing'; questions: Question[]; round: number }
  | { name: 'results'; answers: Answered[]; isNewBest: boolean }

export default function App() {
  const [mode, setMode] = useState<Mode>('flags')
  const [scope, setScope] = useState<Scope>(null)
  const [count, setCount] = useState<QuestionCount>(20)
  const [screen, setScreen] = useState<Screen>({ name: 'setup' })
  const round = useRef(0)

  function start(questions: Question[]) {
    if (questions.length > 0) setScreen({ name: 'playing', questions, round: ++round.current })
  }

  function finish(answers: Answered[]) {
    const correct = answers.filter((a) => a.verdict.status !== 'wrong').length
    const percent = Math.round((correct / answers.length) * 100)
    setScreen({ name: 'results', answers, isNewBest: saveBestScore(mode, scope, percent) })
  }

  // Une carte a besoin de place : les modes qui en affichent une élargissent la
  // colonne pendant le jeu, les réglages et le récapitulatif restent compacts.
  const wide = screen.name === 'playing' && MODES[mode].needsMap

  return (
    <div className="min-h-dvh bg-background">
      <div
        // Pas de transition sur la largeur : animer `max-width` fait refluer
        // toute la page, alors que l'écran change de toute façon d'un coup.
        className={cn('mx-auto w-full px-4 py-8 sm:py-12', wide ? 'max-w-5xl' : 'max-w-2xl')}
      >
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

        {screen.name === 'setup' && (
          <QuizSetup
            mode={mode}
            scope={scope}
            count={count}
            bestScore={getBestScore(mode, scope)}
            onModeChange={setMode}
            onScopeChange={setScope}
            onCountChange={setCount}
            onStart={() => start(buildQuiz(mode, scope, count))}
          />
        )}

        {screen.name === 'playing' && (
          <QuizGame
            // Remonter le composant force un état de jeu neuf à chaque série.
            key={screen.round}
            mode={mode}
            scope={scope}
            questions={screen.questions}
            onFinish={finish}
            onQuit={() => setScreen({ name: 'setup' })}
          />
        )}

        {screen.name === 'results' && (
          <QuizResults
            mode={mode}
            answers={screen.answers}
            isNewBest={screen.isNewBest}
            onRetryMistakes={() => start(retryQuiz(screen.answers))}
            onReplay={() => start(buildQuiz(mode, scope, count))}
            onBackToSetup={() => setScreen({ name: 'setup' })}
          />
        )}
      </div>
    </div>
  )
}
