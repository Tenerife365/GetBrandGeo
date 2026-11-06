// Pure market data. No React: shared with Netlify functions through esbuild.

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
}

export const MARKETS: Market[] = [
  // ── Global & Regions ──────────────────────────────────────────────────────
  {
    id: 'WW', label: 'Worldwide', flag: '', flagCode: 'un',
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
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BE', label: 'Berlin' }, { id: 'MU', label: 'Munich' }, { id: 'HH', label: 'Hamburg' }, { id: 'FRA', label: 'Frankfurt' }],
  },
  {
    id: 'GB', label: 'UK', flag: '', flagCode: 'gb',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LDN', label: 'London' }, { id: 'MAN', label: 'Manchester' }, { id: 'EDI', label: 'Edinburgh' }],
  },
  {
    id: 'IE', label: 'Ireland', flag: '', flagCode: 'ie',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'DUB', label: 'Dublin' }, { id: 'CRK', label: 'Cork' }],
  },
  {
    id: 'FR', label: 'France', flag: '', flagCode: 'fr',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'PAR', label: 'Paris' }, { id: 'LYO', label: 'Lyon' }, { id: 'MRS', label: 'Marseille' }],
  },
  {
    id: 'ES', label: 'Spain', flag: '', flagCode: 'es',
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
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'AMS', label: 'Amsterdam' }, { id: 'RTM', label: 'Rotterdam' }],
  },
  {
    id: 'IT', label: 'Italy', flag: '', flagCode: 'it',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MIL', label: 'Milan' }, { id: 'ROM', label: 'Rome' }],
  },
  {
    id: 'PL', label: 'Poland', flag: '', flagCode: 'pl',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'WAW', label: 'Warsaw' }, { id: 'KRK', label: 'Krakow' }],
  },
  {
    id: 'PT', label: 'Portugal', flag: '', flagCode: 'pt',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'LIS', label: 'Lisbon' }, { id: 'OPO', label: 'Porto' }],
  },
  {
    id: 'BE', label: 'Belgium', flag: '', flagCode: 'be',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BRU', label: 'Brussels' }, { id: 'ANT', label: 'Antwerp' }],
  },
  {
    id: 'CH', label: 'Switzerland', flag: '', flagCode: 'ch',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'ZRH', label: 'Zurich' }, { id: 'GVA', label: 'Geneva' }],
  },
  {
    id: 'AT', label: 'Austria', flag: '', flagCode: 'at',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'VIE', label: 'Vienna' }],
  },
  {
    id: 'SE', label: 'Sweden', flag: '', flagCode: 'se',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'STO', label: 'Stockholm' }],
  },
  {
    id: 'DK', label: 'Denmark', flag: '', flagCode: 'dk',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'CPH', label: 'Copenhagen' }],
  },
  // ── Americas ──────────────────────────────────────────────────────────────
  {
    id: 'US', label: 'USA', flag: '', flagCode: 'us',
    regions: [{ id: 'ALL', label: 'All states' }, { id: 'NYC', label: 'New York' }, { id: 'LA', label: 'Los Angeles' }, { id: 'CHI', label: 'Chicago' }, { id: 'MIA', label: 'Miami' }, { id: 'HOU', label: 'Houston' }, { id: 'DAL', label: 'Dallas' }],
  },
  {
    id: 'CA', label: 'Canada', flag: '', flagCode: 'ca',
    regions: [{ id: 'ALL', label: 'All provinces' }, { id: 'TOR', label: 'Toronto' }, { id: 'VAN', label: 'Vancouver' }, { id: 'MTL', label: 'Montreal' }],
  },
  {
    id: 'BR', label: 'Brazil', flag: '', flagCode: 'br',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SAO', label: 'São Paulo' }, { id: 'RIO', label: 'Rio de Janeiro' }],
  },
  {
    id: 'MX', label: 'Mexico', flag: '', flagCode: 'mx',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'MEX', label: 'Mexico City' }, { id: 'GDL', label: 'Guadalajara' }],
  },
  // ── APAC ──────────────────────────────────────────────────────────────────
  {
    id: 'AU', label: 'Australia', flag: '', flagCode: 'au',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'SYD', label: 'Sydney' }, { id: 'MEL', label: 'Melbourne' }, { id: 'BNE', label: 'Brisbane' }],
  },
  {
    id: 'SG', label: 'Singapore', flag: '', flagCode: 'sg',
    regions: [{ id: 'ALL', label: 'Singapore' }],
  },
  {
    id: 'IN', label: 'India', flag: '', flagCode: 'in',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'BOM', label: 'Mumbai' }, { id: 'BLR', label: 'Bangalore' }, { id: 'DEL', label: 'Delhi' }],
  },
  {
    id: 'JP', label: 'Japan', flag: '', flagCode: 'jp',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'TYO', label: 'Tokyo' }, { id: 'OSA', label: 'Osaka' }],
  },
  // ── Middle East ───────────────────────────────────────────────────────────
  {
    id: 'AE', label: 'UAE', flag: '', flagCode: 'ae',
    regions: [{ id: 'ALL', label: 'All emirates' }, { id: 'DXB', label: 'Dubai' }, { id: 'AUH', label: 'Abu Dhabi' }],
  },
  {
    id: 'SA', label: 'Saudi Arabia', flag: '', flagCode: 'sa',
    regions: [{ id: 'ALL', label: 'All regions' }, { id: 'RIY', label: 'Riyadh' }, { id: 'JED', label: 'Jeddah' }],
  },
]
