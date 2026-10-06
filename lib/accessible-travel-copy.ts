import type { Locale } from "@/types/api";

// Frontend-owned UI copy retained from the legacy localized accessibility overview.
// Laravel page content, banners, SEO and tour records remain API-controlled.
const copy = {
  "en": {
    "message": "5% discount on all our tour packages for guests requiring accessibility assistance, supporting inclusive travel experiences.",
    "readMore": "Read More",
    "heading": "We Care — Special Announcement",
    "introduction": "At Sun Pyramids Tours, we believe that travel should be a joyful and inclusive experience for everyone.",
    "initiative": "We are proud to introduce a new initiative:",
    "offer": "A fixed 5% discount on all tour packages that include travelers requiring accessibility support and their companions.",
    "reasonsHeading": "Why We’re Doing This:",
    "reasons": [
      "To ensure that families, friends, and companions can share the same joy of discovery—together.",
      "To honor the strength, resilience, and inspiring spirit of our valued travelers.",
      "To reaffirm our commitment to care, respect, and truly unforgettable experiences."
    ],
    "coverage": "The discount applies to the entire package, benefiting travelers requiring accessibility support as well as their companions.",
    "verification": "Choose the accessible package that suits your needs, upload your medical or disability card for verification, and enjoy up to 5% off your experience.",
    "closing": "Sun Pyramids Tours – We Care, because travel is for everyone."
  },
  "fr": {
    "message": "5 % de réduction sur tous nos forfaits touristiques pour les clients nécessitant une assistance à l'accessibilité, soutenant des expériences de voyage inclusives.",
    "readMore": "Lire la suite",
    "heading": "Nous Prenons soin — Spécial Annonce",
    "introduction": "Chez Sun Pyramids Tours, nous croyons que voyager devrait être une expérience joyeuse et inclusive pour tous.",
    "initiative": "Nous sommes fiers de présenter une nouvelle initiative :",
    "offer": "Une réduction fixe de 5 % sur tous les forfaits touristiques qui incluent des voyageurs nécessitant un soutien à l'accessibilité et leurs accompagnants.",
    "reasonsHeading": "Pourquoi nous faisons cela :",
    "reasons": [
      "Pour assurer que familles, amis et accompagnants puissent partager la même joie de la découverte ensemble.",
      "Pour honorer la force, la résilience et l'esprit inspirant de nos précieux voyageurs.",
      "Pour réaffirmer notre engagement envers le soin, le respect et des expériences vraiment inoubliables."
    ],
    "coverage": "La réduction s'applique à l’ensemble du forfait, bénéficiant aux voyageurs nécessitant un soutien à l'accessibilité ainsi qu’à leurs accompagnants.",
    "verification": "Choisissez le forfait accessible qui répond à vos besoins, téléchargez votre carte médicale ou de handicap pour vérification et profitez d’une réduction allant jusqu’à 5 % sur votre expérience.",
    "closing": "Sun Pyramids Tours – Nous prenons soin, car voyager est pour tout le monde."
  },
  "de": {
    "message": "5 % Rabatt auf alle unsere Tourpakete für Gäste, die barrierefreie Unterstützung benötigen, zur Förderung inklusiver Reiseerlebnisse.",
    "readMore": "Mehr lesen",
    "heading": "Wir Kümmern — Besonders Ankündigung",
    "introduction": "Bei Sun Pyramids Tours glauben wir, dass Reisen für alle ein freudvolles und inklusives Erlebnis sein sollte.",
    "initiative": "Wir freuen uns, eine neue Initiative vorzustellen:",
    "offer": "Ein fixer 5 % Rabatt auf alle Tourpakete, die Reisende mit barrierefreiem Unterstützungsbedarf und ihre Begleiter einschließen.",
    "reasonsHeading": "Warum wir das tun:",
    "reasons": [
      "Damit Familien, Freunde und Begleiter dieselbe Freude an der Entdeckung gemeinsam teilen können.",
      "Um die Stärke, Widerstandsfähigkeit und den inspirierenden Geist unserer geschätzten Reisenden zu ehren.",
      "Um unser Engagement für Fürsorge, Respekt und wirklich unvergessliche Erlebnisse zu bekräftigen."
    ],
    "coverage": "Der Rabatt gilt für das gesamte Paket und kommt reisenden mit Unterstützungsbedarf sowie ihren Begleitern zugute.",
    "verification": "Wählen Sie das barrierefreie Paket, das Ihren Bedürfnissen entspricht, laden Sie Ihre medizinische oder Behindertenkarte zur Verifizierung hoch und genießen Sie bis zu 5 % Rabatt auf Ihr Erlebnis.",
    "closing": "Sun Pyramids Tours – Wir kümmern uns, denn Reisen ist für alle da."
  },
  "it": {
    "message": "Sconto del 5 % su tutti i nostri pacchetti turistici per ospiti che richiedono assistenza all'accessibilità, a sostegno di esperienze di viaggio inclusive.",
    "readMore": "Leggi di più",
    "heading": "Noi Ci prendiamo cura — Speciale Annuncio",
    "introduction": "In Sun Pyramids Tours crediamo che viaggiare debba essere un’esperienza gioiosa e inclusiva per tutti.",
    "initiative": "Siamo orgogliosi di presentare una nuova iniziativa:",
    "offer": "Uno sconto fisso del 5 % su tutti i pacchetti turistici che includono viaggiatori che richiedono supporto all'accessibilità e i loro accompagnatori.",
    "reasonsHeading": "Perché lo facciamo:",
    "reasons": [
      "Per garantire che famiglie, amici e accompagnatori possano condividere insieme la stessa gioia della scoperta.",
      "Per onorare la forza, la resilienza e lo spirito ispiratore dei nostri preziosi viaggiatori.",
      "Per riaffermare il nostro impegno per la cura, il rispetto e esperienze davvero indimenticabili."
    ],
    "coverage": "Lo sconto si applica all'intero pacchetto, beneficiando i viaggiatori che richiedono supporto all'accessibilità e i loro accompagnatori.",
    "verification": "Scegli il pacchetto accessibile che soddisfa le tue esigenze, carica la tua tessera medica o di disabilità per la verifica e goditi fino al 5 % di sconto sulla tua esperienza.",
    "closing": "Sun Pyramids Tours – Ci prendiamo cura, perché viaggiare è per tutti."
  },
  "pt": {
    "message": "5 % de desconto em todos os nossos pacotes turísticos para hóspedes que necessitam de assistência de acessibilidade, apoiando experiências de viagem inclusivas.",
    "readMore": "Ler mais",
    "heading": "Nós Cuidamos — Especial Anúncio",
    "introduction": "Na Sun Pyramids Tours, acreditamos que viajar deve ser uma experiência alegre e inclusiva para todos.",
    "initiative": "Temos orgulho em apresentar uma nova iniciativa:",
    "offer": "Um desconto fixo de 5 % em todos os pacotes turísticos que incluam viajantes que precisam de apoio de acessibilidade e seus acompanhantes.",
    "reasonsHeading": "Por que estamos fazendo isso:",
    "reasons": [
      "Para garantir que famílias, amigos e acompanhantes possam compartilhar a mesma alegria de descoberta juntos.",
      "Para honrar a força, resiliência e espírito inspirador dos nossos valiosos viajantes.",
      "Para reafirmar nosso compromisso com cuidado, respeito e experiências verdadeiramente inesquecíveis."
    ],
    "coverage": "O desconto aplica-se ao pacote inteiro, beneficiando viajantes que precisam de apoio de acessibilidade assim como seus acompanhantes.",
    "verification": "Escolha o pacote acessível que atende às suas necessidades, faça o upload do seu cartão médico ou de deficiência para verificação e aproveite até 5 % de desconto na sua experiência.",
    "closing": "Sun Pyramids Tours – Nós cuidamos, porque viajar é para todos."
  },
  "es": {
    "message": "5 % de descuento en todos nuestros paquetes turísticos para huéspedes que requieran asistencia de accesibilidad, apoyando experiencias de viaje inclusivas.",
    "readMore": "Leer más",
    "heading": "Nosotros Cuidamos — Especial Anuncio",
    "introduction": "En Sun Pyramids Tours, creemos que viajar debe ser una experiencia alegre e inclusiva para todos.",
    "initiative": "Nos enorgullece presentar una nueva iniciativa:",
    "offer": "Un descuento fijo del 5 % en todos los paquetes turísticos que incluyan viajeros que requieren apoyo de accesibilidad y sus acompañantes.",
    "reasonsHeading": "Por qué hacemos esto:",
    "reasons": [
      "Para asegurar que familias, amigos y acompañantes puedan compartir la misma alegría de descubrimiento juntos.",
      "Para honrar la fuerza, resiliencia y espíritu inspirador de nuestros valiosos viajeros.",
      "Para reafirmar nuestro compromiso con el cuidado, el respeto y experiencias realmente inolvidables."
    ],
    "coverage": "El descuento se aplica a todo el paquete, beneficiando a los viajeros que requieren apoyo de accesibilidad así como a sus acompañantes.",
    "verification": "Elige el paquete accesible que se adapte a tus necesidades, sube tu tarjeta médica o de discapacidad para verificación y disfruta de hasta un 5 % de descuento en tu experiencia.",
    "closing": "Sun Pyramids Tours – Nos importas, porque viajar es para todos."
  },
  "zh": {
    "message": "所有旅游套餐对需要无障碍辅助的客人提供 5% 折扣，支持包容性旅游体验。",
    "readMore": "阅读更多",
    "heading": "我们 关怀 — 特别 公告",
    "introduction": "在 Sun Pyramids Tours，我们相信旅行应该是每个人愉快且包容的体验。",
    "initiative": "我们自豪地推出一项新举措：",
    "offer": "对包含需要无障碍支持的旅客及其同伴的所有旅游套餐提供 5% 固定折扣。",
    "reasonsHeading": "我们这样做的原因：",
    "reasons": [
      "确保家庭、朋友和同伴能够一起分享发现的快乐。",
      "致敬我们尊贵旅客的坚强、韧性和鼓舞人心的精神。",
      "重申我们对关怀、尊重以及真正难忘体验的承诺。"
    ],
    "coverage": "折扣适用于整个套餐，惠及需要无障碍支持的旅客及其同伴。",
    "verification": "选择适合您需求的无障碍套餐，上传您的医疗或残疾证以进行验证，享受高达 5% 的折扣体验。",
    "closing": "Sun Pyramids Tours – 我们关怀，因为旅行属于每个人。"
  }
};

export function accessibleTravelCopy(locale: Locale) {
  return copy[locale];
}
