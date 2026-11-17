import type { Locale } from "@/types/api";

export type DestinationRegion = "middleEast" | "africa" | "europe";

type DirectoryCopy = {
  regions: Record<DestinationRegion, string>;
  transcontinental: string;
  browse: string;
  all: string;
  showing: string;
  overview: string;
  planning: string;
  combineLabel: string;
  combineTitle: string;
  combined: string;
  combineAction: string;
  tailoredLabel: string;
  tailoredTitle: string;
  custom: string;
  whyIntro: string;
  since: string;
  experienceTitle: string;
  experienceDescription: string;
  tailoredReason: string;
  languagesTitle: string;
  languagesDescription: string;
  reviewsTitle: string;
  reviewsDescription: string;
  reviewsAction: string;
  help: string;
  helpDescription: string;
  whatsapp: string;
};

export const destinationDirectoryCopy: Record<Locale, DirectoryCopy> = {
  en: {
    regions: { middleEast: "Middle East", africa: "Africa", europe: "Europe" }, transcontinental: "Europe & Asia",
    browse: "Browse by region", all: "All", showing: "Showing {visible} of {total} destinations",
    overview: "{destinations} destinations across {regions} regions", planning: "Can’t pick just one?",
    combineLabel: "Multi-country tours", combineTitle: "Combine countries in one trip",
    combined: "Pair the pyramids of Egypt with Petra in Jordan. Explore itineraries that bring two or more destinations together.",
    combineAction: "See Multi-Country Tours", tailoredLabel: "Tailor-made", tailoredTitle: "Plan your own itinerary",
    custom: "Share your dates, budget and must-sees. Our team can help plan a private trip through Egypt around them.",
    whyIntro: "Plan your trip with an Egyptian tour operator that brings together local guides, transport and accommodation.",
    since: "Since 1970", experienceTitle: "Over 50 years of travel expertise",
    experienceDescription: "Our team organizes private and group trips across Egypt, from city tours to multi-day itineraries.",
    tailoredReason: "Choose the places you want to visit and the pace that suits you, from a short break to a longer itinerary.",
    languagesTitle: "Browse in your language", languagesDescription: "Choose your preferred language for the destinations guide and trip planner.",
    reviewsTitle: "Traveler reviews", reviewsDescription: "Read what guests share about their trips with Sun Pyramids Tours.", reviewsAction: "Read reviews on Tripadvisor",
    help: "Need help choosing a destination?", helpDescription: "Ask our team about destinations, itineraries or travel dates.",
    whatsapp: "Chat on WhatsApp",
  },
  fr: {
    regions: { middleEast: "Moyen-Orient", africa: "Afrique", europe: "Europe" }, transcontinental: "Europe et Asie",
    browse: "Explorer par région", all: "Toutes", showing: "{visible} destinations sur {total}",
    overview: "{destinations} destinations dans {regions} régions", planning: "Plusieurs destinations vous tentent ?",
    combineLabel: "Circuits multi-pays", combineTitle: "Plusieurs pays en un seul voyage",
    combined: "Associez les pyramides d’Égypte à Pétra en Jordanie. Découvrez nos circuits qui réunissent deux destinations ou plus.",
    combineAction: "Voir les circuits multi-pays", tailoredLabel: "Sur mesure", tailoredTitle: "Créez votre propre itinéraire",
    custom: "Indiquez vos dates, votre budget et les sites à voir. Notre équipe peut vous aider à organiser un voyage privé en Égypte.",
    whyIntro: "Préparez votre séjour avec un voyagiste égyptien qui coordonne guides locaux, transports et hébergement.",
    since: "Depuis 1970", experienceTitle: "Plus de 50 ans d’expérience dans le voyage",
    experienceDescription: "Notre équipe organise des voyages privés et en groupe en Égypte, des visites de ville aux circuits de plusieurs jours.",
    tailoredReason: "Choisissez les lieux à visiter et le rythme de votre séjour, pour une courte escapade ou un circuit plus long.",
    languagesTitle: "Naviguez dans votre langue", languagesDescription: "Choisissez votre langue pour le guide des destinations et la préparation du voyage.",
    reviewsTitle: "Avis des voyageurs", reviewsDescription: "Découvrez les expériences des voyageurs qui sont partis avec Sun Pyramids Tours.", reviewsAction: "Lire les avis sur Tripadvisor",
    help: "Besoin d’aide pour choisir une destination ?", helpDescription: "Parlez à notre équipe des destinations, des circuits ou des dates de voyage.",
    whatsapp: "Discuter sur WhatsApp",
  },
  de: {
    regions: { middleEast: "Naher Osten", africa: "Afrika", europe: "Europa" }, transcontinental: "Europa und Asien",
    browse: "Nach Region entdecken", all: "Alle", showing: "{visible} von {total} Reisezielen",
    overview: "{destinations} Reiseziele in {regions} Regionen", planning: "Mehr als ein Reiseziel im Blick?",
    combineLabel: "Länderkombinationen", combineTitle: "Mehrere Länder auf einer Reise",
    combined: "Verbinden Sie die Pyramiden Ägyptens mit Petra in Jordanien. Entdecken Sie Rundreisen mit zwei oder mehr Reisezielen.",
    combineAction: "Länderkombinationen ansehen", tailoredLabel: "Maßgeschneidert", tailoredTitle: "Planen Sie Ihre eigene Route",
    custom: "Nennen Sie uns Reisedaten, Budget und Wunschziele. Unser Team hilft Ihnen, eine private Ägyptenreise zu planen.",
    whyIntro: "Planen Sie mit einem ägyptischen Reiseveranstalter, der lokale Reiseleitung, Transport und Unterkünfte koordiniert.",
    since: "Seit 1970", experienceTitle: "Über 50 Jahre Reiseerfahrung",
    experienceDescription: "Unser Team organisiert Privat- und Gruppenreisen durch Ägypten, von Stadttouren bis zu mehrtägigen Routen.",
    tailoredReason: "Wählen Sie Ihre Reiseziele und Ihr Tempo, vom Kurzurlaub bis zur längeren Rundreise.",
    languagesTitle: "In Ihrer Sprache stöbern", languagesDescription: "Wählen Sie Ihre bevorzugte Sprache für Reiseziele und Reiseplanung.",
    reviewsTitle: "Bewertungen von Reisenden", reviewsDescription: "Lesen Sie, was Gäste über ihre Reisen mit Sun Pyramids Tours berichten.", reviewsAction: "Bewertungen auf Tripadvisor lesen",
    help: "Brauchen Sie Hilfe bei der Wahl Ihres Reiseziels?", helpDescription: "Fragen Sie unser Team nach Reisezielen, Routen oder Reiseterminen.",
    whatsapp: "Auf WhatsApp chatten",
  },
  it: {
    regions: { middleEast: "Medio Oriente", africa: "Africa", europe: "Europa" }, transcontinental: "Europa e Asia",
    browse: "Esplora per regione", all: "Tutte", showing: "{visible} destinazioni su {total}",
    overview: "{destinations} destinazioni in {regions} regioni", planning: "Ti interessa più di una destinazione?",
    combineLabel: "Tour in più Paesi", combineTitle: "Più Paesi in un solo viaggio",
    combined: "Abbina le piramidi d’Egitto a Petra, in Giordania. Scopri itinerari che uniscono due o più destinazioni.",
    combineAction: "Scopri i tour in più Paesi", tailoredLabel: "Su misura", tailoredTitle: "Crea il tuo itinerario",
    custom: "Indicaci date, budget e luoghi da vedere. Il nostro team può aiutarti a organizzare un viaggio privato in Egitto.",
    whyIntro: "Pianifica con un tour operator egiziano che coordina guide locali, trasporti e alloggi.",
    since: "Dal 1970", experienceTitle: "Oltre 50 anni di esperienza nei viaggi",
    experienceDescription: "Organizziamo viaggi privati e di gruppo in Egitto, dalle visite in città agli itinerari di più giorni.",
    tailoredReason: "Scegli i luoghi da visitare e il ritmo del viaggio, da una breve vacanza a un itinerario più lungo.",
    languagesTitle: "Naviga nella tua lingua", languagesDescription: "Scegli la lingua per esplorare le destinazioni e pianificare il tuo viaggio.",
    reviewsTitle: "Recensioni dei viaggiatori", reviewsDescription: "Scopri cosa raccontano gli ospiti dei loro viaggi con Sun Pyramids Tours.", reviewsAction: "Leggi le recensioni su Tripadvisor",
    help: "Hai bisogno di aiuto per scegliere una destinazione?", helpDescription: "Chiedi al nostro team informazioni su destinazioni, itinerari o date.",
    whatsapp: "Scrivici su WhatsApp",
  },
  pt: {
    regions: { middleEast: "Oriente Médio", africa: "África", europe: "Europa" }, transcontinental: "Europa e Ásia",
    browse: "Explore por região", all: "Todos", showing: "{visible} de {total} destinos",
    overview: "{destinations} destinos em {regions} regiões", planning: "Em dúvida entre vários destinos?",
    combineLabel: "Viagens por vários países", combineTitle: "Vários países em uma só viagem",
    combined: "Combine as pirâmides do Egito com Petra, na Jordânia. Explore roteiros que reúnem dois ou mais destinos.",
    combineAction: "Ver viagens por vários países", tailoredLabel: "Sob medida", tailoredTitle: "Monte seu próprio roteiro",
    custom: "Informe datas, orçamento e lugares que deseja conhecer. Nossa equipe pode ajudar a planejar uma viagem privativa pelo Egito.",
    whyIntro: "Planeje com uma operadora egípcia que coordena guias locais, transporte e hospedagem.",
    since: "Desde 1970", experienceTitle: "Mais de 50 anos de experiência em viagens",
    experienceDescription: "Organizamos viagens privativas e em grupo pelo Egito, de passeios urbanos a roteiros de vários dias.",
    tailoredReason: "Escolha os lugares que vai visitar e o ritmo da viagem, de uma escapada curta a um roteiro mais longo.",
    languagesTitle: "Navegue no seu idioma", languagesDescription: "Escolha seu idioma para explorar destinos e planejar a viagem.",
    reviewsTitle: "Avaliações de viajantes", reviewsDescription: "Veja o que os viajantes contam sobre suas viagens com a Sun Pyramids Tours.", reviewsAction: "Ler avaliações no Tripadvisor",
    help: "Precisa de ajuda para escolher um destino?", helpDescription: "Converse com nossa equipe sobre destinos, roteiros ou datas de viagem.",
    whatsapp: "Conversar no WhatsApp",
  },
  es: {
    regions: { middleEast: "Oriente Medio", africa: "África", europe: "Europa" }, transcontinental: "Europa y Asia",
    browse: "Explora por región", all: "Todos", showing: "{visible} de {total} destinos",
    overview: "{destinations} destinos en {regions} regiones", planning: "¿Te interesa más de un destino?",
    combineLabel: "Circuitos por varios países", combineTitle: "Varios países en un solo viaje",
    combined: "Combina las pirámides de Egipto con Petra, en Jordania. Explora itinerarios que reúnen dos o más destinos.",
    combineAction: "Ver circuitos por varios países", tailoredLabel: "A medida", tailoredTitle: "Crea tu propio itinerario",
    custom: "Cuéntanos tus fechas, presupuesto y lugares imprescindibles. Nuestro equipo puede ayudarte a organizar un viaje privado por Egipto.",
    whyIntro: "Planifica con un operador egipcio que coordina guías locales, transporte y alojamiento.",
    since: "Desde 1970", experienceTitle: "Más de 50 años de experiencia en viajes",
    experienceDescription: "Organizamos viajes privados y en grupo por Egipto, desde visitas urbanas hasta circuitos de varios días.",
    tailoredReason: "Elige los lugares que quieres visitar y tu propio ritmo, desde una escapada corta hasta un itinerario más largo.",
    languagesTitle: "Navega en tu idioma", languagesDescription: "Elige tu idioma para explorar destinos y planificar tu viaje.",
    reviewsTitle: "Opiniones de viajeros", reviewsDescription: "Lee lo que cuentan los viajeros sobre sus viajes con Sun Pyramids Tours.", reviewsAction: "Leer opiniones en Tripadvisor",
    help: "¿Necesitas ayuda para elegir un destino?", helpDescription: "Pregunta a nuestro equipo por destinos, itinerarios o fechas de viaje.",
    whatsapp: "Chatea por WhatsApp",
  },
  zh: {
    regions: { middleEast: "中东", africa: "非洲", europe: "欧洲" }, transcontinental: "欧洲与亚洲",
    browse: "按地区浏览", all: "全部", showing: "显示 {visible} 个目的地，共 {total} 个",
    overview: "探索 {regions} 个地区的 {destinations} 个目的地", planning: "想一次游览多个目的地？",
    combineLabel: "多国行程", combineTitle: "一次旅行，探索多个国家",
    combined: "在同一趟旅程中游览埃及金字塔和约旦佩特拉，探索串联两个或更多目的地的行程。",
    combineAction: "查看多国行程", tailoredLabel: "专属定制", tailoredTitle: "规划您的专属行程",
    custom: "告诉我们您的出行日期、预算和必去景点，我们的团队可协助规划埃及私人行程。",
    whyIntro: "与埃及本地旅行社一起规划行程，统筹当地导游、交通和住宿。",
    since: "始于 1970 年", experienceTitle: "50 多年旅游服务经验",
    experienceDescription: "我们在埃及各地安排私人旅行和团体旅行，从城市观光到多日行程。",
    tailoredReason: "无论是短途度假还是多日深度游，都可以选择想去的地方和适合自己的旅行节奏。",
    languagesTitle: "使用您偏好的语言浏览", languagesDescription: "选择浏览目的地和规划行程时使用的语言。",
    reviewsTitle: "旅客评价", reviewsDescription: "了解旅客与 Sun Pyramids Tours 一同出行的体验。", reviewsAction: "在 Tripadvisor 上阅读评价",
    help: "需要帮您选择目的地吗？", helpDescription: "向我们的团队咨询目的地、行程或出行日期。",
    whatsapp: "通过 WhatsApp 联系",
  },
};
