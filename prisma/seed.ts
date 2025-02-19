const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const genres = [
  { id: 'k-pop', name: '케이팝' },
  { id: 'ballad', name: '발라드' },
  { id: 'rock', name: '락' },
  { id: 'hip-hop', name: '힙합' },
  { id: 'r-and-b', name: 'R&B' },
  { id: 'indie', name: '인디' },
  { id: 'ccm', name: 'CCM' },
  { id: 'gospel', name: '가스펠' },
  { id: 'praise', name: '찬양' },
  { id: 'hymn', name: '찬송가' }
];

async function main() {
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { id: genre.id },
      update: {},
      create: genre
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
