// Pure market data. No React: shared with Netlify functions through esbuild.
//
// Rules for editing this list (ids are stored in clients.default_market_id,
// clients.default_region_id and localStorage, and tests pin the first two rows):
//   - never reorder, rename or remove an existing market or region;
//   - append new markets after the last one and new regions after the last
//     region of their market (display order is the selector's job);
//   - market id is an ISO 3166-1 alpha-2 code (engines receive it as the
//     country), flagCode is the same code in lowercase;
//   - the server reads a region label that starts with "All " as "whole country",
//     so the first region of a market is { id: 'ALL', label: 'All regions' }.

export interface Region {
  id:    string
  label: string
}

export interface Market {
  id:       string
  label:    string
  flag:     string
  flagCode: string
  regions:  Region[]
  /** Extra search terms for the selector. Never displayed. */
  aliases?: string[]
}

export const MARKETS: Market[] = [
  // ── Global & Regions ──────────────────────────────────────────────────────
  {
    id: 'WW', label: 'Worldwide', flag: '', flagCode: 'un',
    aliases: ['Global', 'World', 'International'],
    regions: [
      { id: 'ALL',   label: 'All regions'          },
      { id: 'EU',    label: 'Europe'               },
      { id: 'NA',    label: 'North America'        },
      { id: 'LATAM', label: 'Latin America'        },
      { id: 'APAC',  label: 'Asia Pacific'         },
      { id: 'MEA',   label: 'Middle East & Africa' },
      { id: 'OCE',   label: 'Oceania'              },
    ],
  },
  // ── Europe ────────────────────────────────────────────────────────────────
  {
    id: 'RO', label: 'Romania', flag: '', flagCode: 'ro',
    regions: [
      { id: 'ALL', label: 'All regions'  },
      { id: 'B',   label: 'Bucharest'   },
      { id: 'SB',  label: 'Sibiu'       },
      { id: 'CJ',  label: 'Cluj-Napoca' },
      { id: 'CT',  label: 'Constanta'   },
      { id: 'IS',  label: 'Iasi'        },
    ],
  },
  {
    id: 'DE', label: 'Germany', flag: '', flagCode: 'de',
    aliases: ['Deutschland'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BE', label: 'Berlin' }, { id: 'MU', label: 'Munich' }, { id: 'HH', label: 'Hamburg' }, { id: 'FRA', label: 'Frankfurt' }, { id: 'CGN', label: 'Cologne' }, { id: 'STR', label: 'Stuttgart' }, { id: 'DUS', label: 'Dusseldorf' }],
  },
  {
    id: 'GB', label: 'UK', flag: '', flagCode: 'gb',
    aliases: ['United Kingdom', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LDN', label: 'London' }, { id: 'MAN', label: 'Manchester' }, { id: 'EDI', label: 'Edinburgh' }, { id: 'BHX', label: 'Birmingham' }, { id: 'GLA', label: 'Glasgow' }, { id: 'LDS', label: 'Leeds' }],
  },
  {
    id: 'IE', label: 'Ireland', flag: '', flagCode: 'ie',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'DUB', label: 'Dublin' }, { id: 'CRK', label: 'Cork' }, { id: 'GWY', label: 'Galway' }, { id: 'LIM', label: 'Limerick' }],
  },
  {
    id: 'FR', label: 'France', flag: '', flagCode: 'fr',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'PAR', label: 'Paris' }, { id: 'LYO', label: 'Lyon' }, { id: 'MRS', label: 'Marseille' }, { id: 'TLS', label: 'Toulouse' }, { id: 'NCE', label: 'Nice' }],
  },
  {
    id: 'ES', label: 'Spain', flag: '', flagCode: 'es',
    aliases: ['Espana'],
    regions: [
      { id: 'ALL', label: 'All regions'  },
      { id: 'MAD', label: 'Madrid'       },
      { id: 'BCN', label: 'Barcelona'    },
      { id: 'VAL', label: 'Valencia'     },
      { id: 'SVQ', label: 'Seville'      },
      { id: 'AGP', label: 'Málaga'       },
      { id: 'BIO', label: 'Bilbao'       },
      { id: 'ZAZ', label: 'Zaragoza'     },
      // Canary Islands: Tenerife is where BrandGEO is based and where local
      // clients (e.g. Restaurante Transilvania) operate, so "general Spain"
      // was too coarse for their buyer-intent queries.
      { id: 'TF',  label: 'Tenerife'     },
      { id: 'LPA', label: 'Las Palmas'   },
      { id: 'IBZ', label: 'Ibiza'        },
      { id: 'PMI', label: 'Palma de Mallorca' },
    ],
  },
  {
    id: 'NL', label: 'Netherlands', flag: '', flagCode: 'nl',
    aliases: ['Holland', 'The Netherlands'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'AMS', label: 'Amsterdam' }, { id: 'RTM', label: 'Rotterdam' }, { id: 'HAG', label: 'The Hague' }, { id: 'UTR', label: 'Utrecht' }],
  },
  {
    id: 'IT', label: 'Italy', flag: '', flagCode: 'it',
    aliases: ['Italia'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MIL', label: 'Milan' }, { id: 'ROM', label: 'Rome' }, { id: 'NAP', label: 'Naples' }, { id: 'TRN', label: 'Turin' }],
  },
  {
    id: 'PL', label: 'Poland', flag: '', flagCode: 'pl',
    aliases: ['Polska'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'WAW', label: 'Warsaw' }, { id: 'KRK', label: 'Krakow' }, { id: 'WRO', label: 'Wroclaw' }, { id: 'GDN', label: 'Gdansk' }],
  },
  {
    id: 'PT', label: 'Portugal', flag: '', flagCode: 'pt',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LIS', label: 'Lisbon' }, { id: 'OPO', label: 'Porto' }, { id: 'FAO', label: 'Faro' }],
  },
  {
    id: 'BE', label: 'Belgium', flag: '', flagCode: 'be',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BRU', label: 'Brussels' }, { id: 'ANT', label: 'Antwerp' }, { id: 'GNT', label: 'Ghent' }],
  },
  {
    id: 'CH', label: 'Switzerland', flag: '', flagCode: 'ch',
    aliases: ['Schweiz', 'Suisse'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'ZRH', label: 'Zurich' }, { id: 'GVA', label: 'Geneva' }, { id: 'BSL', label: 'Basel' }, { id: 'BRN', label: 'Bern' }],
  },
  {
    id: 'AT', label: 'Austria', flag: '', flagCode: 'at',
    aliases: ['Osterreich'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'VIE', label: 'Vienna' }, { id: 'SZG', label: 'Salzburg' }, { id: 'GRZ', label: 'Graz' }],
  },
  {
    id: 'SE', label: 'Sweden', flag: '', flagCode: 'se',
    aliases: ['Sverige'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'STO', label: 'Stockholm' }, { id: 'GOT', label: 'Gothenburg' }, { id: 'MMA', label: 'Malmo' }],
  },
  {
    id: 'DK', label: 'Denmark', flag: '', flagCode: 'dk',
    aliases: ['Danmark'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'CPH', label: 'Copenhagen' }, { id: 'AAR', label: 'Aarhus' }],
  },
  // ── Americas ──────────────────────────────────────────────────────────────
  {
    id: 'US', label: 'USA', flag: '', flagCode: 'us',
    aliases: ['United States', 'United States of America', 'America', 'US'],
    regions: [{ id: 'ALL', label: 'All states' }, { id: 'NYC', label: 'New York' }, { id: 'LA', label: 'Los Angeles' }, { id: 'CHI', label: 'Chicago' }, { id: 'MIA', label: 'Miami' }, { id: 'HOU', label: 'Houston' }, { id: 'DAL', label: 'Dallas' }, { id: 'SFO', label: 'San Francisco' }, { id: 'SEA', label: 'Seattle' }, { id: 'BOS', label: 'Boston' }, { id: 'DC', label: 'Washington DC' }, { id: 'ATL', label: 'Atlanta' }, { id: 'DEN', label: 'Denver' }, { id: 'PHX', label: 'Phoenix' }],
  },
  {
    id: 'CA', label: 'Canada', flag: '', flagCode: 'ca',
    regions: [{ id: 'ALL', label: 'All provinces' }, { id: 'TOR', label: 'Toronto' }, { id: 'VAN', label: 'Vancouver' }, { id: 'MTL', label: 'Montreal' }, { id: 'YYC', label: 'Calgary' }, { id: 'YOW', label: 'Ottawa' }],
  },
  {
    id: 'BR', label: 'Brazil', flag: '', flagCode: 'br',
    aliases: ['Brasil'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SAO', label: 'São Paulo' }, { id: 'RIO', label: 'Rio de Janeiro' }, { id: 'BSB', label: 'Brasilia' }, { id: 'BHZ', label: 'Belo Horizonte' }],
  },
  {
    id: 'MX', label: 'Mexico', flag: '', flagCode: 'mx',
    aliases: ['Mejico'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MEX', label: 'Mexico City' }, { id: 'GDL', label: 'Guadalajara' }, { id: 'MTY', label: 'Monterrey' }],
  },
  // ── APAC ──────────────────────────────────────────────────────────────────
  {
    id: 'AU', label: 'Australia', flag: '', flagCode: 'au',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SYD', label: 'Sydney' }, { id: 'MEL', label: 'Melbourne' }, { id: 'BNE', label: 'Brisbane' }, { id: 'PER', label: 'Perth' }, { id: 'ADL', label: 'Adelaide' }, { id: 'CBR', label: 'Canberra' }],
  },
  {
    id: 'SG', label: 'Singapore', flag: '', flagCode: 'sg',
    regions: [{ id: 'ALL', label: 'Singapore' }],
  },
  {
    id: 'IN', label: 'India', flag: '', flagCode: 'in',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BOM', label: 'Mumbai' }, { id: 'BLR', label: 'Bangalore' }, { id: 'DEL', label: 'Delhi' }, { id: 'HYD', label: 'Hyderabad' }, { id: 'MAA', label: 'Chennai' }, { id: 'PNQ', label: 'Pune' }],
  },
  {
    id: 'JP', label: 'Japan', flag: '', flagCode: 'jp',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'TYO', label: 'Tokyo' }, { id: 'OSA', label: 'Osaka' }, { id: 'NGO', label: 'Nagoya' }, { id: 'FUK', label: 'Fukuoka' }],
  },
  // ── Middle East ───────────────────────────────────────────────────────────
  {
    id: 'AE', label: 'UAE', flag: '', flagCode: 'ae',
    aliases: ['United Arab Emirates', 'Emirates'],
    regions: [{ id: 'ALL', label: 'All emirates' }, { id: 'DXB', label: 'Dubai' }, { id: 'AUH', label: 'Abu Dhabi' }, { id: 'SHJ', label: 'Sharjah' }],
  },
  {
    id: 'SA', label: 'Saudi Arabia', flag: '', flagCode: 'sa',
    aliases: ['KSA'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'RIY', label: 'Riyadh' }, { id: 'JED', label: 'Jeddah' }],
  },
  // ── Added 2026-11-11 (appended: the first rows above are pinned by tests) ──
  // ── Asia Pacific ──────────────────────────────────────────────────────────
  {
    id: 'KR', label: 'South Korea', flag: '', flagCode: 'kr',
    aliases: ['Korea', 'Republic of Korea'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SEL', label: 'Seoul' }, { id: 'PUS', label: 'Busan' }, { id: 'ICN', label: 'Incheon' }, { id: 'TAE', label: 'Daegu' }],
  },
  {
    id: 'NZ', label: 'New Zealand', flag: '', flagCode: 'nz',
    aliases: ['Aotearoa'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'AKL', label: 'Auckland' }, { id: 'WLG', label: 'Wellington' }, { id: 'CHC', label: 'Christchurch' }],
  },
  {
    id: 'HK', label: 'Hong Kong', flag: '', flagCode: 'hk',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'TW', label: 'Taiwan', flag: '', flagCode: 'tw',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'TPE', label: 'Taipei' }, { id: 'KHH', label: 'Kaohsiung' }, { id: 'TXG', label: 'Taichung' }],
  },
  {
    id: 'MY', label: 'Malaysia', flag: '', flagCode: 'my',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'KUL', label: 'Kuala Lumpur' }, { id: 'PEN', label: 'Penang' }, { id: 'JHB', label: 'Johor Bahru' }],
  },
  {
    id: 'TH', label: 'Thailand', flag: '', flagCode: 'th',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BKK', label: 'Bangkok' }, { id: 'CNX', label: 'Chiang Mai' }, { id: 'HKT', label: 'Phuket' }],
  },
  {
    id: 'ID', label: 'Indonesia', flag: '', flagCode: 'id',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'JKT', label: 'Jakarta' }, { id: 'SUB', label: 'Surabaya' }, { id: 'BDO', label: 'Bandung' }, { id: 'DPS', label: 'Denpasar' }],
  },
  {
    id: 'PH', label: 'Philippines', flag: '', flagCode: 'ph',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MNL', label: 'Manila' }, { id: 'CEB', label: 'Cebu City' }, { id: 'DVO', label: 'Davao City' }],
  },
  {
    id: 'VN', label: 'Vietnam', flag: '', flagCode: 'vn',
    aliases: ['Viet Nam'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SGN', label: 'Ho Chi Minh City' }, { id: 'HAN', label: 'Hanoi' }, { id: 'DAD', label: 'Da Nang' }],
  },
  // ── Europe (more) ─────────────────────────────────────────────────────────
  {
    id: 'NO', label: 'Norway', flag: '', flagCode: 'no',
    aliases: ['Norge'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'OSL', label: 'Oslo' }, { id: 'BGO', label: 'Bergen' }, { id: 'TRD', label: 'Trondheim' }],
  },
  {
    id: 'FI', label: 'Finland', flag: '', flagCode: 'fi',
    aliases: ['Suomi'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'HEL', label: 'Helsinki' }, { id: 'TMP', label: 'Tampere' }, { id: 'TKU', label: 'Turku' }],
  },
  {
    id: 'IS', label: 'Iceland', flag: '', flagCode: 'is',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'LU', label: 'Luxembourg', flag: '', flagCode: 'lu',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'GR', label: 'Greece', flag: '', flagCode: 'gr',
    aliases: ['Hellas'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'ATH', label: 'Athens' }, { id: 'SKG', label: 'Thessaloniki' }],
  },
  {
    id: 'CZ', label: 'Czechia', flag: '', flagCode: 'cz',
    aliases: ['Czech Republic'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'PRG', label: 'Prague' }, { id: 'BRQ', label: 'Brno' }],
  },
  {
    id: 'HU', label: 'Hungary', flag: '', flagCode: 'hu',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BUD', label: 'Budapest' }, { id: 'DEB', label: 'Debrecen' }],
  },
  {
    id: 'SK', label: 'Slovakia', flag: '', flagCode: 'sk',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BTS', label: 'Bratislava' }, { id: 'KSC', label: 'Kosice' }],
  },
  {
    id: 'SI', label: 'Slovenia', flag: '', flagCode: 'si',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LJU', label: 'Ljubljana' }, { id: 'MBX', label: 'Maribor' }],
  },
  {
    id: 'HR', label: 'Croatia', flag: '', flagCode: 'hr',
    aliases: ['Hrvatska'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'ZAG', label: 'Zagreb' }, { id: 'SPU', label: 'Split' }],
  },
  {
    id: 'BG', label: 'Bulgaria', flag: '', flagCode: 'bg',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SOF', label: 'Sofia' }, { id: 'PDV', label: 'Plovdiv' }, { id: 'VAR', label: 'Varna' }],
  },
  {
    id: 'EE', label: 'Estonia', flag: '', flagCode: 'ee',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'TLL', label: 'Tallinn' }, { id: 'TAY', label: 'Tartu' }],
  },
  {
    id: 'LV', label: 'Latvia', flag: '', flagCode: 'lv',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'RIX', label: 'Riga' }, { id: 'DGP', label: 'Daugavpils' }],
  },
  {
    id: 'LT', label: 'Lithuania', flag: '', flagCode: 'lt',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'VNO', label: 'Vilnius' }, { id: 'KUN', label: 'Kaunas' }],
  },
  {
    id: 'CY', label: 'Cyprus', flag: '', flagCode: 'cy',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'MT', label: 'Malta', flag: '', flagCode: 'mt',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'TR', label: 'Turkey', flag: '', flagCode: 'tr',
    aliases: ['Turkiye'],
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'IST', label: 'Istanbul' }, { id: 'ANK', label: 'Ankara' }, { id: 'ADB', label: 'Izmir' }],
  },
  // ── Middle East & Africa (more) ───────────────────────────────────────────
  {
    id: 'IL', label: 'Israel', flag: '', flagCode: 'il',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'TLV', label: 'Tel Aviv' }, { id: 'JRS', label: 'Jerusalem' }, { id: 'HFA', label: 'Haifa' }],
  },
  {
    id: 'QA', label: 'Qatar', flag: '', flagCode: 'qa',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'KW', label: 'Kuwait', flag: '', flagCode: 'kw',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'BH', label: 'Bahrain', flag: '', flagCode: 'bh',
    regions: [{ id: 'ALL', label: 'All regions' }],
  },
  {
    id: 'OM', label: 'Oman', flag: '', flagCode: 'om',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MCT', label: 'Muscat' }, { id: 'SLL', label: 'Salalah' }],
  },
  {
    id: 'ZA', label: 'South Africa', flag: '', flagCode: 'za',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'JNB', label: 'Johannesburg' }, { id: 'CPT', label: 'Cape Town' }, { id: 'DUR', label: 'Durban' }],
  },
  // ── Latin America (more) ──────────────────────────────────────────────────
  {
    id: 'AR', label: 'Argentina', flag: '', flagCode: 'ar',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BUE', label: 'Buenos Aires' }, { id: 'COR', label: 'Cordoba' }, { id: 'ROS', label: 'Rosario' }],
  },
  {
    id: 'CL', label: 'Chile', flag: '', flagCode: 'cl',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SCL', label: 'Santiago' }, { id: 'VAP', label: 'Valparaiso' }],
  },
  {
    id: 'CO', label: 'Colombia', flag: '', flagCode: 'co',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BOG', label: 'Bogota' }, { id: 'MDE', label: 'Medellin' }, { id: 'CLO', label: 'Cali' }],
  },
]
