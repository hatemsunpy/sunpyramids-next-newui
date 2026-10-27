import type { Locale } from "@/types/api";

type TailorMadeCopy = {
  eyebrow: string;
  title: string;
  lede: string;
  localTeam: string;
  personalised: string;
  ticketFooter: string;
  cta: string;
  ticketTitle: string;
  ticketLine: string;
  stamp: string;
};

const tailorMadeStrings: Record<Locale, TailorMadeCopy> = {
  en: {
    eyebrow: "Travel with Sun Pyramids Tours",
    title: "Tailor-Made Egypt & Multi-Country Tours",
    lede: "Plan your Egypt and multi-country holiday with our local travel team. We create a personalised itinerary around your destinations, dates, interests and budget.",
    localTeam: "Local travel experts",
    personalised: "Personalised itineraries",
    ticketFooter: "Sun Pyramids Tours",
    cta: "Plan my tailor-made trip",
    ticketTitle: "Your journey. Your way.",
    ticketLine: "A route shaped around you",
    stamp: "Made for you",
  },
  fr: {
    eyebrow: "Voyagez avec Sun Pyramids Tours",
    title: "Voyages sur mesure en Égypte et dans plusieurs pays",
    lede: "Préparez votre séjour en Égypte et dans plusieurs pays avec notre équipe locale. Nous créons un itinéraire personnalisé selon vos destinations, vos dates, vos envies et votre budget.",
    localTeam: "Experts locaux du voyage",
    personalised: "Itinéraires personnalisés",
    ticketFooter: "Sun Pyramids Tours",
    cta: "Planifier mon voyage sur mesure",
    ticketTitle: "Votre voyage. Votre style.",
    ticketLine: "Un itinéraire à votre image",
    stamp: "Sur mesure",
  },
  de: {
    eyebrow: "Reisen mit Sun Pyramids Tours",
    title: "Ägypten und mehrere Länder auf einer maßgeschneiderten Reise",
    lede: "Planen Sie Ihre Ägypten- und Mehrländerreise mit unserem lokalen Team. Wir gestalten eine individuelle Route nach Ihren Reisezielen, Terminen, Interessen und Ihrem Budget.",
    localTeam: "Lokale Reiseexperten",
    personalised: "Individuelle Reiserouten",
    ticketFooter: "Sun Pyramids Tours",
    cta: "Meine individuelle Reise planen",
    ticketTitle: "Ihre Reise. Ihr Stil.",
    ticketLine: "Eine Route nach Ihren Wünschen",
    stamp: "Für Sie gemacht",
  },
  it: {
    eyebrow: "Viaggia con Sun Pyramids Tours",
    title: "Tour su misura in Egitto e in più paesi",
    lede: "Organizza il tuo viaggio in Egitto e in più paesi con il nostro team locale. Creiamo un itinerario personalizzato in base a destinazioni, date, interessi e budget.",
    localTeam: "Esperti di viaggio locali",
    personalised: "Itinerari personalizzati",
    ticketFooter: "Sun Pyramids Tours",
    cta: "Pianifica il mio viaggio su misura",
    ticketTitle: "Il tuo viaggio. A modo tuo.",
    ticketLine: "Un itinerario pensato per te",
    stamp: "Su misura",
  },
  pt: {
    eyebrow: "Viaje com a Sun Pyramids Tours",
    title: "Viagens sob medida pelo Egito e por vários países",
    lede: "Planeje sua viagem pelo Egito e por vários países com nossa equipe local. Criamos um roteiro personalizado de acordo com seus destinos, datas, interesses e orçamento.",
    localTeam: "Especialistas locais em viagens",
    personalised: "Roteiros personalizados",
    ticketFooter: "Sun Pyramids Tours",
    cta: "Planejar minha viagem sob medida",
    ticketTitle: "Sua viagem. Do seu jeito.",
    ticketLine: "Um roteiro pensado para você",
    stamp: "Sob medida",
  },
  es: {
    eyebrow: "Viaja con Sun Pyramids Tours",
    title: "Viajes a medida por Egipto y varios países",
    lede: "Planifica tu viaje por Egipto y varios países con nuestro equipo local. Creamos un itinerario personalizado según tus destinos, fechas, intereses y presupuesto.",
    localTeam: "Expertos locales en viajes",
    personalised: "Itinerarios personalizados",
    ticketFooter: "Sun Pyramids Tours",
    cta: "Planificar mi viaje a medida",
    ticketTitle: "Tu viaje. A tu manera.",
    ticketLine: "Un itinerario pensado para ti",
    stamp: "A tu medida",
  },
  zh: {
    eyebrow: "与 Sun Pyramids Tours 一起旅行",
    title: "埃及及多国联游定制行程",
    lede: "与我们的本地旅行团队一起规划埃及及多国之旅。我们根据您的目的地、日期、兴趣和预算，量身设计专属行程。",
    localTeam: "本地旅行专家",
    personalised: "个性化行程",
    ticketFooter: "Sun Pyramids Tours",
    cta: "规划我的定制旅程",
    ticketTitle: "您的旅程，您的方式。",
    ticketLine: "为您量身规划路线",
    stamp: "专属定制",
  },
};

export function tailorMadeCopy(locale: Locale) {
  return tailorMadeStrings[locale];
}
