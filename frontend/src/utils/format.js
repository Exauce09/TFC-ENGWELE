/** Ajoute le titre « Dr » seulement si le nom ne le porte pas déjà. */
export function nomMedecin(name) {
  const nom = String(name || '').trim();
  if (!nom) return '';
  return /^dr\.?\s/i.test(nom) ? nom : `Dr ${nom}`;
}
