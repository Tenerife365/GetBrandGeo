/**
 * _market_regions.js - plain JavaScript mirror of MARKETS in src/lib/markets.ts,
 * reduced to ids, labels and region order. Data only, CommonJS, no require.
 *
 * Why a mirror (docs/arch/multi-location-collection.md section 5.2, M1): a
 * function bundled by Netlify's default bundler ships a required .ts file as
 * it is, so no file reachable from such a function may require a .ts file.
 * _locations.js reads this file, never markets.ts.
 *
 * Rules: same order as MARKETS; append only, exactly as markets.ts is. A market
 * or region added to markets.ts fails tests/market_regions_mirror.test.js until
 * it is copied here.
 */
const MARKET_REGIONS = [
  { id: 'WW', label: 'Worldwide', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'EU', label: 'Europe' }, { id: 'NA', label: 'North America' },
    { id: 'LATAM', label: 'Latin America' }, { id: 'APAC', label: 'Asia Pacific' },
    { id: 'MEA', label: 'Middle East & Africa' }, { id: 'OCE', label: 'Oceania' },
  ] },
  { id: 'RO', label: 'Romania', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'B', label: 'Bucharest' }, { id: 'SB', label: 'Sibiu' },
    { id: 'CJ', label: 'Cluj-Napoca' }, { id: 'CT', label: 'Constanta' }, { id: 'IS', label: 'Iasi' },
  ] },
  { id: 'DE', label: 'Germany', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BE', label: 'Berlin' }, { id: 'MU', label: 'Munich' },
    { id: 'HH', label: 'Hamburg' }, { id: 'FRA', label: 'Frankfurt' }, { id: 'CGN', label: 'Cologne' },
    { id: 'STR', label: 'Stuttgart' }, { id: 'DUS', label: 'Dusseldorf' },
  ] },
  { id: 'GB', label: 'UK', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'LDN', label: 'London' }, { id: 'MAN', label: 'Manchester' },
    { id: 'EDI', label: 'Edinburgh' }, { id: 'BHX', label: 'Birmingham' }, { id: 'GLA', label: 'Glasgow' },
    { id: 'LDS', label: 'Leeds' },
  ] },
  { id: 'IE', label: 'Ireland', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'DUB', label: 'Dublin' }, { id: 'CRK', label: 'Cork' },
    { id: 'GWY', label: 'Galway' }, { id: 'LIM', label: 'Limerick' },
  ] },
  { id: 'FR', label: 'France', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'PAR', label: 'Paris' }, { id: 'LYO', label: 'Lyon' },
    { id: 'MRS', label: 'Marseille' }, { id: 'TLS', label: 'Toulouse' }, { id: 'NCE', label: 'Nice' },
  ] },
  { id: 'ES', label: 'Spain', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'MAD', label: 'Madrid' }, { id: 'BCN', label: 'Barcelona' },
    { id: 'VAL', label: 'Valencia' }, { id: 'SVQ', label: 'Seville' }, { id: 'AGP', label: 'Málaga' },
    { id: 'BIO', label: 'Bilbao' }, { id: 'ZAZ', label: 'Zaragoza' }, { id: 'TF', label: 'Tenerife' },
    { id: 'LPA', label: 'Las Palmas' }, { id: 'IBZ', label: 'Ibiza' }, { id: 'PMI', label: 'Palma de Mallorca' },
  ] },
  { id: 'NL', label: 'Netherlands', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'AMS', label: 'Amsterdam' }, { id: 'RTM', label: 'Rotterdam' },
    { id: 'HAG', label: 'The Hague' }, { id: 'UTR', label: 'Utrecht' },
  ] },
  { id: 'IT', label: 'Italy', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'MIL', label: 'Milan' }, { id: 'ROM', label: 'Rome' },
    { id: 'NAP', label: 'Naples' }, { id: 'TRN', label: 'Turin' },
  ] },
  { id: 'PL', label: 'Poland', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'WAW', label: 'Warsaw' }, { id: 'KRK', label: 'Krakow' },
    { id: 'WRO', label: 'Wroclaw' }, { id: 'GDN', label: 'Gdansk' },
  ] },
  { id: 'PT', label: 'Portugal', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'LIS', label: 'Lisbon' }, { id: 'OPO', label: 'Porto' },
    { id: 'FAO', label: 'Faro' },
  ] },
  { id: 'BE', label: 'Belgium', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BRU', label: 'Brussels' }, { id: 'ANT', label: 'Antwerp' },
    { id: 'GNT', label: 'Ghent' },
  ] },
  { id: 'CH', label: 'Switzerland', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'ZRH', label: 'Zurich' }, { id: 'GVA', label: 'Geneva' },
    { id: 'BSL', label: 'Basel' }, { id: 'BRN', label: 'Bern' },
  ] },
  { id: 'AT', label: 'Austria', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'VIE', label: 'Vienna' }, { id: 'SZG', label: 'Salzburg' },
    { id: 'GRZ', label: 'Graz' },
  ] },
  { id: 'SE', label: 'Sweden', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'STO', label: 'Stockholm' }, { id: 'GOT', label: 'Gothenburg' },
    { id: 'MMA', label: 'Malmo' },
  ] },
  { id: 'DK', label: 'Denmark', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'CPH', label: 'Copenhagen' }, { id: 'AAR', label: 'Aarhus' },
  ] },
  { id: 'US', label: 'USA', regions: [
    { id: 'ALL', label: 'All states' }, { id: 'NYC', label: 'New York' }, { id: 'LA', label: 'Los Angeles' },
    { id: 'CHI', label: 'Chicago' }, { id: 'MIA', label: 'Miami' }, { id: 'HOU', label: 'Houston' },
    { id: 'DAL', label: 'Dallas' }, { id: 'SFO', label: 'San Francisco' }, { id: 'SEA', label: 'Seattle' },
    { id: 'BOS', label: 'Boston' }, { id: 'DC', label: 'Washington DC' }, { id: 'ATL', label: 'Atlanta' },
    { id: 'DEN', label: 'Denver' }, { id: 'PHX', label: 'Phoenix' },
  ] },
  { id: 'CA', label: 'Canada', regions: [
    { id: 'ALL', label: 'All provinces' }, { id: 'TOR', label: 'Toronto' }, { id: 'VAN', label: 'Vancouver' },
    { id: 'MTL', label: 'Montreal' }, { id: 'YYC', label: 'Calgary' }, { id: 'YOW', label: 'Ottawa' },
  ] },
  { id: 'BR', label: 'Brazil', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'SAO', label: 'São Paulo' }, { id: 'RIO', label: 'Rio de Janeiro' },
    { id: 'BSB', label: 'Brasilia' }, { id: 'BHZ', label: 'Belo Horizonte' },
  ] },
  { id: 'MX', label: 'Mexico', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'MEX', label: 'Mexico City' }, { id: 'GDL', label: 'Guadalajara' },
    { id: 'MTY', label: 'Monterrey' },
  ] },
  { id: 'AU', label: 'Australia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'SYD', label: 'Sydney' }, { id: 'MEL', label: 'Melbourne' },
    { id: 'BNE', label: 'Brisbane' }, { id: 'PER', label: 'Perth' }, { id: 'ADL', label: 'Adelaide' },
    { id: 'CBR', label: 'Canberra' },
  ] },
  { id: 'SG', label: 'Singapore', regions: [
    { id: 'ALL', label: 'Singapore' },
  ] },
  { id: 'IN', label: 'India', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BOM', label: 'Mumbai' }, { id: 'BLR', label: 'Bangalore' },
    { id: 'DEL', label: 'Delhi' }, { id: 'HYD', label: 'Hyderabad' }, { id: 'MAA', label: 'Chennai' },
    { id: 'PNQ', label: 'Pune' },
  ] },
  { id: 'JP', label: 'Japan', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'TYO', label: 'Tokyo' }, { id: 'OSA', label: 'Osaka' },
    { id: 'NGO', label: 'Nagoya' }, { id: 'FUK', label: 'Fukuoka' },
  ] },
  { id: 'AE', label: 'UAE', regions: [
    { id: 'ALL', label: 'All emirates' }, { id: 'DXB', label: 'Dubai' }, { id: 'AUH', label: 'Abu Dhabi' },
    { id: 'SHJ', label: 'Sharjah' },
  ] },
  { id: 'SA', label: 'Saudi Arabia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'RIY', label: 'Riyadh' }, { id: 'JED', label: 'Jeddah' },
  ] },
  { id: 'KR', label: 'South Korea', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'SEL', label: 'Seoul' }, { id: 'PUS', label: 'Busan' },
    { id: 'ICN', label: 'Incheon' }, { id: 'TAE', label: 'Daegu' },
  ] },
  { id: 'NZ', label: 'New Zealand', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'AKL', label: 'Auckland' }, { id: 'WLG', label: 'Wellington' },
    { id: 'CHC', label: 'Christchurch' },
  ] },
  { id: 'HK', label: 'Hong Kong', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'TW', label: 'Taiwan', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'TPE', label: 'Taipei' }, { id: 'KHH', label: 'Kaohsiung' },
    { id: 'TXG', label: 'Taichung' },
  ] },
  { id: 'MY', label: 'Malaysia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'KUL', label: 'Kuala Lumpur' }, { id: 'PEN', label: 'Penang' },
    { id: 'JHB', label: 'Johor Bahru' },
  ] },
  { id: 'TH', label: 'Thailand', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BKK', label: 'Bangkok' }, { id: 'CNX', label: 'Chiang Mai' },
    { id: 'HKT', label: 'Phuket' },
  ] },
  { id: 'ID', label: 'Indonesia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'JKT', label: 'Jakarta' }, { id: 'SUB', label: 'Surabaya' },
    { id: 'BDO', label: 'Bandung' }, { id: 'DPS', label: 'Denpasar' },
  ] },
  { id: 'PH', label: 'Philippines', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'MNL', label: 'Manila' }, { id: 'CEB', label: 'Cebu City' },
    { id: 'DVO', label: 'Davao City' },
  ] },
  { id: 'VN', label: 'Vietnam', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'SGN', label: 'Ho Chi Minh City' }, { id: 'HAN', label: 'Hanoi' },
    { id: 'DAD', label: 'Da Nang' },
  ] },
  { id: 'NO', label: 'Norway', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'OSL', label: 'Oslo' }, { id: 'BGO', label: 'Bergen' },
    { id: 'TRD', label: 'Trondheim' },
  ] },
  { id: 'FI', label: 'Finland', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'HEL', label: 'Helsinki' }, { id: 'TMP', label: 'Tampere' },
    { id: 'TKU', label: 'Turku' },
  ] },
  { id: 'IS', label: 'Iceland', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'LU', label: 'Luxembourg', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'GR', label: 'Greece', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'ATH', label: 'Athens' }, { id: 'SKG', label: 'Thessaloniki' },
  ] },
  { id: 'CZ', label: 'Czechia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'PRG', label: 'Prague' }, { id: 'BRQ', label: 'Brno' },
  ] },
  { id: 'HU', label: 'Hungary', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BUD', label: 'Budapest' }, { id: 'DEB', label: 'Debrecen' },
  ] },
  { id: 'SK', label: 'Slovakia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BTS', label: 'Bratislava' }, { id: 'KSC', label: 'Kosice' },
  ] },
  { id: 'SI', label: 'Slovenia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'LJU', label: 'Ljubljana' }, { id: 'MBX', label: 'Maribor' },
  ] },
  { id: 'HR', label: 'Croatia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'ZAG', label: 'Zagreb' }, { id: 'SPU', label: 'Split' },
  ] },
  { id: 'BG', label: 'Bulgaria', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'SOF', label: 'Sofia' }, { id: 'PDV', label: 'Plovdiv' },
    { id: 'VAR', label: 'Varna' },
  ] },
  { id: 'EE', label: 'Estonia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'TLL', label: 'Tallinn' }, { id: 'TAY', label: 'Tartu' },
  ] },
  { id: 'LV', label: 'Latvia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'RIX', label: 'Riga' }, { id: 'DGP', label: 'Daugavpils' },
  ] },
  { id: 'LT', label: 'Lithuania', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'VNO', label: 'Vilnius' }, { id: 'KUN', label: 'Kaunas' },
  ] },
  { id: 'CY', label: 'Cyprus', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'MT', label: 'Malta', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'TR', label: 'Turkey', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'IST', label: 'Istanbul' }, { id: 'ANK', label: 'Ankara' },
    { id: 'ADB', label: 'Izmir' },
  ] },
  { id: 'IL', label: 'Israel', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'TLV', label: 'Tel Aviv' }, { id: 'JRS', label: 'Jerusalem' },
    { id: 'HFA', label: 'Haifa' },
  ] },
  { id: 'QA', label: 'Qatar', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'KW', label: 'Kuwait', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'BH', label: 'Bahrain', regions: [
    { id: 'ALL', label: 'All regions' },
  ] },
  { id: 'OM', label: 'Oman', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'MCT', label: 'Muscat' }, { id: 'SLL', label: 'Salalah' },
  ] },
  { id: 'ZA', label: 'South Africa', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'JNB', label: 'Johannesburg' }, { id: 'CPT', label: 'Cape Town' },
    { id: 'DUR', label: 'Durban' },
  ] },
  { id: 'AR', label: 'Argentina', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BUE', label: 'Buenos Aires' }, { id: 'COR', label: 'Cordoba' },
    { id: 'ROS', label: 'Rosario' },
  ] },
  { id: 'CL', label: 'Chile', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'SCL', label: 'Santiago' }, { id: 'VAP', label: 'Valparaiso' },
  ] },
  { id: 'CO', label: 'Colombia', regions: [
    { id: 'ALL', label: 'All regions' }, { id: 'BOG', label: 'Bogota' }, { id: 'MDE', label: 'Medellin' },
    { id: 'CLO', label: 'Cali' },
  ] },
]

module.exports = { MARKET_REGIONS }
