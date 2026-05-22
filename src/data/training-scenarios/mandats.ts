import type { TrainingScenario } from "@/types/training";

export const mandatsScenario: TrainingScenario = {
  id: "mandats",
  title: "Décrocher un mandat exclusif",
  description: "Entraîne-toi à convaincre un vendeur hésitant de signer un mandat exclusif.",
  persona: "warrior",
  personaId: "warrior",
  steps: [
    {
      id: "intro",
      coachLine: "Bonjour ! Aujourd'hui on travaille la signature de mandat exclusif. Tu rencontres un vendeur qui hésite entre plusieurs agences. Je joue son rôle. Présente-toi.",
      expectedAgentResponse: {
        criteria: [
          { key: "self-intro", label: "Présentation personnelle", keywords: ["je m'appelle", "je suis", "mon nom", "conseiller", "agent"] },
          { key: "confidence", label: "Ton assuré", keywords: ["plaisir", "enchanté", "ravi", "heureux", "spécialisé"] },
        ],
        minDurationSec: 5,
      },
    },
    {
      id: "objection-prix",
      coachLine: "Votre prix me semble bas par rapport à mes attentes. Un autre agent m'a dit que mon bien vaut 50 000 euros de plus.",
      expectedAgentResponse: {
        criteria: [
          { key: "acknowledge", label: "Accuser réception de l'objection", keywords: ["je comprends", "c'est normal", "cette question", "tout à fait", "légitime"] },
          { key: "evidence", label: "Appuyer sur des données marché", keywords: ["marché", "comparable", "vendu", "données", "prix", "estimation", "valeur"] },
          { key: "redirect-to-strategy", label: "Rediriger vers la stratégie", keywords: ["stratégie", "plan", "accompagnement", "exclusif", "objectif", "résultat"] },
        ],
        minDurationSec: 10,
      },
    },
    {
      id: "objection-exclusivite",
      coachLine: "Pourquoi je donnerais l'exclusivité à une seule agence ? Je préfère ne pas me fermer des portes.",
      expectedAgentResponse: {
        criteria: [
          { key: "mobilisation", label: "Argument mobilisation totale", keywords: ["100%", "mobilisés", "priorité", "focus", "toute", "énergie", "investissement"] },
          { key: "statistiques", label: "Argument statistique", keywords: ["statistiques", "vendent", "plus vite", "délai", "mieux", "résultats", "prouvé"] },
          { key: "engagement", label: "Engagement personnel", keywords: ["je m'engage", "vous garantis", "promets", "compte sur moi", "responsable"] },
        ],
        minDurationSec: 10,
      },
    },
    {
      id: "negociation-duree",
      coachLine: "D'accord, mais je ne veux pas signer pour 3 mois. Maximum 6 semaines.",
      expectedAgentResponse: {
        criteria: [
          { key: "accept-partiel", label: "Accepter le principe sans capituler", keywords: ["comprends", "souci", "flexible", "discutons", "ensemble"] },
          { key: "expliquer-delai", label: "Expliquer pourquoi le délai est nécessaire", keywords: ["délai", "temps", "visibilité", "acheteurs", "optimiser", "plan de vente"] },
        ],
        minDurationSec: 8,
      },
    },
    {
      id: "closing",
      coachLine: "OK. Je vais y réfléchir encore quelques jours.",
      expectedAgentResponse: {
        criteria: [
          { key: "urgency", label: "Créer l'urgence sans pression", keywords: ["marché", "opportunité", "acheteurs", "moment", "profiter", "maintenant", "prêt"] },
          { key: "next-step", label: "Proposer une prochaine étape concrète", keywords: ["rendez-vous", "rappelle", "jeudi", "vendredi", "signer", "avancer", "aujourd'hui"] },
        ],
        minDurationSec: 8,
      },
    },
    {
      id: "wrap",
      coachLine: "Excellent travail ! Tu as géré les objections avec méthode. Points forts : la reconnaissance des objections et l'ancrage sur le marché. Point à travailler : insuffler plus d'urgence bienveillante en closing. On refait ?",
      expectedAgentResponse: null,
    },
  ],
};
