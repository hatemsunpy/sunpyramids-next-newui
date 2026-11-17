import type { Locale } from "@/types/api";

type Fact = readonly [label: string, value: string, detail: string];
type Tip = readonly [label: string, detail: string];

type EgyptEssentialsCopy = {
  title: string;
  intro: string;
  facts: readonly [Fact, Fact, Fact, Fact, Fact, Fact];
  tips: readonly [Tip, Tip, Tip, Tip];
  visaLink: string;
  visitorInfoLink: string;
};

export const egyptEssentialsCopy: Record<Locale, EgyptEssentialsCopy> = {
  en: {
    title: "Egypt essentials",
    intro: "From Cairo’s museums and the temples along the Nile to the reefs of the Red Sea, there’s a lot to fit into a visit. Here’s what to know before you go.",
    facts: [
      ["Capital", "Cairo", "Start in the capital for the Giza pyramids, museums and historic markets."],
      ["Currency", "Egyptian pound", "Keep Egyptian pounds (EGP) on hand for markets, taxis and small purchases."],
      ["Visa", "Check your eligibility", "Entry requirements and visa options depend on your passport and how you arrive."],
      ["Suggested trip length", "7–14 days", "A week is a good start for Cairo and Luxor. Allow more time for Aswan or the Red Sea."],
      ["Language", "Arabic", "English is widely used in hotels and at major visitor sites."],
      ["Time zone", "UTC+2", "Egypt changes its clocks seasonally. Check the local time when booking connections."],
    ],
    tips: [
      ["Dress for the site", "Pack a light layer to cover shoulders and knees at mosques and other religious sites."],
      ["Carry small notes", "Use small Egyptian pound notes for tips and everyday purchases."],
      ["Bring drinking water", "Take sealed bottled water on longer visits, especially in hot weather."],
      ["Check your travel insurance", "Read your policy’s limits for medical care, cancellations and planned activities."],
    ],
    visaLink: "Official Egypt e‑Visa portal",
    visitorInfoLink: "Official visitor information",
  },
  fr: {
    title: "L’essentiel pour visiter l’Égypte",
    intro: "Des musées du Caire aux récifs de la mer Rouge en passant par les temples du Nil, l’Égypte a beaucoup à offrir. Voici ce qu’il faut savoir avant de partir.",
    facts: [
      ["Capitale", "Le Caire", "Commencez par la capitale pour découvrir les pyramides de Gizeh, les musées et les marchés historiques."],
      ["Monnaie", "Livre égyptienne", "Prévoyez des livres égyptiennes (EGP) pour les marchés, les taxis et les petits achats."],
      ["Visa", "Vérifiez votre admissibilité", "Les conditions d’entrée et les options de visa dépendent de votre passeport et de votre point d’arrivée."],
      ["Durée conseillée", "7 à 14 jours", "Une semaine permet de visiter Le Caire et Louxor. Prévoyez davantage de temps pour Assouan ou la mer Rouge."],
      ["Langue", "Arabe", "L’anglais est courant dans les hôtels et sur les principaux sites touristiques."],
      ["Fuseau horaire", "UTC+2", "L’Égypte change d’heure selon la saison. Vérifiez l’heure locale de vos correspondances."],
    ],
    tips: [
      ["Adaptez votre tenue", "Prévoyez un vêtement léger couvrant épaules et genoux pour les sites religieux."],
      ["Gardez de petites coupures", "Elles sont utiles pour les pourboires et les achats du quotidien."],
      ["Emportez de l’eau potable", "Prenez de l’eau en bouteille scellée pour les longues visites, surtout par temps chaud."],
      ["Vérifiez votre assurance", "Vérifiez les limites de couverture pour les soins, les annulations et vos activités."],
    ],
    visaLink: "Portail officiel du visa électronique",
    visitorInfoLink: "Informations touristiques officielles",
  },
  de: {
    title: "Das Wichtigste für Ägypten",
    intro: "Von Kairos Museen über die Tempel am Nil bis zu den Riffen im Roten Meer gibt es viel zu entdecken. Das sollten Sie vor der Abreise wissen.",
    facts: [
      ["Hauptstadt", "Kairo", "Entdecken Sie von der Hauptstadt aus die Pyramiden von Gizeh, Museen und historische Märkte."],
      ["Währung", "Ägyptisches Pfund", "Halten Sie ägyptische Pfund (EGP) für Märkte, Taxis und kleinere Einkäufe bereit."],
      ["Visum", "Voraussetzungen prüfen", "Einreise und Visa richten sich nach Ihrem Reisepass und der Art der Anreise."],
      ["Empfohlene Reisedauer", "7–14 Tage", "Für Kairo und Luxor ist eine Woche ein guter Anfang. Planen Sie für Assuan oder das Rote Meer mehr Zeit ein."],
      ["Sprache", "Arabisch", "In Hotels und an wichtigen Sehenswürdigkeiten ist Englisch verbreitet."],
      ["Zeitzone", "UTC+2", "Ägypten stellt die Uhren saisonal um. Prüfen Sie die Ortszeit bei der Buchung von Anschlüssen."],
    ],
    tips: [
      ["Passende Kleidung einpacken", "Nehmen Sie für Moscheen und andere religiöse Stätten ein leichtes Kleidungsstück mit, das Schultern und Knie bedeckt."],
      ["Kleine Scheine mitnehmen", "Kleine Pfundscheine sind für Trinkgeld und alltägliche Einkäufe praktisch."],
      ["Trinkwasser mitnehmen", "Bei längeren Besichtigungen, besonders bei Hitze, ist abgefülltes Wasser sinnvoll."],
      ["Reiseversicherung prüfen", "Lesen Sie die Bedingungen für medizinische Versorgung, Stornierungen und geplante Aktivitäten."],
    ],
    visaLink: "Offizielles Portal für das E-Visum",
    visitorInfoLink: "Offizielle Reiseinformationen",
  },
  it: {
    title: "Informazioni essenziali sull’Egitto",
    intro: "Tra i musei del Cairo, i templi lungo il Nilo e le barriere coralline del Mar Rosso, c’è molto da vedere. Ecco cosa sapere prima di partire.",
    facts: [
      ["Capitale", "Il Cairo", "Parti dalla capitale per visitare le piramidi di Giza, i musei e i mercati storici."],
      ["Valuta", "Sterlina egiziana", "Tieni a disposizione sterline egiziane (EGP) per mercati, taxi e piccoli acquisti."],
      ["Visto", "Verifica i requisiti", "Le condizioni d’ingresso e le opzioni per il visto dipendono dal passaporto e dal modo in cui arrivi."],
      ["Durata consigliata", "7–14 giorni", "Una settimana è un buon punto di partenza per Il Cairo e Luxor. Prevedi più tempo se aggiungi Assuan o il Mar Rosso."],
      ["Lingua", "Arabo", "L’inglese è diffuso negli alberghi e nei principali luoghi turistici."],
      ["Fuso orario", "UTC+2", "In Egitto l’ora cambia a seconda della stagione. Controlla l’orario locale quando prenoti le coincidenze."],
    ],
    tips: [
      ["Scegli abiti adatti", "Per moschee e altri luoghi di culto porta un indumento leggero che copra spalle e ginocchia."],
      ["Porta banconote di piccolo taglio", "Sono comode per le mance e le piccole spese."],
      ["Porta acqua da bere", "Per le visite più lunghe, soprattutto con il caldo, porta acqua in bottiglia sigillata."],
      ["Controlla l’assicurazione", "Verifica i limiti della copertura per cure mediche, cancellazioni e attività in programma."],
    ],
    visaLink: "Portale ufficiale per il visto elettronico",
    visitorInfoLink: "Informazioni turistiche ufficiali",
  },
  pt: {
    title: "O essencial sobre o Egito",
    intro: "Há muito para conhecer, dos museus do Cairo aos recifes do Mar Vermelho, passando pelos templos às margens do Nilo. Veja o que saber antes de viajar.",
    facts: [
      ["Capital", "Cairo", "Comece pela capital para conhecer as pirâmides de Gizé, os museus e os mercados históricos."],
      ["Moeda", "Libra egípcia", "Tenha libras egípcias (EGP) em mãos para mercados, táxis e pequenas compras."],
      ["Visto", "Consulte os requisitos", "As exigências de entrada e as opções de visto dependem do seu passaporte e do modo de chegada."],
      ["Duração recomendada", "7 a 14 dias", "Uma semana é um bom começo para Cairo e Luxor. Reserve mais tempo para Assuã ou o Mar Vermelho."],
      ["Idioma", "Árabe", "O inglês é comum nos hotéis e nas principais atrações turísticas."],
      ["Fuso horário", "UTC+2", "O Egito ajusta os relógios conforme a estação. Confira o horário local ao reservar conexões."],
    ],
    tips: [
      ["Vista-se de acordo com o local", "Para visitar mesquitas e outros locais religiosos, leve uma peça leve que cubra os ombros e os joelhos."],
      ["Tenha notas de valor baixo", "Elas facilitam gorjetas e compras do dia a dia."],
      ["Leve água para beber", "Leve água em garrafa lacrada em visitas mais longas, especialmente no calor."],
      ["Confira o seguro-viagem", "Verifique os limites para assistência médica, cancelamentos e as atividades planejadas."],
    ],
    visaLink: "Portal oficial do visto eletrônico",
    visitorInfoLink: "Informações turísticas oficiais",
  },
  es: {
    title: "Lo esencial para viajar a Egipto",
    intro: "Desde los museos de El Cairo y los templos del Nilo hasta los arrecifes del mar Rojo, hay mucho por descubrir. Esto es lo que conviene saber antes de viajar.",
    facts: [
      ["Capital", "El Cairo", "Empieza en la capital para visitar las pirámides de Guiza, los museos y los mercados históricos."],
      ["Moneda", "Libra egipcia", "Lleva libras egipcias (EGP) para los mercados, los taxis y las compras pequeñas."],
      ["Visado", "Consulta los requisitos", "Las condiciones de entrada y las opciones de visado dependen de tu pasaporte y de cómo llegues."],
      ["Duración recomendada", "7 a 14 días", "Una semana es un buen comienzo para El Cairo y Luxor. Reserva más días para Asuán o el mar Rojo."],
      ["Idioma", "Árabe", "El inglés se utiliza habitualmente en hoteles y en los principales lugares turísticos."],
      ["Huso horario", "UTC+2", "Egipto cambia la hora según la estación. Comprueba la hora local al reservar conexiones."],
    ],
    tips: [
      ["Adapta tu vestimenta", "Lleva una prenda ligera que cubra hombros y rodillas para visitar mezquitas y otros lugares de culto."],
      ["Lleva billetes pequeños", "Son prácticos para las propinas y los gastos del día a día."],
      ["Lleva agua potable", "Para visitas largas, especialmente con calor, lleva agua embotellada y sellada."],
      ["Revisa tu seguro de viaje", "Consulta los límites de cobertura médica, cancelaciones y actividades previstas."],
    ],
    visaLink: "Portal oficial del visado electrónico",
    visitorInfoLink: "Información turística oficial",
  },
  zh: {
    title: "埃及旅行须知",
    intro: "从开罗的博物馆、尼罗河畔的神庙到红海的珊瑚礁，埃及有许多值得探索的地方。出发前，可以先了解这些实用信息。",
    facts: [
      ["首都", "开罗", "从开罗出发，可以游览吉萨金字塔、博物馆和历史悠久的市集。"],
      ["货币", "埃及镑", "在市集购物、乘坐出租车或小额消费时，备一些埃及镑（EGP）现金。"],
      ["签证", "查询申请条件", "入境要求及签证选项取决于您持有的护照和入境方式。"],
      ["建议行程", "7 至 14 天", "一周适合游览开罗和卢克索。如计划前往阿斯旺或红海，建议多留几天。"],
      ["语言", "阿拉伯语", "酒店及主要旅游景点普遍使用英语。"],
      ["时区", "UTC+2", "埃及会按季节调整时钟，预订联程交通时请确认当地时间。"],
    ],
    tips: [
      ["按场所选择着装", "参观清真寺等宗教场所时，带上能遮住肩膀和膝盖的轻便衣物。"],
      ["准备小面额纸币", "支付小费和日常小额开支会更方便。"],
      ["随身带饮用水", "外出时间较长时，特别是天气炎热时，请带上密封的瓶装水。"],
      ["查看旅游保险", "了解保单对医疗、取消行程及计划参加的活动所设的保障范围。"],
    ],
    visaLink: "埃及官方电子签证门户",
    visitorInfoLink: "官方旅游信息",
  },
};
