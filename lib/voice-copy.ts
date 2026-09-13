// Localized voice UI strings for recognition lifecycle and error states.
// Follows the repository's Proxy-based copy convention
// (see lib/ui-copy.ts): per-locale dictionaries with English fallback.

import type { Locale } from "@/types/api";

type VoiceCopy = Record<string, string>;

const en: VoiceCopy = {
  voiceSearch: "Search by voice",
  stopListening: "Stop listening",
  tryAgain: "Try again",
  listening: "Listening…",
  processing: "Recognizing…",
  noSpeech: "No speech detected. Please try again.",
  permissionDenied: "Microphone permission was denied. Enable it in your browser settings to search by voice.",
  recognitionUnavailable: "Voice search is not available in this browser. Please type your search instead.",
  recognitionError: "Speech recognition failed. Please try again.",
  cancelled: "Voice search was cancelled.",
};

const copies: Record<Locale, VoiceCopy> = {
  en,
  fr: {
    voiceSearch: "Rechercher à la voix",
    stopListening: "Arrêter l'écoute",
    tryAgain: "Réessayer",
    listening: "Écoute…",
    processing: "Reconnaissance…",
    noSpeech: "Aucune parole détectée. Veuillez réessayer.",
    permissionDenied: "L'accès au microphone a été refusé. Activez-le dans les paramètres de votre navigateur pour rechercher à la voix.",
    recognitionUnavailable: "La recherche vocale n'est pas disponible dans ce navigateur. Veuillez saisir votre recherche.",
    recognitionError: "La reconnaissance vocale a échoué. Veuillez réessayer.",
    cancelled: "La recherche vocale a été annulée.",
  },
  de: {
    voiceSearch: "Sprachsuche",
    stopListening: "Zuhören beenden",
    tryAgain: "Erneut versuchen",
    listening: "Zuhören…",
    processing: "Erkennen…",
    noSpeech: "Keine Sprache erkannt. Bitte versuchen Sie es erneut.",
    permissionDenied: "Der Mikrofonzugriff wurde verweigert. Aktivieren Sie ihn in Ihren Browsereinstellungen, um die Sprachsuche zu nutzen.",
    recognitionUnavailable: "Die Sprachsuche ist in diesem Browser nicht verfügbar. Bitte geben Sie Ihre Suche ein.",
    recognitionError: "Die Spracherkennung ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
    cancelled: "Die Sprachsuche wurde abgebrochen.",
  },
  it: {
    voiceSearch: "Cerca con la voce",
    stopListening: "Interrompi l'ascolto",
    tryAgain: "Riprova",
    listening: "In ascolto…",
    processing: "Riconoscimento…",
    noSpeech: "Nessuna voce rilevata. Riprova.",
    permissionDenied: "L'accesso al microfono è stato negato. Abilitalo nelle impostazioni del browser per cercare con la voce.",
    recognitionUnavailable: "La ricerca vocale non è disponibile in questo browser. Digita la tua ricerca.",
    recognitionError: "Il riconoscimento vocale non è riuscito. Riprova.",
    cancelled: "La ricerca vocale è stata annullata.",
  },
  pt: {
    voiceSearch: "Pesquisar por voz",
    stopListening: "Parar de ouvir",
    tryAgain: "Tentar novamente",
    listening: "Ouvindo…",
    processing: "Reconhecendo…",
    noSpeech: "Nenhuma fala detectada. Tente novamente.",
    permissionDenied: "A permissão do microfone foi negada. Ative-a nas configurações do navegador para pesquisar por voz.",
    recognitionUnavailable: "A pesquisa por voz não está disponível neste navegador. Digite sua pesquisa.",
    recognitionError: "O reconhecimento de fala falhou. Tente novamente.",
    cancelled: "A pesquisa por voz foi cancelada.",
  },
  es: {
    voiceSearch: "Buscar por voz",
    stopListening: "Dejar de escuchar",
    tryAgain: "Intentar de nuevo",
    listening: "Escuchando…",
    processing: "Reconociendo…",
    noSpeech: "No se detectó voz. Inténtalo de nuevo.",
    permissionDenied: "Se denegó el permiso del micrófono. Actívalo en la configuración de tu navegador para buscar por voz.",
    recognitionUnavailable: "La búsqueda por voz no está disponible en este navegador. Escribe tu búsqueda.",
    recognitionError: "El reconocimiento de voz falló. Inténtalo de nuevo.",
    cancelled: "La búsqueda por voz fue cancelada.",
  },
  zh: {
    voiceSearch: "语音搜索",
    stopListening: "停止聆听",
    tryAgain: "重试",
    listening: "正在聆听…",
    processing: "正在识别…",
    noSpeech: "未检测到语音，请重试。",
    permissionDenied: "麦克风权限被拒绝。请在浏览器设置中启用以使用语音搜索。",
    recognitionUnavailable: "此浏览器不支持语音搜索，请直接输入搜索内容。",
    recognitionError: "语音识别失败，请重试。",
    cancelled: "语音搜索已取消。",
  },
};

export const smartVoiceKeys = ["findTripVoice", "smartProcessing", "reviewReady", "heard", "applied", "recognized", "didYouMean", "chooseOne", "notFilter", "remainingRequired", "noMatch", "destination", "duration", "category", "origin", "month", "travelers", "privacy", "private", "group", "adults", "children", "days", "removeCategory", "reviewInfo"] as const;
type SmartVoiceCopy = Record<(typeof smartVoiceKeys)[number], string>;
const smartCopies: Record<Locale, SmartVoiceCopy> = {
  en: {
    findTripVoice: "Find trip by voice", smartProcessing: "Matching trip filters…", reviewReady: "Review your trip filters before searching.",
    heard: "Heard", applied: "Current trip filters", recognized: "Recognized information and suggestions", didYouMean: "Did you mean", chooseOne: "Choose one",
    notFilter: "Not applied as a filter", remainingRequired: "Choose the remaining required fields before searching.", noMatch: "We couldn't match this to the available trip filters.",
    destination: "Destination", duration: "Duration", category: "Category", origin: "From", month: "Month", travelers: "Travelers", privacy: "Trip type",
    private: "Private trip", group: "Group trip", adults: "Adults", children: "Children", days: "Days", removeCategory: "Remove category",
    reviewInfo: "Only current trip filters affect your search. Confirm suggestions to apply them; edit destination and duration in the fields above.",
  },
  fr: {
    findTripVoice: "Trouver un voyage à la voix", smartProcessing: "Recherche des filtres de voyage…", reviewReady: "Vérifiez vos filtres avant de rechercher.",
    heard: "Texte entendu", applied: "Filtres actuels du voyage", recognized: "Informations reconnues et suggestions", didYouMean: "Vouliez-vous dire", chooseOne: "Choisissez une option",
    notFilter: "Non appliqué comme filtre", remainingRequired: "Complétez les champs obligatoires restants avant de rechercher.", noMatch: "Nous n'avons pas pu associer ce texte aux filtres disponibles.",
    destination: "Destination", duration: "Durée", category: "Catégorie", origin: "Départ", month: "Mois", travelers: "Voyageurs", privacy: "Type de voyage",
    private: "Voyage privé", group: "Voyage en groupe", adults: "Adultes", children: "Enfants", days: "Jours", removeCategory: "Supprimer la catégorie",
    reviewInfo: "Seuls les filtres actuels influencent la recherche. Confirmez les suggestions pour les appliquer ; modifiez la destination et la durée dans les champs ci-dessus.",
  },
  de: {
    findTripVoice: "Reise per Sprache finden", smartProcessing: "Reisefilter werden zugeordnet…", reviewReady: "Prüfen Sie Ihre Reisefilter vor der Suche.",
    heard: "Gehört", applied: "Aktuelle Reisefilter", recognized: "Erkannte Angaben und Vorschläge", didYouMean: "Meinten Sie", chooseOne: "Wählen Sie eine Option",
    notFilter: "Nicht als Filter angewendet", remainingRequired: "Füllen Sie vor der Suche die übrigen Pflichtfelder aus.", noMatch: "Wir konnten diese Angaben keinem verfügbaren Reisefilter zuordnen.",
    destination: "Reiseziel", duration: "Dauer", category: "Kategorie", origin: "Ab", month: "Monat", travelers: "Reisende", privacy: "Reiseart",
    private: "Private Reise", group: "Gruppenreise", adults: "Erwachsene", children: "Kinder", days: "Tage", removeCategory: "Kategorie entfernen",
    reviewInfo: "Nur aktuelle Reisefilter beeinflussen die Suche. Bestätigen Sie Vorschläge, um sie anzuwenden; ändern Sie Reiseziel und Dauer in den Feldern oben.",
  },
  it: {
    findTripVoice: "Trova un viaggio con la voce", smartProcessing: "Associazione dei filtri di viaggio…", reviewReady: "Controlla i filtri prima di cercare.",
    heard: "Testo ascoltato", applied: "Filtri attuali del viaggio", recognized: "Informazioni riconosciute e suggerimenti", didYouMean: "Intendevi", chooseOne: "Scegli un'opzione",
    notFilter: "Non applicato come filtro", remainingRequired: "Completa i campi obbligatori rimanenti prima di cercare.", noMatch: "Non siamo riusciti ad associare questo testo ai filtri disponibili.",
    destination: "Destinazione", duration: "Durata", category: "Categoria", origin: "Da", month: "Mese", travelers: "Viaggiatori", privacy: "Tipo di viaggio",
    private: "Viaggio privato", group: "Viaggio di gruppo", adults: "Adulti", children: "Bambini", days: "Giorni", removeCategory: "Rimuovi categoria",
    reviewInfo: "Solo i filtri attuali influenzano la ricerca. Conferma i suggerimenti per applicarli; modifica destinazione e durata nei campi sopra.",
  },
  pt: {
    findTripVoice: "Encontrar viagem por voz", smartProcessing: "A associar filtros de viagem…", reviewReady: "Reveja os filtros antes de pesquisar.",
    heard: "Texto ouvido", applied: "Filtros atuais da viagem", recognized: "Informações reconhecidas e sugestões", didYouMean: "Quis dizer", chooseOne: "Escolha uma opção",
    notFilter: "Não aplicado como filtro", remainingRequired: "Preencha os campos obrigatórios restantes antes de pesquisar.", noMatch: "Não conseguimos associar este texto aos filtros disponíveis.",
    destination: "Destino", duration: "Duração", category: "Categoria", origin: "De", month: "Mês", travelers: "Viajantes", privacy: "Tipo de viagem",
    private: "Viagem privada", group: "Viagem em grupo", adults: "Adultos", children: "Crianças", days: "Dias", removeCategory: "Remover categoria",
    reviewInfo: "Só os filtros atuais afetam a pesquisa. Confirme as sugestões para as aplicar; altere o destino e a duração nos campos acima.",
  },
  es: {
    findTripVoice: "Encontrar viaje por voz", smartProcessing: "Buscando filtros de viaje…", reviewReady: "Revisa los filtros antes de buscar.",
    heard: "Texto escuchado", applied: "Filtros actuales del viaje", recognized: "Información reconocida y sugerencias", didYouMean: "Quisiste decir", chooseOne: "Elige una opción",
    notFilter: "No aplicado como filtro", remainingRequired: "Completa los campos obligatorios restantes antes de buscar.", noMatch: "No pudimos asociar este texto con los filtros disponibles.",
    destination: "Destino", duration: "Duración", category: "Categoría", origin: "Desde", month: "Mes", travelers: "Viajeros", privacy: "Tipo de viaje",
    private: "Viaje privado", group: "Viaje en grupo", adults: "Adultos", children: "Niños", days: "Días", removeCategory: "Quitar categoría",
    reviewInfo: "Solo los filtros actuales afectan la búsqueda. Confirma las sugerencias para aplicarlas; modifica el destino y la duración en los campos de arriba.",
  },
  zh: {
    findTripVoice: "语音查找行程", smartProcessing: "正在匹配行程筛选条件…", reviewReady: "搜索前请核对行程筛选条件。",
    heard: "识别到的语音", applied: "当前行程筛选条件", recognized: "识别的信息和建议", didYouMean: "您是指", chooseOne: "请选择一项",
    notFilter: "未用作筛选条件", remainingRequired: "搜索前请填写其余必填项。", noMatch: "未能将此语音匹配到可用的行程筛选条件。",
    destination: "目的地", duration: "时长", category: "类别", origin: "出发地", month: "月份", travelers: "旅客", privacy: "行程类型",
    private: "私人行程", group: "团体行程", adults: "成人", children: "儿童", days: "天", removeCategory: "移除类别",
    reviewInfo: "只有当前筛选条件会影响搜索。确认建议后才会应用；请在上方字段中修改目的地和时长。",
  },
};

export function voiceCopy(locale: Locale): VoiceCopy {
  return new Proxy<VoiceCopy>({ ...en, ...(copies[locale] ?? {}), ...smartCopies[locale] }, {
    get(target, property: string) {
      return target[property] ?? en[property] ?? property;
    },
  });
}
