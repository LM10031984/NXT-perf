/**
 * Chart fixtures (NOT mock domain data).
 *
 * Données de visualisation graphique uniquement (séries CA mensuelles pour LineChart).
 * Distinguées de `@/data/mock-*.ts` pour clarifier que ce ne sont pas des PeriodResults
 * et qu'aucun accessor data-access ne s'applique ici.
 *
 * MIGRATION: remplacer ce tableau par une dérivation depuis les vrais PeriodResults
 * historiques quand la Supabase phase shippera l'historique multi-mois.
 */
export const mockMonthlyCA: { month: string; ca: number }[] = [
  { month: "Sep", ca: 6200 },
  { month: "Oct", ca: 8500 },
  { month: "Nov", ca: 15200 },
  { month: "Déc", ca: 12000 },
  { month: "Jan", ca: 9800 },
  { month: "Fév", ca: 8500 },
];
