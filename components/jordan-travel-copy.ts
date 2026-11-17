import type { Locale } from "@/types/api";

type TravelCopy = {
  essentials: string;
  facts: [capital: string, currency: string, language: string];
  amman: string;
  seasons: string;
  seasonDetails: [[string, string], [string, string], [string, string], [string, string]];
  places: string;
  guide: string;
  entry: string;
  information: string;
  questions: string;
  quote: string;
  inquiry: string;
  dates: [arrival: string, departure: string];
  draft: string;
};

// The seasonal notes summarize the Jordan Tourism Board's Petra guidance.
export const jordanTravelCopy: Record<Locale, TravelCopy> = {
  en: {
    essentials: "Jordan travel essentials", facts: ["Capital", "Currency", "Official language"], amman: "Amman",
    seasons: "When to visit Jordan", seasonDetails: [
      ["Spring", "Mild days are well suited to longer walks in Petra."],
      ["Summer", "Start outdoor sightseeing early to avoid the afternoon heat."],
      ["Autumn", "Walking weather is generally comfortable, with cooler evenings as the season progresses."],
      ["Winter", "Pack layers for cool days and leave room in your plans for rain."],
    ],
    places: "Places to visit", guide: "Official Jordan travel guide", entry: "Check entry requirements", information: "Visitor information",
    questions: "Questions about your Jordan trip?", quote: "Request a Jordan trip quote",
    inquiry: "Hello Sun Pyramids Tours, I’d like help planning a trip to Jordan. Could you share itinerary options?",
    dates: ["Arrival", "Departure"], draft: "Opens a WhatsApp draft with any trip details you enter.",
  },
  fr: {
    essentials: "Informations pratiques sur la Jordanie", facts: ["Capitale", "Monnaie", "Langue officielle"], amman: "Amman",
    seasons: "Quand visiter la Jordanie ?", seasonDetails: [
      ["Printemps", "Les journées douces se prêtent aux longues promenades à Pétra."],
      ["Été", "Commencez les visites en plein air tôt pour éviter la chaleur de l’après-midi."],
      ["Automne", "Les journées sont généralement agréables pour marcher et les soirées se rafraîchissent."],
      ["Hiver", "Prévoyez des vêtements à superposer et un programme flexible en cas de pluie."],
    ],
    places: "Lieux à visiter", guide: "Guide officiel de la Jordanie", entry: "Consulter les conditions d’entrée", information: "Informations pour les visiteurs",
    questions: "Des questions sur votre voyage en Jordanie ?", quote: "Demandez un devis pour la Jordanie",
    inquiry: "Bonjour Sun Pyramids Tours, pourriez-vous me conseiller des itinéraires pour un voyage en Jordanie ?",
    dates: ["Arrivée", "Départ"], draft: "Ouvre un brouillon WhatsApp avec les informations renseignées.",
  },
  de: {
    essentials: "Reiseinformationen für Jordanien", facts: ["Hauptstadt", "Währung", "Amtssprache"], amman: "Amman",
    seasons: "Wann Sie Jordanien besuchen können", seasonDetails: [
      ["Frühling", "Milde Tage eignen sich für längere Spaziergänge in Petra."],
      ["Sommer", "Beginnen Sie Besichtigungen im Freien früh, um die Nachmittagshitze zu meiden."],
      ["Herbst", "Tagsüber ist es meist angenehm zum Wandern, abends wird es zunehmend kühler."],
      ["Winter", "Nehmen Sie Kleidung in mehreren Schichten mit und planen Sie flexibel für Regentage."],
    ],
    places: "Sehenswerte Orte", guide: "Offizieller Reiseführer für Jordanien", entry: "Einreisebestimmungen prüfen", information: "Besucherinformationen",
    questions: "Fragen zu Ihrer Jordanienreise?", quote: "Angebot für Ihre Jordanienreise anfragen",
    inquiry: "Hallo Sun Pyramids Tours, können Sie mir bei der Planung einer Jordanienreise helfen und Routenvorschläge schicken?",
    dates: ["Anreise", "Abreise"], draft: "Öffnet einen WhatsApp-Entwurf mit Ihren eingegebenen Reisedaten.",
  },
  it: {
    essentials: "Informazioni utili sulla Giordania", facts: ["Capitale", "Valuta", "Lingua ufficiale"], amman: "Amman",
    seasons: "Quando visitare la Giordania", seasonDetails: [
      ["Primavera", "Le giornate miti sono adatte a passeggiate più lunghe a Petra."],
      ["Estate", "Inizia le visite all’aperto di prima mattina per evitare il caldo del pomeriggio."],
      ["Autunno", "Il clima è spesso piacevole per camminare e le serate diventano più fresche."],
      ["Inverno", "Porta abiti a strati e mantieni flessibile il programma in caso di pioggia."],
    ],
    places: "Luoghi da visitare", guide: "Guida ufficiale della Giordania", entry: "Verifica i requisiti di ingresso", information: "Informazioni per i visitatori",
    questions: "Hai domande sul tuo viaggio in Giordania?", quote: "Richiedi un preventivo per la Giordania",
    inquiry: "Salve Sun Pyramids Tours, potreste aiutarmi a pianificare un viaggio in Giordania e suggerirmi degli itinerari?",
    dates: ["Arrivo", "Partenza"], draft: "Apre una bozza WhatsApp con le informazioni che inserisci.",
  },
  pt: {
    essentials: "Informações essenciais sobre a Jordânia", facts: ["Capital", "Moeda", "Idioma oficial"], amman: "Amã",
    seasons: "Quando visitar a Jordânia", seasonDetails: [
      ["Primavera", "As temperaturas amenas favorecem caminhadas mais longas em Petra."],
      ["Verão", "Comece as visitas ao ar livre cedo para evitar o calor da tarde."],
      ["Outono", "As temperaturas costumam ser agradáveis para caminhar, com noites mais frescas."],
      ["Inverno", "Leve roupas em camadas para os dias frios e deixe o roteiro flexível para a chuva."],
    ],
    places: "Lugares para visitar", guide: "Guia oficial da Jordânia", entry: "Confira os requisitos de entrada", information: "Informações para visitantes",
    questions: "Dúvidas sobre sua viagem à Jordânia?", quote: "Solicite um orçamento para a Jordânia",
    inquiry: "Olá, Sun Pyramids Tours! Gostaria de ajuda para planejar uma viagem à Jordânia. Podem me indicar opções de roteiro?",
    dates: ["Chegada", "Partida"], draft: "Abre um rascunho no WhatsApp com os dados da viagem que você informar.",
  },
  es: {
    essentials: "Información práctica sobre Jordania", facts: ["Capital", "Moneda", "Idioma oficial"], amman: "Amán",
    seasons: "Cuándo visitar Jordania", seasonDetails: [
      ["Primavera", "Los días templados son ideales para paseos más largos por Petra."],
      ["Verano", "Empieza temprano las visitas al aire libre para evitar el calor de la tarde."],
      ["Otoño", "El tiempo suele ser agradable para caminar y las noches se vuelven más frescas."],
      ["Invierno", "Lleva varias capas de ropa y deja margen para cambiar el plan si llueve."],
    ],
    places: "Lugares para visitar", guide: "Guía oficial de Jordania", entry: "Consulta los requisitos de entrada", information: "Información para visitantes",
    questions: "¿Dudas sobre tu viaje a Jordania?", quote: "Pide un presupuesto para Jordania",
    inquiry: "Hola, Sun Pyramids Tours. ¿Podrían ayudarme a planificar un viaje a Jordania y enviarme opciones de itinerario?",
    dates: ["Llegada", "Salida"], draft: "Abre un borrador en WhatsApp con los datos del viaje que indiques.",
  },
  zh: {
    essentials: "约旦旅行实用信息", facts: ["首都", "货币", "官方语言"], amman: "安曼",
    seasons: "何时游览约旦", seasonDetails: [
      ["春季", "温和的天气适合在佩特拉长时间步行。"],
      ["夏季", "尽早开始户外游览，避开午后的高温。"],
      ["秋季", "白天通常适合步行，随着季节推移，夜晚会逐渐变凉。"],
      ["冬季", "准备便于叠穿的衣物，行程留有余地，以应对降雨。"],
    ],
    places: "值得一去的地方", guide: "约旦官方旅游指南", entry: "查看入境要求", information: "游客实用信息",
    questions: "对约旦之旅有疑问？", quote: "获取约旦旅行报价",
    inquiry: "您好，Sun Pyramids Tours！我想规划约旦之旅，能推荐一些行程吗？",
    dates: ["抵达日期", "离开日期"], draft: "将在 WhatsApp 中打开包含已填写旅行信息的消息草稿。",
  },
};
