import type { Locale } from "@/types/api";

type Caption = readonly [title: string, description: string];

type EgyptHighlightsCopy = {
  mustSee: string;
  guide: string;
  places: readonly [Caption, Caption, Caption, Caption, Caption, Caption];
  whyTravel: string;
  booking: Caption;
  benefits: readonly [Caption, Caption, Caption, Caption];
};

export const egyptHighlightsCopy: Record<Locale, EgyptHighlightsCopy> = {
  en: {
    mustSee: "Egypt’s must-see places",
    guide: "Explore the travel guide",
    places: [
      ["Giza Pyramids", "See the pyramids of Khufu, Khafre and Menkaure on the plateau beside the Great Sphinx."],
      ["Cairo", "Walk through the lanes of Islamic Cairo, from historic mosques to the shops of Khan el-Khalili."],
      ["Grand Egyptian Museum", "Explore the galleries near Giza, from the monumental statue of Ramses II to the treasures of Tutankhamun."],
      ["Luxor & Aswan", "Follow the Nile from Luxor’s temple complexes to Aswan’s islands and riverside villages."],
      ["Abu Simbel", "See the rock-cut temples of Ramses II and Nefertari overlooking Lake Nasser."],
      ["Red Sea", "Snorkel over coral reefs or spend an afternoon by the water on the coast near Hurghada."],
    ],
    whyTravel: "Why travel with Sun Pyramids Tours?",
    booking: ["Book online", "Browse tours, check what’s included and book the itinerary that suits your trip."],
    benefits: [
      ["Local guides", "Visit Egypt’s historic sites with guides who know them well."],
      ["Private transfers", "Check your itinerary for included pickups and transport."],
      ["Planning help", "Talk to our team about dates, routes and what to see."],
      ["Flexible itineraries", "Choose a day trip, a longer circuit or a Nile cruise."],
    ],
  },
  fr: {
    mustSee: "Les incontournables de l’Égypte",
    guide: "Consulter le guide de voyage",
    places: [
      ["Pyramides de Gizeh", "Admirez les pyramides de Khéops, Khéphren et Mykérinos sur le plateau, près du Grand Sphinx."],
      ["Le Caire", "Parcourez les ruelles du Caire islamique, des mosquées historiques aux boutiques de Khan el-Khalili."],
      ["Grand Musée égyptien", "Découvrez près de Gizeh la statue monumentale de Ramsès II et les trésors de Toutânkhamon."],
      ["Louxor et Assouan", "Suivez le Nil des grands temples de Louxor aux îles et aux villages d’Assouan."],
      ["Abou Simbel", "Découvrez les temples de Ramsès II et de Néfertari, taillés dans la roche au-dessus du lac Nasser."],
      ["Mer Rouge", "Explorez les récifs avec un masque et un tuba ou profitez du littoral près de Hurghada."],
    ],
    whyTravel: "Pourquoi voyager avec Sun Pyramids Tours ?",
    booking: ["Réservez en ligne", "Comparez les circuits et leurs prestations, puis réservez celui qui vous convient."],
    benefits: [
      ["Guides locaux", "Découvrez les sites historiques avec des guides qui les connaissent bien."],
      ["Transferts privés", "Vérifiez les prises en charge et les transports inclus dans votre circuit."],
      ["Aide à la préparation", "Parlez à notre équipe des dates, de l’itinéraire et des visites."],
      ["Itinéraires flexibles", "Choisissez une excursion, un circuit ou une croisière sur le Nil."],
    ],
  },
  de: {
    mustSee: "Ägyptens wichtigste Sehenswürdigkeiten",
    guide: "Reiseführer entdecken",
    places: [
      ["Pyramiden von Gizeh", "Besuchen Sie die Pyramiden von Cheops, Chephren und Mykerinos auf dem Plateau neben der Sphinx."],
      ["Kairo", "Erkunden Sie die Gassen des islamischen Kairo mit historischen Moscheen und den Läden von Khan el-Khalili."],
      ["Großes Ägyptisches Museum", "Entdecken Sie nahe Gizeh die Kolossalstatue von Ramses II. und die Schätze Tutanchamuns."],
      ["Luxor und Assuan", "Folgen Sie dem Nil von den Tempelanlagen in Luxor zu den Inseln und Uferdörfern von Assuan."],
      ["Abu Simbel", "Besichtigen Sie die in den Fels gehauenen Tempel von Ramses II. und Nefertari am Nassersee."],
      ["Rotes Meer", "Schnorcheln Sie über Korallenriffen oder verbringen Sie einen Nachmittag an der Küste bei Hurghada."],
    ],
    whyTravel: "Warum mit Sun Pyramids Tours reisen?",
    booking: ["Online buchen", "Vergleichen Sie Touren und Leistungen und buchen Sie die passende Route."],
    benefits: [
      ["Lokale Reiseleitung", "Besichtigen Sie historische Stätten mit ortskundigen Reiseleitern."],
      ["Private Transfers", "Im Reiseplan sehen Sie, welche Abholungen und Fahrten enthalten sind."],
      ["Hilfe bei der Planung", "Unser Team hilft bei Terminen, Routen und Ausflugszielen."],
      ["Flexible Reiserouten", "Wählen Sie einen Tagesausflug, eine Rundreise oder eine Nilkreuzfahrt."],
    ],
  },
  it: {
    mustSee: "I luoghi imperdibili dell’Egitto",
    guide: "Esplora la guida di viaggio",
    places: [
      ["Piramidi di Giza", "Visita le piramidi di Cheope, Chefren e Micerino sull’altopiano accanto alla Grande Sfinge."],
      ["Il Cairo", "Passeggia nei vicoli del Cairo islamico tra moschee storiche e botteghe di Khan el-Khalili."],
      ["Grande Museo Egizio", "Scopri la statua monumentale di Ramses II e i tesori di Tutankhamon nelle gallerie vicino a Giza."],
      ["Luxor e Assuan", "Segui il Nilo dai complessi templari di Luxor alle isole e ai villaggi sulle rive di Assuan."],
      ["Abu Simbel", "Ammira sul lago Nasser i templi di Ramses II e Nefertari scavati nella roccia."],
      ["Mar Rosso", "Fai snorkeling tra le barriere coralline o rilassati sulla costa vicino a Hurghada."],
    ],
    whyTravel: "Perché viaggiare con Sun Pyramids Tours?",
    booking: ["Prenota online", "Esplora i tour, verifica i servizi inclusi e prenota l’itinerario che fa per te."],
    benefits: [
      ["Guide locali", "Scopri i siti storici con guide che li conoscono bene."],
      ["Trasferimenti privati", "Controlla quali trasferimenti sono inclusi nel tuo itinerario."],
      ["Aiuto nella pianificazione", "Confrontati con il nostro team su date, percorsi e visite."],
      ["Itinerari flessibili", "Scegli un’escursione, un tour di più giorni o una crociera sul Nilo."],
    ],
  },
  pt: {
    mustSee: "Lugares imperdíveis no Egito",
    guide: "Explore o guia de viagem",
    places: [
      ["Pirâmides de Gizé", "Visite as pirâmides de Quéops, Quéfren e Miquerinos no planalto ao lado da Grande Esfinge."],
      ["Cairo", "Caminhe pelas ruas do Cairo islâmico, das mesquitas históricas às lojas de Khan el-Khalili."],
      ["Grande Museu Egípcio", "Veja a estátua monumental de Ramsés II e os tesouros de Tutancâmon nas galerias perto de Gizé."],
      ["Luxor e Assuã", "Siga o Nilo dos templos de Luxor às ilhas e aldeias ribeirinhas de Assuã."],
      ["Abu Simbel", "Veja os templos de Ramsés II e Nefertari, esculpidos na rocha às margens do lago Nasser."],
      ["Mar Vermelho", "Mergulhe com snorkel sobre os recifes ou aproveite a costa perto de Hurghada."],
    ],
    whyTravel: "Por que viajar com a Sun Pyramids Tours?",
    booking: ["Reserve online", "Compare os passeios, confira o que está incluído e reserve o roteiro que combina com a sua viagem."],
    benefits: [
      ["Guias locais", "Conheça sítios históricos com guias que conhecem bem a região."],
      ["Traslados privativos", "Confira no roteiro quais traslados estão incluídos."],
      ["Ajuda no planejamento", "Converse com nossa equipe sobre datas, trajetos e visitas."],
      ["Roteiros flexíveis", "Escolha um passeio de um dia, um roteiro mais longo ou um cruzeiro no Nilo."],
    ],
  },
  es: {
    mustSee: "Lugares imprescindibles de Egipto",
    guide: "Consulta la guía de viaje",
    places: [
      ["Pirámides de Guiza", "Visita las pirámides de Keops, Kefrén y Micerino en la meseta junto a la Gran Esfinge."],
      ["El Cairo", "Pasea por las calles de El Cairo islámico, desde las mezquitas históricas hasta las tiendas de Jan el-Jalili."],
      ["Gran Museo Egipcio", "Contempla en las galerías cercanas a Guiza la estatua de Ramsés II y los tesoros de Tutankamón."],
      ["Luxor y Asuán", "Sigue el Nilo desde los templos de Luxor hasta las islas y los pueblos ribereños de Asuán."],
      ["Abu Simbel", "Visita los templos de Ramsés II y Nefertari, excavados en roca junto al lago Nasser."],
      ["Mar Rojo", "Practica esnórquel entre arrecifes de coral o descansa en la costa cerca de Hurghada."],
    ],
    whyTravel: "¿Por qué viajar con Sun Pyramids Tours?",
    booking: ["Reserva en línea", "Compara excursiones y servicios incluidos, y reserva el itinerario que mejor te convenga."],
    benefits: [
      ["Guías locales", "Visita los lugares históricos con guías que los conocen bien."],
      ["Traslados privados", "Consulta qué recogidas y traslados incluye tu itinerario."],
      ["Ayuda para planificar", "Habla con nuestro equipo sobre fechas, rutas y visitas."],
      ["Itinerarios flexibles", "Elige una excursión, un circuito de varios días o un crucero por el Nilo."],
    ],
  },
  zh: {
    mustSee: "埃及必游景点",
    guide: "查看旅行指南",
    places: [
      ["吉萨金字塔", "在狮身人面像旁的高原上，参观胡夫、哈夫拉和孟卡拉金字塔。"],
      ["开罗", "漫步伊斯兰老城的小巷，参观历史悠久的清真寺和汗哈利利市场。"],
      ["大埃及博物馆", "在吉萨附近的展厅欣赏拉美西斯二世的巨型雕像和图坦卡蒙的珍宝。"],
      ["卢克索与阿斯旺", "沿尼罗河从卢克索的神庙群前往阿斯旺的岛屿和河畔村庄。"],
      ["阿布辛贝", "参观纳赛尔湖畔拉美西斯二世和奈菲尔塔利的岩石神庙。"],
      ["红海", "在赫尔格达附近的珊瑚礁浮潜，或在海边度过悠闲的下午。"],
    ],
    whyTravel: "为什么选择 Sun Pyramids Tours？",
    booking: ["在线预订", "浏览行程，比较包含的服务，再预订适合您的路线。"],
    benefits: [
      ["当地导游", "由熟悉当地历史的导游带您参观古迹。"],
      ["私人接送", "查看行程中包含哪些接送服务。"],
      ["行程规划协助", "与我们的团队讨论日期、路线和景点。"],
      ["灵活行程", "可选择一日游、多日游或尼罗河游轮。"],
    ],
  },
};
