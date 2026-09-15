import "dotenv/config";
import { PrismaClient, WordType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const words = [
  // Топик: Природа (10 слов)
  { kyrgyz: "суу", russian: "вода", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },
  { kyrgyz: "от", russian: "огонь", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },
  { kyrgyz: "жер", russian: "земля", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },
  { kyrgyz: "аба", russian: "воздух", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },
  { kyrgyz: "тоо", russian: "гора", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },
  { kyrgyz: "дарыя", russian: "река", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 2 },
  { kyrgyz: "көл", russian: "озеро", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },
  { kyrgyz: "токой", russian: "лес", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 2 },
  { kyrgyz: "таш", russian: "камень", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },
  { kyrgyz: "гүл", russian: "цветок", type: WordType.WORD, topic: "Природа", pos: "noun", difficulty: 1 },

  // Топик: Семья (10 слов)
  { kyrgyz: "апа", russian: "мама", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 1 },
  { kyrgyz: "ата", russian: "папа", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 1 },
  { kyrgyz: "эже", russian: "старшая сестра", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 1 },
  { kyrgyz: "байке", russian: "старший брат", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 1 },
  { kyrgyz: "бала", russian: "ребёнок", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 1 },
  { kyrgyz: "кыз", russian: "девочка / дочь", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 1 },
  { kyrgyz: "уул", russian: "мальчик / сын", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 1 },
  { kyrgyz: "чоң апа", russian: "бабушка", type: WordType.PHRASE, topic: "Семья", pos: "noun", difficulty: 2 },
  { kyrgyz: "чоң ата", russian: "дедушка", type: WordType.PHRASE, topic: "Семья", pos: "noun", difficulty: 2 },
  { kyrgyz: "үй-бүлө", russian: "семья", type: WordType.WORD, topic: "Семья", pos: "noun", difficulty: 2 },
];

async function main() {
  console.log("Seeding database...");

  for (const word of words) {
    await prisma.word.upsert({
      where: { kyrgyz: word.kyrgyz },
      update: {},
      create: word,
    });
  }

  console.log(`Seeded ${words.length} words.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
