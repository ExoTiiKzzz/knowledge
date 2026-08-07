import { Check, RotateCcw, Target, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Flag } from '@/components/Flag'
import { cn } from '@/lib/utils'
import { expectedFor, type Answered, type Mode } from '@/lib/quiz'

type QuizResultsProps = {
  mode: Mode
  answers: Answered[]
  isNewBest: boolean
  onRetryMistakes: () => void
  onReplay: () => void
  onBackToSetup: () => void
}

export function QuizResults({
  mode,
  answers,
  isNewBest,
  onRetryMistakes,
  onReplay,
  onBackToSetup,
}: QuizResultsProps) {
  const correct = answers.filter((a) => a.verdict.status !== 'wrong')
  const mistakes = answers.filter((a) => a.verdict.status === 'wrong')
  const percent = answers.length ? Math.round((correct.length / answers.length) * 100) : 0

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-muted-foreground" />
            {verdictHeadline(percent)}
          </CardTitle>
          <CardDescription>
            {correct.length} / {answers.length} — soit {percent} %
            {isNewBest && ' · nouveau record !'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {mistakes.length > 0 && (
            <Button size="lg" onClick={onRetryMistakes}>
              <RotateCcw data-icon="inline-start" />
              Rejouer mes {mistakes.length} erreur{mistakes.length > 1 ? 's' : ''}
            </Button>
          )}
          <Button size="lg" variant={mistakes.length > 0 ? 'outline' : 'default'} onClick={onReplay}>
            Nouvelle série
          </Button>
          <Button size="lg" variant="ghost" onClick={onBackToSetup}>
            Changer de réglages
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul>
            {answers.map((answer, position) => (
              <li key={answer.country.code}>
                {position > 0 && <Separator />}
                <AnswerRow answer={answer} mode={mode} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function AnswerRow({ answer, mode }: { answer: Answered; mode: Mode }) {
  const wrong = answer.verdict.status === 'wrong'
  const expected = expectedFor(answer.country, mode)

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Flag code={answer.country.code} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {mode === 'flags' ? answer.country.name : expected}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {mode === 'flags' ? answer.country.continent : answer.country.name}
        </p>
      </div>

      {wrong ? (
        <div className="flex items-center gap-2">
          {answer.input?.trim() ? (
            <Badge variant="outline" className="max-w-44 gap-1.5">
              {/* Le drapeau de ce que la réponse désignait, s'il a pu être identifié. */}
              {answer.guess && <Flag code={answer.guess.country.code} className="h-3.5" />}
              <span className="truncate line-through">{answer.input.trim()}</span>
            </Badge>
          ) : (
            <Badge variant="outline">passé</Badge>
          )}
          <X className="size-4 shrink-0 text-destructive" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {answer.verdict.status === 'close' && <Badge variant="secondary">presque</Badge>}
          <Check className={cn('size-4 shrink-0', 'text-emerald-600 dark:text-emerald-400')} />
        </div>
      )}
    </div>
  )
}

function verdictHeadline(percent: number): string {
  if (percent === 100) return 'Sans faute !'
  if (percent >= 80) return 'Très bien'
  if (percent >= 60) return 'Pas mal'
  if (percent >= 40) return 'À retravailler'
  return 'Il y a du chemin'
}
