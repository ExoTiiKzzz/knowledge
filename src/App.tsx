import { useRef, useState } from 'react'
import { Globe2 } from 'lucide-react'
import { QuizSetup } from '@/components/QuizSetup'
import { QuizGame } from '@/components/QuizGame'
import { QuizResults } from '@/components/QuizResults'
import { ThemeToggle } from '@/components/ThemeToggle'
import { getBestScore, saveBestScore } from '@/lib/best-scores'
import {
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
              Drapeaux et capitales des 194 pays du monde, par continent.
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
