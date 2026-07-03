import { createContext, useContext, useState, type ReactNode } from 'react'

// ── Supported languages ───────────────────────────────────────────────────────
export const LANGUAGES = [
  { id: 'en', label: 'English',    flagCode: 'gb' },
  { id: 'es', label: 'Español',    flagCode: 'es' },
  { id: 'de', label: 'Deutsch',    flagCode: 'de' },
  { id: 'fr', label: 'Français',   flagCode: 'fr' },
  { id: 'nl', label: 'Nederlands', flagCode: 'nl' },
  { id: 'ro', label: 'Română',     flagCode: 'ro' },
  { id: 'pt', label: 'Português',  flagCode: 'pt' },
  { id: 'it', label: 'Italiano',   flagCode: 'it' },
] as const

export type LangId = typeof LANGUAGES[number]['id']

// ── Translation keys ──────────────────────────────────────────────────────────
interface Strings {
  // Nav
  nav_overview:         string
  nav_mentions:         string
  nav_competitors:      string
  nav_prompts:          string
  nav_aiVisibility:     string
  nav_recommendations:  string
  // Sidebar
  sidebar_client:       string
  sidebar_market:       string
  sidebar_selectClient: string
  sidebar_darkMode:     string
  sidebar_lightMode:    string
  sidebar_signOut:      string
  sidebar_allRegions:   string
  // Recommendations page
  rec_actions:          string
  rec_subtitle:         string
  rec_whyLabel:         string
  rec_stepsLabel:       string
  rec_effortLow:        string
  rec_effortMedium:     string
  rec_effortHigh:       string
  rec_criticalPlatform: string
  rec_criticalPlatforms:string
  rec_criticalBody:     string   // use {rate} placeholder
  rec_goodTitle:        string
  rec_goodBody:         string
  rec_empty:            string
  rec_loading:          string
}

const T: Record<LangId, Strings> = {
  en: {
    nav_overview:         'Overview',
    nav_mentions:         'Mentions',
    nav_competitors:      'Competitors',
    nav_prompts:          'Prompts',
    nav_aiVisibility:     'AI Visibility',
    nav_recommendations:  'Recommendations',
    sidebar_client:       'CLIENT',
    sidebar_market:       'MARKET',
    sidebar_selectClient: 'Select client',
    sidebar_darkMode:     'Dark mode',
    sidebar_lightMode:    'Light mode',
    sidebar_signOut:      'Sign out',
    sidebar_allRegions:   'All regions',
    rec_actions:          'actions',
    rec_subtitle:         'Prioritised actions to grow AI visibility — ordered by impact',
    rec_whyLabel:         'Why this matters',
    rec_stepsLabel:       'Concrete steps',
    rec_effortLow:        'Low effort',
    rec_effortMedium:     'Medium effort',
    rec_effortHigh:       'High effort',
    rec_criticalPlatform: '1 AI platform with critical visibility gap',
    rec_criticalPlatforms:'{n} AI platforms with critical visibility gap',
    rec_criticalBody:     'Current average visibility: {rate}%. Actions below are ordered by estimated impact — those marked Critical close the biggest gap fastest.',
    rec_goodTitle:        'Good visibility across all platforms',
    rec_goodBody:         'The actions below help you strengthen positions and maintain your edge over competitors.',
    rec_empty:            'Not enough data for recommendations yet. Run the LLM collector first.',
    rec_loading:          'Analysing data...',
  },
  es: {
    nav_overview:         'Resumen',
    nav_mentions:         'Menciones',
    nav_competitors:      'Competidores',
    nav_prompts:          'Prompts',
    nav_aiVisibility:     'Visibilidad IA',
    nav_recommendations:  'Recomendaciones',
    sidebar_client:       'CLIENTE',
    sidebar_market:       'MERCADO',
    sidebar_selectClient: 'Seleccionar cliente',
    sidebar_darkMode:     'Modo oscuro',
    sidebar_lightMode:    'Modo claro',
    sidebar_signOut:      'Cerrar sesión',
    sidebar_allRegions:   'Todas las regiones',
    rec_actions:          'acciones',
    rec_subtitle:         'Acciones priorizadas para aumentar la visibilidad en IA — ordenadas por impacto',
    rec_whyLabel:         'Por qué importa',
    rec_stepsLabel:       'Pasos concretos',
    rec_effortLow:        'Poco esfuerzo',
    rec_effortMedium:     'Esfuerzo medio',
    rec_effortHigh:       'Alto esfuerzo',
    rec_criticalPlatform: '1 plataforma de IA con brecha crítica',
    rec_criticalPlatforms:'{n} plataformas de IA con brecha crítica',
    rec_criticalBody:     'Visibilidad media actual: {rate}%. Las acciones a continuación están ordenadas por impacto estimado.',
    rec_goodTitle:        'Buena visibilidad en todas las plataformas',
    rec_goodBody:         'Las acciones a continuación le ayudan a fortalecer posiciones y mantener su ventaja.',
    rec_empty:            'Datos insuficientes para recomendaciones. Ejecute el colector LLM primero.',
    rec_loading:          'Analizando datos...',
  },
  de: {
    nav_overview:         'Übersicht',
    nav_mentions:         'Erwähnungen',
    nav_competitors:      'Wettbewerber',
    nav_prompts:          'Prompts',
    nav_aiVisibility:     'KI-Sichtbarkeit',
    nav_recommendations:  'Empfehlungen',
    sidebar_client:       'KUNDE',
    sidebar_market:       'MARKT',
    sidebar_selectClient: 'Kunden auswählen',
    sidebar_darkMode:     'Dunkelmodus',
    sidebar_lightMode:    'Hellmodus',
    sidebar_signOut:      'Abmelden',
    sidebar_allRegions:   'Alle Regionen',
    rec_actions:          'Maßnahmen',
    rec_subtitle:         'Priorisierte Maßnahmen zur Steigerung der KI-Sichtbarkeit — nach Wirkung sortiert',
    rec_whyLabel:         'Warum das wichtig ist',
    rec_stepsLabel:       'Konkrete Schritte',
    rec_effortLow:        'Geringer Aufwand',
    rec_effortMedium:     'Mittlerer Aufwand',
    rec_effortHigh:       'Hoher Aufwand',
    rec_criticalPlatform: '1 KI-Plattform mit kritischer Sichtbarkeitslücke',
    rec_criticalPlatforms:'{n} KI-Plattformen mit kritischer Sichtbarkeitslücke',
    rec_criticalBody:     'Aktuelle durchschnittliche Sichtbarkeit: {rate}%. Maßnahmen unten sind nach geschätztem Einfluss geordnet.',
    rec_goodTitle:        'Gute Sichtbarkeit auf allen Plattformen',
    rec_goodBody:         'Die folgenden Maßnahmen helfen Ihnen, Positionen zu stärken und Vorteile zu erhalten.',
    rec_empty:            'Noch nicht genügend Daten für Empfehlungen. Führen Sie zuerst den LLM-Collector aus.',
    rec_loading:          'Daten werden analysiert...',
  },
  fr: {
    nav_overview:         'Vue d\'ensemble',
    nav_mentions:         'Mentions',
    nav_competitors:      'Concurrents',
    nav_prompts:          'Prompts',
    nav_aiVisibility:     'Visibilité IA',
    nav_recommendations:  'Recommandations',
    sidebar_client:       'CLIENT',
    sidebar_market:       'MARCHÉ',
    sidebar_selectClient: 'Sélectionner un client',
    sidebar_darkMode:     'Mode sombre',
    sidebar_lightMode:    'Mode clair',
    sidebar_signOut:      'Se déconnecter',
    sidebar_allRegions:   'Toutes les régions',
    rec_actions:          'actions',
    rec_subtitle:         'Actions priorisées pour accroître la visibilité IA — triées par impact',
    rec_whyLabel:         'Pourquoi c\'est important',
    rec_stepsLabel:       'Étapes concrètes',
    rec_effortLow:        'Faible effort',
    rec_effortMedium:     'Effort moyen',
    rec_effortHigh:       'Effort élevé',
    rec_criticalPlatform: '1 plateforme IA avec un écart critique',
    rec_criticalPlatforms:'{n} plateformes IA avec un écart critique',
    rec_criticalBody:     'Visibilité moyenne actuelle : {rate}%. Les actions ci-dessous sont classées par impact estimé.',
    rec_goodTitle:        'Bonne visibilité sur toutes les plateformes',
    rec_goodBody:         'Les actions ci-dessous vous aident à renforcer vos positions et à maintenir votre avantage.',
    rec_empty:            'Pas assez de données pour des recommandations. Exécutez d\'abord le collecteur LLM.',
    rec_loading:          'Analyse des données en cours...',
  },
  nl: {
    nav_overview:         'Overzicht',
    nav_mentions:         'Vermeldingen',
    nav_competitors:      'Concurrenten',
    nav_prompts:          'Prompts',
    nav_aiVisibility:     'AI-zichtbaarheid',
    nav_recommendations:  'Aanbevelingen',
    sidebar_client:       'KLANT',
    sidebar_market:       'MARKT',
    sidebar_selectClient: 'Klant selecteren',
    sidebar_darkMode:     'Donkere modus',
    sidebar_lightMode:    'Lichte modus',
    sidebar_signOut:      'Uitloggen',
    sidebar_allRegions:   'Alle regio\'s',
    rec_actions:          'acties',
    rec_subtitle:         'Geprioriteerde acties om AI-zichtbaarheid te vergroten — gesorteerd op impact',
    rec_whyLabel:         'Waarom dit belangrijk is',
    rec_stepsLabel:       'Concrete stappen',
    rec_effortLow:        'Weinig moeite',
    rec_effortMedium:     'Gemiddelde moeite',
    rec_effortHigh:       'Veel moeite',
    rec_criticalPlatform: '1 AI-platform met kritiek zichtbaarheidsgat',
    rec_criticalPlatforms:'{n} AI-platforms met kritiek zichtbaarheidsgat',
    rec_criticalBody:     'Huidige gemiddelde zichtbaarheid: {rate}%. Onderstaande acties zijn gerangschikt op geschatte impact.',
    rec_goodTitle:        'Goede zichtbaarheid op alle platforms',
    rec_goodBody:         'De onderstaande acties helpen u posities te versterken en uw voorsprong te behouden.',
    rec_empty:            'Nog niet genoeg data voor aanbevelingen. Voer eerst de LLM-collector uit.',
    rec_loading:          'Gegevens analyseren...',
  },
  ro: {
    nav_overview:         'Prezentare',
    nav_mentions:         'Mențiuni',
    nav_competitors:      'Concurenți',
    nav_prompts:          'Prompturi',
    nav_aiVisibility:     'Vizibilitate AI',
    nav_recommendations:  'Recomandări',
    sidebar_client:       'CLIENT',
    sidebar_market:       'PIAȚĂ',
    sidebar_selectClient: 'Selectează client',
    sidebar_darkMode:     'Mod întunecat',
    sidebar_lightMode:    'Mod luminos',
    sidebar_signOut:      'Deconectare',
    sidebar_allRegions:   'Toate regiunile',
    rec_actions:          'acțiuni',
    rec_subtitle:         'Acțiuni prioritizate pentru a crește vizibilitatea AI — ordonate după impact',
    rec_whyLabel:         'De ce contează',
    rec_stepsLabel:       'Pași concreți',
    rec_effortLow:        'Efort mic',
    rec_effortMedium:     'Efort mediu',
    rec_effortHigh:       'Efort mare',
    rec_criticalPlatform: '1 platformă AI cu vizibilitate critică',
    rec_criticalPlatforms:'{n} platforme AI cu vizibilitate critică',
    rec_criticalBody:     'Vizibilitate medie actuală: {rate}%. Acțiunile de mai jos sunt ordonate după impactul estimat.',
    rec_goodTitle:        'Vizibilitate bună pe toate platformele',
    rec_goodBody:         'Acțiunile de mai jos te ajută să îmbunătățești pozițiile și să menții avantajul față de concurenți.',
    rec_empty:            'Date insuficiente pentru recomandări. Rulează mai întâi colectorul LLM.',
    rec_loading:          'Se analizează datele...',
  },
  pt: {
    nav_overview:         'Visão geral',
    nav_mentions:         'Menções',
    nav_competitors:      'Concorrentes',
    nav_prompts:          'Prompts',
    nav_aiVisibility:     'Visibilidade IA',
    nav_recommendations:  'Recomendações',
    sidebar_client:       'CLIENTE',
    sidebar_market:       'MERCADO',
    sidebar_selectClient: 'Selecionar cliente',
    sidebar_darkMode:     'Modo escuro',
    sidebar_lightMode:    'Modo claro',
    sidebar_signOut:      'Sair',
    sidebar_allRegions:   'Todas as regiões',
    rec_actions:          'ações',
    rec_subtitle:         'Ações priorizadas para aumentar a visibilidade em IA — ordenadas por impacto',
    rec_whyLabel:         'Por que isso importa',
    rec_stepsLabel:       'Passos concretos',
    rec_effortLow:        'Baixo esforço',
    rec_effortMedium:     'Esforço médio',
    rec_effortHigh:       'Alto esforço',
    rec_criticalPlatform: '1 plataforma de IA com lacuna crítica',
    rec_criticalPlatforms:'{n} plataformas de IA com lacuna crítica',
    rec_criticalBody:     'Visibilidade média atual: {rate}%. As ações abaixo estão ordenadas por impacto estimado.',
    rec_goodTitle:        'Boa visibilidade em todas as plataformas',
    rec_goodBody:         'As ações abaixo ajudam você a fortalecer posições e manter sua vantagem.',
    rec_empty:            'Dados insuficientes para recomendações. Execute o coletor LLM primeiro.',
    rec_loading:          'Analisando dados...',
  },
  it: {
    nav_overview:         'Panoramica',
    nav_mentions:         'Menzioni',
    nav_competitors:      'Concorrenti',
    nav_prompts:          'Prompt',
    nav_aiVisibility:     'Visibilità IA',
    nav_recommendations:  'Raccomandazioni',
    sidebar_client:       'CLIENTE',
    sidebar_market:       'MERCATO',
    sidebar_selectClient: 'Seleziona cliente',
    sidebar_darkMode:     'Modalità scura',
    sidebar_lightMode:    'Modalità chiara',
    sidebar_signOut:      'Esci',
    sidebar_allRegions:   'Tutte le regioni',
    rec_actions:          'azioni',
    rec_subtitle:         'Azioni prioritarie per aumentare la visibilità IA — ordinate per impatto',
    rec_whyLabel:         'Perché è importante',
    rec_stepsLabel:       'Passi concreti',
    rec_effortLow:        'Basso sforzo',
    rec_effortMedium:     'Sforzo medio',
    rec_effortHigh:       'Alto sforzo',
    rec_criticalPlatform: '1 piattaforma IA con gap critico',
    rec_criticalPlatforms:'{n} piattaforme IA con gap critico',
    rec_criticalBody:     'Visibilità media attuale: {rate}%. Le azioni seguenti sono ordinate per impatto stimato.',
    rec_goodTitle:        'Buona visibilità su tutte le piattaforme',
    rec_goodBody:         'Le azioni seguenti ti aiutano a rafforzare le posizioni e mantenere il vantaggio.',
    rec_empty:            'Dati insufficienti per le raccomandazioni. Esegui prima il collettore LLM.',
    rec_loading:          'Analisi dei dati in corso...',
  },
}

// ── Context ───────────────────────────────────────────────────────────────────
interface I18nCtx {
  lang:    LangId
  setLang: (l: LangId) => void
  t:       Strings
}

const Ctx = createContext<I18nCtx>({
  lang:    'en',
  setLang: () => {},
  t:       T.en,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const saved = (localStorage.getItem('brandgeo_lang') ?? 'en') as LangId
  const initial = LANGUAGES.find(l => l.id === saved) ? saved : 'en'
  const [lang, setLangState] = useState<LangId>(initial)

  const setLang = (l: LangId) => {
    localStorage.setItem('brandgeo_lang', l)
    setLangState(l)
  }

  return <Ctx.Provider value={{ lang, setLang, t: T[lang] }}>{children}</Ctx.Provider>
}

export function useI18n() {
  return useContext(Ctx)
}

// ── Helper: replace {n} and {rate} placeholders ───────────────────────────────
export function fmt(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    template,
  )
}
