# 01 — Tirage reproductible par graine

**What to build:** la composition d'une série devient reproductible. Deux tirages menés avec la
même graine produisent la même suite de questions, dans le même ordre. C'est le prérequis de la
couture de test du moteur de salon : sans lui, aucun cas limite du multijoueur ne se provoque de
façon déterministe. Le solo, qui ne fournit pas de graine, se comporte exactement comme avant.

**Blocked by:** None — can start immediately.

**Status:** done

- [ ] Une même graine produit deux fois la série identique, pour un mode et un périmètre donnés
- [ ] Deux graines différentes produisent des séries différentes
- [ ] Sans graine fournie, le tirage reste imprévisible d'une partie solo à l'autre
- [ ] Le rejeu des seules erreurs accepte aussi une graine
- [ ] Aucun appel à l'aléatoire global ne subsiste dans la composition d'une série
- [ ] Les 114 tests existants passent sans modification

## Comments

Livré. Un générateur ensemençable (`mulberry32`) vit à part du quiz ; `buildQuiz` et `retryQuiz`
acceptent un générateur en dernier paramètre, par défaut l'aléatoire global — le solo est donc
inchangé. 24 tests couvrent la reproductibilité, la distribution et l'absence de répétition.
