"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
// 48 teams for FIFA World Cup 2026 - 12 groups of 4
const TEAMS = [
    // Group A
    { name: 'Estados Unidos', countryCode: 'US', group: 'A' },
    { name: 'Gales', countryCode: 'WL', group: 'A' },
    { name: 'Escocia', countryCode: 'SC', group: 'A' },
    { name: 'Jamaica', countryCode: 'JM', group: 'A' },
    // Group B
    { name: 'México', countryCode: 'MX', group: 'B' },
    { name: 'Ecuador', countryCode: 'EC', group: 'B' },
    { name: 'Qatar', countryCode: 'QA', group: 'B' },
    { name: 'Japón', countryCode: 'JP', group: 'B' },
    // Group C
    { name: 'Canadá', countryCode: 'CA', group: 'C' },
    { name: 'Alemania', countryCode: 'DE', group: 'C' },
    { name: 'Costa Rica', countryCode: 'CR', group: 'C' },
    { name: 'Bahréin', countryCode: 'BH', group: 'C' },
    // Group D
    { name: 'Brasil', countryCode: 'BR', group: 'D' },
    { name: 'Nigeria', countryCode: 'NG', group: 'D' },
    { name: 'Suiza', countryCode: 'CH', group: 'D' },
    { name: 'Nueva Zelanda', countryCode: 'NZ', group: 'D' },
    // Group E
    { name: 'Argentina', countryCode: 'AR', group: 'E' },
    { name: 'Dinamarca', countryCode: 'DK', group: 'E' },
    { name: 'Túnez', countryCode: 'TN', group: 'E' },
    { name: 'Perú', countryCode: 'PE', group: 'E' },
    // Group F
    { name: 'Francia', countryCode: 'FR', group: 'F' },
    { name: 'Marruecos', countryCode: 'MA', group: 'F' },
    { name: 'Australia', countryCode: 'AU', group: 'F' },
    { name: 'Honduras', countryCode: 'HN', group: 'F' },
    // Group G
    { name: 'Inglaterra', countryCode: 'GB', group: 'G' },
    { name: 'Ghana', countryCode: 'GH', group: 'G' },
    { name: 'Serbia', countryCode: 'RS', group: 'G' },
    { name: 'Panamá', countryCode: 'PA', group: 'G' },
    // Group H
    { name: 'España', countryCode: 'ES', group: 'H' },
    { name: 'Camerún', countryCode: 'CM', group: 'H' },
    { name: 'Paraguay', countryCode: 'PY', group: 'H' },
    { name: 'Albania', countryCode: 'AL', group: 'H' },
    // Group I
    { name: 'Portugal', countryCode: 'PT', group: 'I' },
    { name: 'Senegal', countryCode: 'SN', group: 'I' },
    { name: 'Noruega', countryCode: 'NO', group: 'I' },
    { name: 'Arabia Saudita', countryCode: 'SA', group: 'I' },
    // Group J
    { name: 'Países Bajos', countryCode: 'NL', group: 'J' },
    { name: 'Egipto', countryCode: 'EG', group: 'J' },
    { name: 'Chile', countryCode: 'CL', group: 'J' },
    { name: 'China', countryCode: 'CN', group: 'J' },
    // Group K
    { name: 'Italia', countryCode: 'IT', group: 'K' },
    { name: 'Corea del Sur', countryCode: 'KR', group: 'K' },
    { name: 'Ucrania', countryCode: 'UA', group: 'K' },
    { name: 'Venezuela', countryCode: 'VE', group: 'K' },
    // Group L
    { name: 'Croacia', countryCode: 'HR', group: 'L' },
    { name: 'Irán', countryCode: 'IR', group: 'L' },
    { name: 'Colombia', countryCode: 'CO', group: 'L' },
    { name: 'R.D. del Congo', countryCode: 'CD', group: 'L' },
];
const STADIUMS = [
    'MetLife Stadium, New Jersey',
    'AT&T Stadium, Dallas',
    'SoFi Stadium, Los Angeles',
    'Hard Rock Stadium, Miami',
    'NRG Stadium, Houston',
    'Mercedes-Benz Stadium, Atlanta',
    'Lumen Field, Seattle',
    'Levi\'s Stadium, San Francisco',
    'Lincoln Financial Field, Philadelphia',
    'Arrowhead Stadium, Kansas City',
    'Estadio Azteca, Ciudad de México',
    'Estadio BBVA, Monterrey',
    'Estadio Akron, Guadalajara',
    'BC Place, Vancouver',
    'BMO Field, Toronto',
];
async function main() {
    console.log('🌱 Starting seed...');
    // Clear existing data
    /* await prisma.prediction.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.match.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany(); */
    console.log('🗑️  Cleared existing data');
    // Create admin user
    const adminHash = await bcrypt_1.default.hash('Admin123!', 12);
    const admin = await prisma.user.create({
        data: {
            fullName: 'Administrador',
            username: 'admin',
            email: 'admin@polla.com',
            passwordHash: adminHash,
            role: 'ADMIN',
        },
    });
    console.log(`👤 Admin created: ${admin.username} (admin@polla.com / Admin123!)`);
    // Create a test user
    const userHash = await bcrypt_1.default.hash('User123!', 12);
    const testUser = await prisma.user.create({
        data: {
            fullName: 'Usuario Test',
            username: 'testuser',
            email: 'test@polla.com',
            passwordHash: userHash,
            role: 'USER',
        },
    });
    console.log(`👤 Test user created: ${testUser.username} (test@polla.com / User123!)`);
    // Create teams
    const createdTeams = {};
    for (const team of TEAMS) {
        const created = await prisma.team.create({
            data: {
                name: team.name,
                countryCode: team.countryCode,
                group: team.group,
                flagUrl: `https://flagcdn.com/w80/${team.countryCode.toLowerCase()}.png`,
            },
        });
        createdTeams[`${team.group}-${team.countryCode}`] = created.id;
    }
    console.log(`🏴 Created ${TEAMS.length} teams in 12 groups`);
    // Generate group stage matches (round-robin within each group)
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    let matchCount = 0;
    const baseDate = new Date('2026-06-11T16:00:00Z'); // Tournament start
    for (const group of groups) {
        const groupTeams = TEAMS.filter(t => t.group === group);
        const matchPairs = [
            [0, 1], [2, 3], // Matchday 1
            [0, 2], [1, 3], // Matchday 2
            [0, 3], [1, 2], // Matchday 3
        ];
        for (let i = 0; i < matchPairs.length; i++) {
            const [homeIdx, awayIdx] = matchPairs[i];
            const homeTeam = groupTeams[homeIdx];
            const awayTeam = groupTeams[awayIdx];
            const homeId = createdTeams[`${group}-${homeTeam.countryCode}`];
            const awayId = createdTeams[`${group}-${awayTeam.countryCode}`];
            // Spread matches across days
            const matchDay = Math.floor(i / 2); // 0, 0, 1, 1, 2, 2
            const matchTime = i % 2; // 0, 1, 0, 1, 0, 1
            const groupOffset = groups.indexOf(group);
            const matchDate = new Date(baseDate);
            matchDate.setDate(matchDate.getDate() + matchDay * 4 + Math.floor(groupOffset / 3));
            matchDate.setHours(16 + matchTime * 3); // 16:00 or 19:00
            const stadiumIndex = (groupOffset * 3 + i) % STADIUMS.length;
            await prisma.match.create({
                data: {
                    homeTeamId: homeId,
                    awayTeamId: awayId,
                    phase: 'GROUP_STAGE',
                    group: group,
                    matchDate: matchDate,
                    stadium: STADIUMS[stadiumIndex],
                    status: 'SCHEDULED',
                },
            });
            matchCount++;
        }
    }
    console.log(`⚽ Created ${matchCount} group stage matches`);
    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📋 Login credentials:');
    console.log('   Admin: admin@polla.com / Admin123!');
    console.log('   User:  test@polla.com  / User123!');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map