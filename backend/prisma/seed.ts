import { PrismaClient, Phase } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEAMS = [
  { name: 'México', countryCode: 'MX', group: 'A' },
  { name: 'Sudáfrica', countryCode: 'ZA', group: 'A' },
  { name: 'Rep. de Corea', countryCode: 'KR', group: 'A' },
  { name: 'Checa', countryCode: 'CZ', group: 'A' },
  { name: 'Canadá', countryCode: 'CA', group: 'B' },
  { name: 'Bosnia/Herzeg.', countryCode: 'BA', group: 'B' },
  { name: 'EE.UU.', countryCode: 'US', group: 'D' },
  { name: 'Paraguay', countryCode: 'PY', group: 'D' },
  { name: 'Qatar', countryCode: 'QA', group: 'B' },
  { name: 'Suiza', countryCode: 'CH', group: 'B' },
  { name: 'Brasil', countryCode: 'BR', group: 'C' },
  { name: 'Marruecos', countryCode: 'MA', group: 'C' },
  { name: 'Haiti', countryCode: 'HT', group: 'C' },
  { name: 'Escocia', countryCode: 'GB-SCT', group: 'C' },
  { name: 'Australia', countryCode: 'AU', group: 'D' },
  { name: 'Turquía', countryCode: 'TR', group: 'D' },
  { name: 'Alemania', countryCode: 'DE', group: 'E' },
  { name: 'Curazao', countryCode: 'CW', group: 'E' },
  { name: 'Países Bajos', countryCode: 'NL', group: 'F' },
  { name: 'Japón', countryCode: 'JP', group: 'F' },
  { name: 'Costa de Marfil', countryCode: 'CI', group: 'E' },
  { name: 'Ecuador', countryCode: 'EC', group: 'E' },
  { name: 'Suecia', countryCode: 'SE', group: 'F' },
  { name: 'Túnez', countryCode: 'TN', group: 'F' },
  { name: 'España', countryCode: 'ES', group: 'H' },
  { name: 'Cabo Verde', countryCode: 'CV', group: 'H' },
  { name: 'Bélgica', countryCode: 'BE', group: 'G' },
  { name: 'Egipto', countryCode: 'EG', group: 'G' },
  { name: 'Arabia Saudita', countryCode: 'SA', group: 'H' },
  { name: 'Uruguay', countryCode: 'UY', group: 'H' },
  { name: 'IR Irán', countryCode: 'IR', group: 'G' },
  { name: 'Nueva Zelanda', countryCode: 'NZ', group: 'G' },
  { name: 'Francia', countryCode: 'FR', group: 'I' },
  { name: 'Senegal', countryCode: 'SN', group: 'I' },
  { name: 'Iraq', countryCode: 'IQ', group: 'I' },
  { name: 'Noruega', countryCode: 'NO', group: 'I' },
  { name: 'Argentina', countryCode: 'AR', group: 'J' },
  { name: 'Argelia', countryCode: 'DZ', group: 'J' },
  { name: 'Austria', countryCode: 'AT', group: 'J' },
  { name: 'Jordán', countryCode: 'JO', group: 'J' },
  { name: 'Portugal', countryCode: 'PT', group: 'K' },
  { name: 'RD Congo', countryCode: 'CD', group: 'K' },
  { name: 'Inglaterra', countryCode: 'GB-ENG', group: 'L' },
  { name: 'Croacia', countryCode: 'HR', group: 'L' },
  { name: 'Ghana', countryCode: 'GH', group: 'L' },
  { name: 'Panamá', countryCode: 'PA', group: 'L' },
  { name: 'Uzbekistán', countryCode: 'UZ', group: 'K' },
  { name: 'Colombia', countryCode: 'CO', group: 'K' },
];

const FIXTURES = [
  { home: 'México', away: 'Sudáfrica', date: new Date('2026-06-11T21:00:00Z'), stadium: 'Mexico City', group: 'A' },
  { home: 'Rep. de Corea', away: 'Checa', date: new Date('2026-06-12T04:00:00Z'), stadium: 'Guadalajara', group: 'A' },
  { home: 'Canadá', away: 'Bosnia/Herzeg.', date: new Date('2026-06-12T21:00:00Z'), stadium: 'Toronto', group: 'B' },
  { home: 'EE.UU.', away: 'Paraguay', date: new Date('2026-06-13T03:00:00Z'), stadium: 'Los Angeles', group: 'D' },
  { home: 'Qatar', away: 'Suiza', date: new Date('2026-06-13T21:00:00Z'), stadium: 'San Francisco Bay Area', group: 'B' },
  { home: 'Brasil', away: 'Marruecos', date: new Date('2026-06-14T00:00:00Z'), stadium: 'New York/New Jersey', group: 'C' },
  { home: 'Haiti', away: 'Escocia', date: new Date('2026-06-14T03:00:00Z'), stadium: 'Boston', group: 'C' },
  { home: 'Australia', away: 'Turquía', date: new Date('2026-06-14T06:00:00Z'), stadium: 'Vancouver', group: 'D' },
  { home: 'Alemania', away: 'Curazao', date: new Date('2026-06-14T19:00:00Z'), stadium: 'Houston', group: 'E' },
  { home: 'Países Bajos', away: 'Japón', date: new Date('2026-06-14T22:00:00Z'), stadium: 'Dallas', group: 'F' },
  { home: 'Costa de Marfil', away: 'Ecuador', date: new Date('2026-06-15T01:00:00Z'), stadium: 'Philadelphia', group: 'E' },
  { home: 'Suecia', away: 'Túnez', date: new Date('2026-06-15T04:00:00Z'), stadium: 'Monterrey', group: 'F' },
  { home: 'España', away: 'Cabo Verde', date: new Date('2026-06-15T18:00:00Z'), stadium: 'Atlanta', group: 'H' },
  { home: 'Bélgica', away: 'Egipto', date: new Date('2026-06-15T21:00:00Z'), stadium: 'Seattle', group: 'G' },
  { home: 'Arabia Saudita', away: 'Uruguay', date: new Date('2026-06-16T00:00:00Z'), stadium: 'Miami', group: 'H' },
  { home: 'IR Irán', away: 'Nueva Zelanda', date: new Date('2026-06-16T03:00:00Z'), stadium: 'Los Angeles', group: 'G' },
  { home: 'Francia', away: 'Senegal', date: new Date('2026-06-16T21:00:00Z'), stadium: 'New York/New Jersey', group: 'I' },
  { home: 'Iraq', away: 'Noruega', date: new Date('2026-06-17T00:00:00Z'), stadium: 'Boston', group: 'I' },
  { home: 'Argentina', away: 'Argelia', date: new Date('2026-06-17T03:00:00Z'), stadium: 'Kansas City', group: 'J' },
  { home: 'Austria', away: 'Jordán', date: new Date('2026-06-17T06:00:00Z'), stadium: 'San Francisco Bay Area', group: 'J' },
  { home: 'Portugal', away: 'RD Congo', date: new Date('2026-06-17T19:00:00Z'), stadium: 'Houston', group: 'K' },
  { home: 'Inglaterra', away: 'Croacia', date: new Date('2026-06-17T22:00:00Z'), stadium: 'Dallas', group: 'L' },
  { home: 'Ghana', away: 'Panamá', date: new Date('2026-06-18T01:00:00Z'), stadium: 'Toronto', group: 'L' },
  { home: 'Uzbekistán', away: 'Colombia', date: new Date('2026-06-18T04:00:00Z'), stadium: 'Mexico City', group: 'K' },
  { home: 'Checa', away: 'Sudáfrica', date: new Date('2026-06-18T18:00:00Z'), stadium: 'Atlanta', group: 'A' },
  { home: 'Suiza', away: 'Bosnia/Herzeg.', date: new Date('2026-06-18T21:00:00Z'), stadium: 'Los Angeles', group: 'B' },
  { home: 'Canadá', away: 'Qatar', date: new Date('2026-06-19T00:00:00Z'), stadium: 'Vancouver', group: 'B' },
  { home: 'México', away: 'Rep. de Corea', date: new Date('2026-06-19T03:00:00Z'), stadium: 'Guadalajara', group: 'A' },
  { home: 'EE.UU.', away: 'Australia', date: new Date('2026-06-19T21:00:00Z'), stadium: 'Seattle', group: 'D' },
  { home: 'Escocia', away: 'Marruecos', date: new Date('2026-06-20T00:00:00Z'), stadium: 'Boston', group: 'C' },
  { home: 'Brasil', away: 'Haiti', date: new Date('2026-06-20T03:00:00Z'), stadium: 'Philadelphia', group: 'C' },
  { home: 'Turquía', away: 'Paraguay', date: new Date('2026-06-20T06:00:00Z'), stadium: 'San Francisco Bay Area', group: 'D' },
  { home: 'Países Bajos', away: 'Suecia', date: new Date('2026-06-20T19:00:00Z'), stadium: 'Houston', group: 'F' },
  { home: 'Alemania', away: 'Costa de Marfil', date: new Date('2026-06-20T22:00:00Z'), stadium: 'Toronto', group: 'E' },
  { home: 'Ecuador', away: 'Curazao', date: new Date('2026-06-21T02:00:00Z'), stadium: 'Kansas City', group: 'E' },
  { home: 'Túnez', away: 'Japón', date: new Date('2026-06-21T06:00:00Z'), stadium: 'Monterrey', group: 'F' },
  { home: 'España', away: 'Arabia Saudita', date: new Date('2026-06-21T18:00:00Z'), stadium: 'Atlanta', group: 'H' },
  { home: 'Bélgica', away: 'IR Irán', date: new Date('2026-06-21T21:00:00Z'), stadium: 'Los Angeles', group: 'G' },
  { home: 'Uruguay', away: 'Cabo Verde', date: new Date('2026-06-22T00:00:00Z'), stadium: 'Miami', group: 'H' },
  { home: 'Nueva Zelanda', away: 'Egipto', date: new Date('2026-06-22T03:00:00Z'), stadium: 'Vancouver', group: 'G' },
  { home: 'Argentina', away: 'Austria', date: new Date('2026-06-22T19:00:00Z'), stadium: 'Dallas', group: 'J' },
  { home: 'Francia', away: 'Iraq', date: new Date('2026-06-22T23:00:00Z'), stadium: 'Philadelphia', group: 'I' },
  { home: 'Noruega', away: 'Senegal', date: new Date('2026-06-23T02:00:00Z'), stadium: 'New York/New Jersey', group: 'I' },
  { home: 'Jordán', away: 'Argelia', date: new Date('2026-06-23T05:00:00Z'), stadium: 'San Francisco Bay Area', group: 'J' },
  { home: 'Portugal', away: 'Uzbekistán', date: new Date('2026-06-23T19:00:00Z'), stadium: 'Houston', group: 'K' },
  { home: 'Inglaterra', away: 'Ghana', date: new Date('2026-06-23T22:00:00Z'), stadium: 'Boston', group: 'L' },
  { home: 'Panamá', away: 'Croacia', date: new Date('2026-06-24T01:00:00Z'), stadium: 'Toronto', group: 'L' },
  { home: 'Colombia', away: 'RD Congo', date: new Date('2026-06-24T04:00:00Z'), stadium: 'Guadalajara', group: 'K' },
  { home: 'Suiza', away: 'Canadá', date: new Date('2026-06-24T21:00:00Z'), stadium: 'Vancouver', group: 'B' },
  { home: 'Bosnia/Herzeg.', away: 'Qatar', date: new Date('2026-06-24T21:00:00Z'), stadium: 'Seattle', group: 'B' },
  { home: 'Escocia', away: 'Brasil', date: new Date('2026-06-25T00:00:00Z'), stadium: 'Miami', group: 'C' },
  { home: 'Marruecos', away: 'Haiti', date: new Date('2026-06-25T00:00:00Z'), stadium: 'Atlanta', group: 'C' },
  { home: 'Checa', away: 'México', date: new Date('2026-06-25T03:00:00Z'), stadium: 'Mexico City', group: 'A' },
  { home: 'Sudáfrica', away: 'Rep. de Corea', date: new Date('2026-06-25T03:00:00Z'), stadium: 'Monterrey', group: 'A' },
  { home: 'Curazao', away: 'Costa de Marfil', date: new Date('2026-06-25T22:00:00Z'), stadium: 'Philadelphia', group: 'E' },
  { home: 'Ecuador', away: 'Alemania', date: new Date('2026-06-25T22:00:00Z'), stadium: 'New York/New Jersey', group: 'E' },
  { home: 'Japón', away: 'Suecia', date: new Date('2026-06-26T01:00:00Z'), stadium: 'Dallas', group: 'F' },
  { home: 'Túnez', away: 'Países Bajos', date: new Date('2026-06-26T01:00:00Z'), stadium: 'Kansas City', group: 'F' },
  { home: 'Turquía', away: 'EE.UU.', date: new Date('2026-06-26T04:00:00Z'), stadium: 'Los Angeles', group: 'D' },
  { home: 'Paraguay', away: 'Australia', date: new Date('2026-06-26T04:00:00Z'), stadium: 'San Francisco Bay Area', group: 'D' },
  { home: 'Noruega', away: 'Francia', date: new Date('2026-06-26T21:00:00Z'), stadium: 'Boston', group: 'I' },
  { home: 'Senegal', away: 'Iraq', date: new Date('2026-06-26T21:00:00Z'), stadium: 'Toronto', group: 'I' },
  { home: 'Cabo Verde', away: 'Arabia Saudita', date: new Date('2026-06-27T02:00:00Z'), stadium: 'Houston', group: 'H' },
  { home: 'Uruguay', away: 'España', date: new Date('2026-06-27T02:00:00Z'), stadium: 'Guadalajara', group: 'H' },
  { home: 'Egipto', away: 'IR Irán', date: new Date('2026-06-27T05:00:00Z'), stadium: 'Seattle', group: 'G' },
  { home: 'Nueva Zelanda', away: 'Bélgica', date: new Date('2026-06-27T05:00:00Z'), stadium: 'Vancouver', group: 'G' },
  { home: 'Panamá', away: 'Inglaterra', date: new Date('2026-06-27T23:00:00Z'), stadium: 'New York/New Jersey', group: 'L' },
  { home: 'Croacia', away: 'Ghana', date: new Date('2026-06-27T23:00:00Z'), stadium: 'Philadelphia', group: 'L' },
  { home: 'Colombia', away: 'Portugal', date: new Date('2026-06-28T01:30:00Z'), stadium: 'Miami', group: 'K' },
  { home: 'RD Congo', away: 'Uzbekistán', date: new Date('2026-06-28T01:30:00Z'), stadium: 'Atlanta', group: 'K' },
  { home: 'Argelia', away: 'Austria', date: new Date('2026-06-28T04:00:00Z'), stadium: 'Kansas City', group: 'J' },
  { home: 'Jordán', away: 'Argentina', date: new Date('2026-06-28T04:00:00Z'), stadium: 'Dallas', group: 'J' },
];

async function main() {
  console.log('🌱 Starting seed...');
  console.log('🗑️  Skipped clearing existing data manually (using reset instead)');

  const adminHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      fullName: 'Administrador',
      username: 'admin',
      email: 'admin@polla.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log('👤 Admin verified: ' + admin.username);

  const userHash = await bcrypt.hash('User123!', 12);
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      fullName: 'Usuario Test',
      username: 'testuser',
      email: 'test@polla.com',
      passwordHash: userHash,
      role: 'USER',
    },
  });

  const createdTeams: Record<string, string> = {};
  for (const team of TEAMS) {
    const created = await prisma.team.upsert({
      where: { countryCode: team.countryCode },
      update: { group: team.group, name: team.name },
      create: {
        name: team.name,
        countryCode: team.countryCode,
        group: team.group,
        flagUrl: 'https://flagcdn.com/w80/' + team.countryCode.toLowerCase() + '.png',
      },
    });
    createdTeams[team.name] = created.id;
  }
  console.log('🏴 Inserted/Verified ' + TEAMS.length + ' teams');

  for (const match of FIXTURES) {
    const homeId = createdTeams[match.home];
    const awayId = createdTeams[match.away];
    if(!homeId || !awayId) continue;
    const existing = await prisma.match.findFirst({
      where: { homeTeamId: homeId, awayTeamId: awayId, phase: 'GROUP_STAGE' }
    });

    if (!existing) {
      await prisma.match.create({
        data: {
          homeTeamId: homeId,
          awayTeamId: awayId,
          phase: 'GROUP_STAGE',
          group: match.group,
          matchDate: match.date,
          stadium: match.stadium,
          status: 'SCHEDULED',
        },
      });
    }
  }

  console.log('⚽ Inserted ' + FIXTURES.length + ' group stage matches');
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
