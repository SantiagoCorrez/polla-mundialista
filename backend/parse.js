const fs = require('fs');

const data = `Fecha	Tiempo	Equipo 1	Equipo 2	Partido no.	equipos		Evento
jue, 11/06/2026 	21:00	México	Sudáfrica	1	A1	A2	Mexico City
vie, 12/06/2026 	4:00	Rep. de Corea	Checa	2	A3	A4	Guadalajara
vie, 12/06/2026 	21:00	Canadá	Bosnia/Herzeg.	3	B1	B2	Toronto
sáb, 13/06/2026 	3:00	EE.UU.	Paraguay	4	D1	D2	Los Angeles
sáb, 13/06/2026 	21:00	Qatar	Suiza	8	B3	B4	San Francisco Bay Area
dom, 14/06/2026 	0:00	Brasil	Marruecos	7	C1	C2	New York/New Jersey
dom, 14/06/2026 	3:00	Haiti	Escocia	5	C3	C4	Boston
dom, 14/06/2026 	6:00	Australia	Turquía	6	D3	D4	Vancouver
dom, 14/06/2026 	19:00	Alemania	Curazao	10	E1	E2	Houston
dom, 14/06/2026 	22:00	Países Bajos	Japón	11	F1	F2	Dallas
lun, 15/06/2026 	1:00	Costa de Marfil	Ecuador	9	E3	E4	Philadelphia
lun, 15/06/2026 	4:00	Suecia	Túnez	12	F3	F4	Monterrey
lun, 15/06/2026 	18:00	España	Cabo Verde	14	H1	H2	Atlanta
lun, 15/06/2026 	21:00	Bélgica	Egipto	16	G1	G2	Seattle
mar, 16/06/2026 	0:00	Arabia Saudita	Uruguay	13	H3	H4	Miami
mar, 16/06/2026 	3:00	IR Irán	Nueva Zelanda	15	G3	G4	Los Angeles
mar, 16/06/2026 	21:00	Francia	Senegal	17	I1	I2	New York/New Jersey
mié, 17/06/2026 	0:00	Iraq	Noruega	18	I3	I4	Boston
mié, 17/06/2026 	3:00	Argentina	Argelia	19	J1	J2	Kansas City
mié, 17/06/2026 	6:00	Austria	Jordán	20	J3	J4	San Francisco Bay Area
mié, 17/06/2026 	19:00	Portugal	RD Congo	23	K1	K2	Houston
mié, 17/06/2026 	22:00	Inglaterra	Croacia	22	L1	L2	Dallas
jue, 18/06/2026 	1:00	Ghana	Panamá	21	L3	L4	Toronto
jue, 18/06/2026 	4:00	Uzbekistán	Colombia	24	K3	K4	Mexico City
jue, 18/06/2026 	18:00	Checa	Sudáfrica	25	A4	A2	Atlanta
jue, 18/06/2026 	21:00	Suiza	Bosnia/Herzeg.	26	B4	B2	Los Angeles
vie, 19/06/2026 	0:00	Canadá	Qatar	27	B1	B3	Vancouver
vie, 19/06/2026 	3:00	México	Rep. de Corea	28	A1	A3	Guadalajara
vie, 19/06/2026 	21:00	EE.UU.	Australia	32	D1	D3	Seattle
sáb, 20/06/2026 	0:00	Escocia	Marruecos	30	C4	C2	Boston
sáb, 20/06/2026 	3:00	Brasil	Haiti	29	C1	C3	Philadelphia
sáb, 20/06/2026 	6:00	Turquía	Paraguay	31	D4	D2	San Francisco Bay Area
sáb, 20/06/2026 	19:00	Países Bajos	Suecia	35	F1	F3	Houston
sáb, 20/06/2026 	22:00	Alemania	Costa de Marfil	33	E1	E3	Toronto
dom, 21/06/2026 	2:00	Ecuador	Curazao	34	E4	E2	Kansas City
dom, 21/06/2026 	6:00	Túnez	Japón	36	F4	F2	Monterrey
dom, 21/06/2026 	18:00	España	Arabia Saudita	38	H1	H3	Atlanta
dom, 21/06/2026 	21:00	Bélgica	IR Irán	39	G1	G3	Los Angeles
lun, 22/06/2026 	0:00	Uruguay	Cabo Verde	37	H4	H2	Miami
lun, 22/06/2026 	3:00	Nueva Zelanda	Egipto	40	G4	G2	Vancouver
lun, 22/06/2026 	19:00	Argentina	Austria	43	J1	J3	Dallas
lun, 22/06/2026 	23:00	Francia	Iraq	42	I1	I3	Philadelphia
mar, 23/06/2026 	2:00	Noruega	Senegal	41	I4	I2	New York/New Jersey
mar, 23/06/2026 	5:00	Jordán	Argelia	44	J4	J2	San Francisco Bay Area
mar, 23/06/2026 	19:00	Portugal	Uzbekistán	47	K1	K3	Houston
mar, 23/06/2026 	22:00	Inglaterra	Ghana	45	L1	L3	Boston
mié, 24/06/2026 	1:00	Panamá	Croacia	46	L4	L2	Toronto
mié, 24/06/2026 	4:00	Colombia	RD Congo	48	K4	K2	Guadalajara
mié, 24/06/2026 	21:00	Suiza	Canadá	51	B4	B1	Vancouver
mié, 24/06/2026 	21:00	Bosnia/Herzeg.	Qatar	52	B2	B3	Seattle
jue, 25/06/2026 	0:00	Escocia	Brasil	49	C4	C1	Miami
jue, 25/06/2026 	0:00	Marruecos	Haiti	50	C2	C3	Atlanta
jue, 25/06/2026 	3:00	Checa	México	53	A4	A1	Mexico City
jue, 25/06/2026 	3:00	Sudáfrica	Rep. de Corea	54	A2	A3	Monterrey
jue, 25/06/2026 	22:00	Curazao	Costa de Marfil	55	E2	E3	Philadelphia
jue, 25/06/2026 	22:00	Ecuador	Alemania	56	E4	E1	New York/New Jersey
vie, 26/06/2026 	1:00	Japón	Suecia	57	F2	F3	Dallas
vie, 26/06/2026 	1:00	Túnez	Países Bajos	58	F4	F1	Kansas City
vie, 26/06/2026 	4:00	Turquía	EE.UU.	59	D4	D1	Los Angeles
vie, 26/06/2026 	4:00	Paraguay	Australia	60	D2	D3	San Francisco Bay Area
vie, 26/06/2026 	21:00	Noruega	Francia	61	I4	I1	Boston
vie, 26/06/2026 	21:00	Senegal	Iraq	62	I2	I3	Toronto
sáb, 27/06/2026 	2:00	Cabo Verde	Arabia Saudita	65	H2	H3	Houston
sáb, 27/06/2026 	2:00	Uruguay	España	66	H4	H1	Guadalajara
sáb, 27/06/2026 	5:00	Egipto	IR Irán	63	G2	G3	Seattle
sáb, 27/06/2026 	5:00	Nueva Zelanda	Bélgica	64	G4	G1	Vancouver
sáb, 27/06/2026 	23:00	Panamá	Inglaterra	67	L4	L1	New York/New Jersey
sáb, 27/06/2026 	23:00	Croacia	Ghana	68	L2	L3	Philadelphia
dom, 28/06/2026 	1:30	Colombia	Portugal	71	K4	K1	Miami
dom, 28/06/2026 	1:30	RD Congo	Uzbekistán	72	K2	K3	Atlanta
dom, 28/06/2026 	4:00	Argelia	Austria	69	J2	J3	Kansas City
dom, 28/06/2026 	4:00	Jordán	Argentina	70	J4	J1	Dallas`;

const lines = data.split('\n').filter(Boolean).slice(1);

const teamsObj = {};
const matchData = [];

// Helper dict for country codes
const countryCodes = {
  'México': 'MX', 'Sudáfrica': 'ZA', 'Rep. de Corea': 'KR', 'Checa': 'CZ',
  'Canadá': 'CA', 'Bosnia/Herzeg.': 'BA', 'Qatar': 'QA', 'Suiza': 'CH',
  'EE.UU.': 'US', 'Paraguay': 'PY', 'Australia': 'AU', 'Turquía': 'TR',
  'Brasil': 'BR', 'Marruecos': 'MA', 'Haiti': 'HT', 'Escocia': 'GB-SCT',
  'Alemania': 'DE', 'Curazao': 'CW', 'Costa de Marfil': 'CI', 'Ecuador': 'EC',
  'Países Bajos': 'NL', 'Japón': 'JP', 'Suecia': 'SE', 'Túnez': 'TN',
  'España': 'ES', 'Cabo Verde': 'CV', 'Arabia Saudita': 'SA', 'Uruguay': 'UY',
  'Bélgica': 'BE', 'Egipto': 'EG', 'IR Irán': 'IR', 'Nueva Zelanda': 'NZ',
  'Francia': 'FR', 'Senegal': 'SN', 'Iraq': 'IQ', 'Noruega': 'NO',
  'Argentina': 'AR', 'Argelia': 'DZ', 'Austria': 'AT', 'Jordán': 'JO',
  'Portugal': 'PT', 'RD Congo': 'CD', 'Uzbekistán': 'UZ', 'Colombia': 'CO',
  'Inglaterra': 'GB-ENG', 'Croacia': 'HR', 'Ghana': 'GH', 'Panamá': 'PA'
};

const dateRegex = /([a-z.áéíóú]+), (\d{2})\/(\d{2})\/(\d{4})/;

lines.forEach(line => {
  const parts = line.split('\t').map(p => p.trim());
  const dateStr = parts[0];
  const timeStr = parts[1];
  const home = parts[2];
  const away = parts[3];
  const grp1 = parts[5];
  const stadium = parts[7];

  const group = grp1.charAt(0);
  
  if (!teamsObj[home]) teamsObj[home] = { name: home, code: countryCodes[home] || 'XX', group };
  if (!teamsObj[away]) teamsObj[away] = { name: away, code: countryCodes[away] || 'XX', group };

  let match = dateStr.match(dateRegex);
  if (match) {
    let d = match[2];
    let m = match[3];
    let y = match[4];
    
    let timeParts = timeStr.split(':');
    let H = timeParts[0].padStart(2, '0');
    let M = timeParts[1];
    
    const fullDate = y + '-' + m + '-' + d + 'T' + H + ':' + M + ':00Z';

    matchData.push({
      date: fullDate,
      home: home.replace(/'/g, "\\'"),
      away: away.replace(/'/g, "\\'"),
      group: group,
      stadium: stadium.replace(/'/g, "\\'")
    });
  } else {
    console.log("Date match failed for: " + dateStr);
  }
});

let teamsCode = "";
for (let key in teamsObj) {
  let t = teamsObj[key];
  teamsCode += "  { name: '" + t.name.replace(/'/g, "\\'") + "', countryCode: '" + t.code + "', group: '" + t.group + "' },\n";
}

let matchCode = "";
matchData.forEach(m => {
  matchCode += "  { home: '" + m.home + "', away: '" + m.away + "', date: new Date('" + m.date + "'), stadium: '" + m.stadium + "', group: '" + m.group + "' },\n";
});

const tsContent = "import { PrismaClient, Phase } from '@prisma/client';\n" +
"import bcrypt from 'bcrypt';\n\n" +
"const prisma = new PrismaClient();\n\n" +
"const TEAMS = [\n" + teamsCode + "];\n\n" +
"const FIXTURES = [\n" + matchCode + "];\n\n" +
"async function main() {\n" +
"  console.log('🌱 Starting seed...');\n" +
"  console.log('🗑️  Skipped clearing existing data manually (using reset instead)');\n\n" +
"  const adminHash = await bcrypt.hash('Admin123!', 12);\n" +
"  const admin = await prisma.user.upsert({\n" +
"    where: { username: 'admin' },\n" +
"    update: {},\n" +
"    create: {\n" +
"      fullName: 'Administrador',\n" +
"      username: 'admin',\n" +
"      email: 'admin@polla.com',\n" +
"      passwordHash: adminHash,\n" +
"      role: 'ADMIN',\n" +
"    },\n" +
"  });\n" +
"  console.log('👤 Admin verified: ' + admin.username);\n\n" +
"  const userHash = await bcrypt.hash('User123!', 12);\n" +
"  const testUser = await prisma.user.upsert({\n" +
"    where: { username: 'testuser' },\n" +
"    update: {},\n" +
"    create: {\n" +
"      fullName: 'Usuario Test',\n" +
"      username: 'testuser',\n" +
"      email: 'test@polla.com',\n" +
"      passwordHash: userHash,\n" +
"      role: 'USER',\n" +
"    },\n" +
"  });\n\n" +
"  const createdTeams = {};\n" +
"  for (const team of TEAMS) {\n" +
"    const created = await prisma.team.upsert({\n" +
"      where: { countryCode: team.countryCode },\n" +
"      update: { group: team.group, name: team.name },\n" +
"      create: {\n" +
"        name: team.name,\n" +
"        countryCode: team.countryCode,\n" +
"        group: team.group,\n" +
"        flagUrl: 'https://flagcdn.com/w80/' + team.countryCode.toLowerCase() + '.png',\n" +
"      },\n" +
"    });\n" +
"    createdTeams[team.name] = created.id;\n" +
"  }\n" +
"  console.log('🏴 Inserted/Verified ' + TEAMS.length + ' teams');\n\n" +
"  for (const match of FIXTURES) {\n" +
"    const homeId = createdTeams[match.home];\n" +
"    const awayId = createdTeams[match.away];\n" +
"    if(!homeId || !awayId) continue;\n" +
"    const existing = await prisma.match.findFirst({\n" +
"      where: { homeTeamId: homeId, awayTeamId: awayId, phase: 'GROUP_STAGE' }\n" +
"    });\n\n" +
"    if (!existing) {\n" +
"      await prisma.match.create({\n" +
"        data: {\n" +
"          homeTeamId: homeId,\n" +
"          awayTeamId: awayId,\n" +
"          phase: 'GROUP_STAGE',\n" +
"          group: match.group,\n" +
"          matchDate: match.date,\n" +
"          stadium: match.stadium,\n" +
"          status: 'SCHEDULED',\n" +
"        },\n" +
"      });\n" +
"    }\n" +
"  }\n\n" +
"  console.log('⚽ Inserted ' + FIXTURES.length + ' group stage matches');\n" +
"  console.log('✅ Seed completed successfully!');\n" +
"}\n\n" +
"main()\n" +
"  .catch((e) => {\n" +
"    console.error('❌ Seed error:', e);\n" +
"    process.exit(1);\n" +
"  })\n" +
"  .finally(async () => {\n" +
"    await prisma.$disconnect();\n" +
"  });\n";

fs.writeFileSync('prisma/seed.ts', tsContent);
console.log('seed.ts re-generated successfully!');
