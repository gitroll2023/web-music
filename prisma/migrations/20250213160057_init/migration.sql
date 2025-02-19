-- CreateTable
CREATE TABLE "chapters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order_num" INTEGER,
    "image_id" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" SERIAL NOT NULL,
    "chapter_id" INTEGER,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "drive_file_id" TEXT,
    "file_url" TEXT,
    "duration" INTEGER,
    "image_id" TEXT,
    "image_url" TEXT,
    "lyrics" TEXT,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "genre_id" TEXT,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "timestamps" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chapters_name_idx" ON "chapters"("name");

-- CreateIndex
CREATE INDEX "genres_name_idx" ON "genres"("name");

-- CreateIndex
CREATE INDEX "songs_chapter_id_idx" ON "songs"("chapter_id");

-- CreateIndex
CREATE INDEX "songs_genre_id_idx" ON "songs"("genre_id");

-- CreateIndex
CREATE INDEX "songs_created_at_idx" ON "songs"("created_at");

-- CreateIndex
CREATE INDEX "songs_is_popular_idx" ON "songs"("is_popular");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
