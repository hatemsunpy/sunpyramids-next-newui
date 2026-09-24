import type { Locale } from "@/types/api";

type SectionLabels = {
  why: string;
  seasonal: string;
  plan: string;
  offers: string;
  how: string;
  destinations: string;
  blogs: string;
  sustainability: string;
  gallery: string;
  faq: string;
  help: string;
};

const labels: Record<Locale, SectionLabels> = {
  en: {
    why: "Our Difference",
    seasonal: "Seasonal Journeys",
    plan: "Plan Your Journey",
    offers: "Tour Offers",
    how: "Three Simple Steps",
    destinations: "Explore Egypt",
    blogs: "Travel Stories",
    sustainability: "Responsible Travel",
    gallery: "Travel Moments",
    faq: "Good to Know",
    help: "Trip Planning Help",
  },
  fr: {
    why: "Notre différence",
    seasonal: "Voyages de saison",
    plan: "Planifiez votre voyage",
    offers: "Offres de circuits",
    how: "Trois étapes simples",
    destinations: "Explorez l’Égypte",
    blogs: "Récits de voyage",
    sustainability: "Voyage responsable",
    gallery: "Moments de voyage",
    faq: "Bon à savoir",
    help: "Aide à la planification",
  },
  de: {
    why: "Unser Unterschied",
    seasonal: "Saisonale Reisen",
    plan: "Reise planen",
    offers: "Reiseangebote",
    how: "Drei einfache Schritte",
    destinations: "Ägypten entdecken",
    blogs: "Reisegeschichten",
    sustainability: "Verantwortungsvolles Reisen",
    gallery: "Reisemomente",
    faq: "Gut zu wissen",
    help: "Hilfe bei der Reiseplanung",
  },
  it: {
    why: "La nostra differenza",
    seasonal: "Viaggi stagionali",
    plan: "Pianifica il tuo viaggio",
    offers: "Offerte di viaggio",
    how: "Tre semplici passi",
    destinations: "Esplora l’Egitto",
    blogs: "Storie di viaggio",
    sustainability: "Viaggio responsabile",
    gallery: "Momenti di viaggio",
    faq: "Buono a sapersi",
    help: "Aiuto per pianificare",
  },
  pt: {
    why: "O nosso diferencial",
    seasonal: "Viagens sazonais",
    plan: "Planeie a sua viagem",
    offers: "Ofertas de passeios",
    how: "Três passos simples",
    destinations: "Explore o Egito",
    blogs: "Histórias de viagem",
    sustainability: "Viagem responsável",
    gallery: "Momentos de viagem",
    faq: "É bom saber",
    help: "Ajuda para planear a viagem",
  },
  es: {
    why: "Nuestra diferencia",
    seasonal: "Viajes de temporada",
    plan: "Planifica tu viaje",
    offers: "Ofertas de tours",
    how: "Tres pasos sencillos",
    destinations: "Explora Egipto",
    blogs: "Historias de viaje",
    sustainability: "Viajes responsables",
    gallery: "Momentos de viaje",
    faq: "Información útil",
    help: "Ayuda para planificar",
  },
  zh: {
    why: "我们的优势",
    seasonal: "季节精选行程",
    plan: "规划您的旅程",
    offers: "旅游优惠",
    how: "简单三步",
    destinations: "探索埃及",
    blogs: "旅行故事",
    sustainability: "负责任的旅行",
    gallery: "旅行瞬间",
    faq: "出行须知",
    help: "行程规划帮助",
  },
};

export function homeSectionLabels(locale: Locale): SectionLabels {
  return labels[locale] ?? labels.en;
}
