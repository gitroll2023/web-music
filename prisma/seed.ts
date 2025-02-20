import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 챕터 2-22장 생성
const chapters = Array.from({ length: 21 }, (_, i) => ({
  id: i + 2, // 2부터 시작
  name: `계시록 ${i + 2}장`
}));

async function main() {
  // 챕터 추가 (2-22장)
  for (const chapter of chapters) {
    await prisma.chapter.upsert({
      where: { id: chapter.id },
      update: { name: chapter.name },
      create: chapter
    });
  }

  console.log('Seed completed: Added chapters 2-22');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
