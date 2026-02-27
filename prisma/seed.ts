import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 계시록 1-22장 챕터 데이터 (성경적으로 정확한 요약 포함)
const chapters = [
  {
    id: 1,
    name: '계시록 1장',
    description: '요한의 소개와 그리스도의 영광스러운 모습',
    orderIndex: 1,
  },
  {
    id: 2,
    name: '계시록 2장',
    description: '에베소, 서머나, 버가모, 두아디라 교회에 보내는 편지',
    orderIndex: 2,
  },
  {
    id: 3,
    name: '계시록 3장',
    description: '사데, 빌라델비아, 라오디게아 교회에 보내는 편지',
    orderIndex: 3,
  },
  {
    id: 4,
    name: '계시록 4장',
    description: '하늘 보좌의 광경',
    orderIndex: 4,
  },
  {
    id: 5,
    name: '계시록 5장',
    description: '일곱 인으로 봉한 두루마리와 어린 양',
    orderIndex: 5,
  },
  {
    id: 6,
    name: '계시록 6장',
    description: '여섯 인의 개봉',
    orderIndex: 6,
  },
  {
    id: 7,
    name: '계시록 7장',
    description: '144,000명의 인 맞은 자와 흰 옷 입은 무리',
    orderIndex: 7,
  },
  {
    id: 8,
    name: '계시록 8장',
    description: '일곱째 인과 처음 네 나팔',
    orderIndex: 8,
  },
  {
    id: 9,
    name: '계시록 9장',
    description: '다섯째와 여섯째 나팔',
    orderIndex: 9,
  },
  {
    id: 10,
    name: '계시록 10장',
    description: '작은 두루마리를 가진 천사',
    orderIndex: 10,
  },
  {
    id: 11,
    name: '계시록 11장',
    description: '두 증인과 일곱째 나팔',
    orderIndex: 11,
  },
  {
    id: 12,
    name: '계시록 12장',
    description: '여자와 용',
    orderIndex: 12,
  },
  {
    id: 13,
    name: '계시록 13장',
    description: '바다에서 올라온 짐승과 땅에서 올라온 짐승',
    orderIndex: 13,
  },
  {
    id: 14,
    name: '계시록 14장',
    description: '어린 양과 144,000명, 세 천사의 메시지',
    orderIndex: 14,
  },
  {
    id: 15,
    name: '계시록 15장',
    description: '일곱 대접의 재앙을 가진 천사들',
    orderIndex: 15,
  },
  {
    id: 16,
    name: '계시록 16장',
    description: '일곱 대접의 재앙',
    orderIndex: 16,
  },
  {
    id: 17,
    name: '계시록 17장',
    description: '큰 음녀 바벨론',
    orderIndex: 17,
  },
  {
    id: 18,
    name: '계시록 18장',
    description: '바벨론의 멸망',
    orderIndex: 18,
  },
  {
    id: 19,
    name: '계시록 19장',
    description: '어린 양의 혼인 잔치와 백마 탄 자',
    orderIndex: 19,
  },
  {
    id: 20,
    name: '계시록 20장',
    description: '천년왕국과 최후의 심판',
    orderIndex: 20,
  },
  {
    id: 21,
    name: '계시록 21장',
    description: '새 하늘과 새 땅, 새 예루살렘',
    orderIndex: 21,
  },
  {
    id: 22,
    name: '계시록 22장',
    description: '생명수의 강과 주님의 재림 약속',
    orderIndex: 22,
  },
];

async function main() {
  // 챕터 추가 (1-22장) - upsert로 멱등성 보장
  for (const chapter of chapters) {
    await prisma.chapter.upsert({
      where: { id: chapter.id },
      update: {
        name: chapter.name,
        description: chapter.description,
        orderIndex: chapter.orderIndex,
      },
      create: {
        id: chapter.id,
        name: chapter.name,
        description: chapter.description,
        orderIndex: chapter.orderIndex,
      },
    });
  }

  console.log('Seed completed: Added chapters 1-22 (계시록 1장 ~ 계시록 22장)');
  console.log(`Total chapters seeded: ${chapters.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
