-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(20) NOT NULL DEFAULT 'usuario',
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "nacionalidad" VARCHAR(50),
    "fecha_nac" DATE,

    CONSTRAINT "directores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,

    CONSTRAINT "generos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peliculas" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "anio" INTEGER NOT NULL,
    "nota" DECIMAL(3,1),
    "director_id" INTEGER,
    "genero_id" INTEGER,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peliculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "pelicula_id" INTEGER NOT NULL,
    "autor" VARCHAR(100) NOT NULL,
    "texto" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_peliculas" (
    "id" SERIAL NOT NULL,
    "pelicula_id" INTEGER,
    "operacion" VARCHAR(10) NOT NULL,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "usuario_db" VARCHAR(100) DEFAULT CURRENT_USER,
    "fecha" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_peliculas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "generos_nombre_key" ON "generos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "generos_slug_key" ON "generos"("slug");

-- CreateIndex
CREATE INDEX "idx_peliculas_director" ON "peliculas"("director_id");

-- CreateIndex
CREATE INDEX "idx_peliculas_genero" ON "peliculas"("genero_id");

-- CreateIndex
CREATE INDEX "idx_resenas_pelicula" ON "resenas"("pelicula_id");

-- AddForeignKey
ALTER TABLE "peliculas" ADD CONSTRAINT "peliculas_director_id_fkey" FOREIGN KEY ("director_id") REFERENCES "directores"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peliculas" ADD CONSTRAINT "peliculas_genero_id_fkey" FOREIGN KEY ("genero_id") REFERENCES "generos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_pelicula_id_fkey" FOREIGN KEY ("pelicula_id") REFERENCES "peliculas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
