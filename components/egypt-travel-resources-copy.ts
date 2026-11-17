import type { Locale } from "@/types/api";

type ResourcesCopy = {
  guideTitle: string;
  guideIntro: string;
  guideLink: string;
  journalTitle: string;
  journalLink: string;
  faqTitle: string;
  faqIntro: string;
  quote: string;
  faqLink: string;
};

export const egyptTravelResourcesCopy: Record<Locale, ResourcesCopy> = {
  en: {
    guideTitle: "Discover More About Egypt",
    guideIntro: "Explore Egypt’s history and landscapes with ideas for your itinerary and practical advice for the road.",
    guideLink: "Read the travel guide",
    journalTitle: "Travel journal",
    journalLink: "See all articles",
    faqTitle: "Frequently Asked Questions",
    faqIntro: "Find answers to common questions about planning your trip to Egypt.",
    quote: "Get a free quote",
    faqLink: "See all FAQs",
  },
  fr: {
    guideTitle: "Découvrez l’Égypte",
    guideIntro: "Explorez l’histoire et les paysages de l’Égypte. Trouvez des idées d’itinéraires et des conseils pratiques pour votre voyage.",
    guideLink: "Lire le guide de voyage",
    journalTitle: "Carnet de voyage",
    journalLink: "Voir tous les articles",
    faqTitle: "Questions fréquentes",
    faqIntro: "Retrouvez les réponses aux questions les plus courantes pour préparer votre voyage en Égypte.",
    quote: "Demander un devis gratuit",
    faqLink: "Voir toutes les questions",
  },
  de: {
    guideTitle: "Ägypten entdecken",
    guideIntro: "Entdecken Sie Ägyptens Geschichte und Landschaften. Hier finden Sie Routenideen und praktische Tipps für Ihre Reise.",
    guideLink: "Reiseführer lesen",
    journalTitle: "Reisejournal",
    journalLink: "Alle Artikel ansehen",
    faqTitle: "Häufig gestellte Fragen",
    faqIntro: "Hier finden Sie Antworten auf häufige Fragen zur Planung Ihrer Ägyptenreise.",
    quote: "Kostenloses Angebot anfragen",
    faqLink: "Alle Fragen ansehen",
  },
  it: {
    guideTitle: "Scopri l’Egitto",
    guideIntro: "Esplora la storia e i paesaggi dell’Egitto con itinerari e consigli pratici per il tuo viaggio.",
    guideLink: "Leggi la guida di viaggio",
    journalTitle: "Diario di viaggio",
    journalLink: "Vedi tutti gli articoli",
    faqTitle: "Domande frequenti",
    faqIntro: "Trova le risposte alle domande più comuni per organizzare il tuo viaggio in Egitto.",
    quote: "Richiedi un preventivo gratuito",
    faqLink: "Vedi tutte le domande",
  },
  pt: {
    guideTitle: "Descubra o Egito",
    guideIntro: "Explore a história e as paisagens do Egito com ideias de itinerários e conselhos práticos para a sua viagem.",
    guideLink: "Leia o guia de viagem",
    journalTitle: "Diário de viagem",
    journalLink: "Ver todos os artigos",
    faqTitle: "Perguntas frequentes",
    faqIntro: "Encontre respostas às perguntas mais comuns sobre como planear a sua viagem ao Egito.",
    quote: "Pedir um orçamento gratuito",
    faqLink: "Ver todas as perguntas",
  },
  es: {
    guideTitle: "Descubre Egipto",
    guideIntro: "Explora la historia y los paisajes de Egipto con ideas de itinerarios y consejos prácticos para tu viaje.",
    guideLink: "Leer la guía de viaje",
    journalTitle: "Diario de viaje",
    journalLink: "Ver todos los artículos",
    faqTitle: "Preguntas frecuentes",
    faqIntro: "Encuentra respuestas a las preguntas más habituales para preparar tu viaje a Egipto.",
    quote: "Solicitar un presupuesto gratuito",
    faqLink: "Ver todas las preguntas",
  },
  zh: {
    guideTitle: "深入了解埃及",
    guideIntro: "探索埃及的历史与风光，获取行程灵感与实用旅行建议。",
    guideLink: "阅读旅行指南",
    journalTitle: "旅行日志",
    journalLink: "查看全部文章",
    faqTitle: "常见问题",
    faqIntro: "了解规划埃及之旅时的常见问题。",
    quote: "获取免费报价",
    faqLink: "查看全部常见问题",
  },
};
