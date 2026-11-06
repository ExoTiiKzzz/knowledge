/** Joins the class names that are set. No merging: a later class does not override an earlier one. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
