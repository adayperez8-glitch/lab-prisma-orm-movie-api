![logo_ironhack_blue 7](https://user-images.githubusercontent.com/23629340/40541063-a07a0a8a-601a-11e8-91b5-2f13e4e6b441.png)

# Lab | Prisma ORM — Migrar la API de Películas

## Objetivo

Migrar la API de películas de consultas SQL en crudo (`pg`) a **Prisma ORM**: definir el schema, generar migraciones, reemplazar las consultas del pool de pg por el Prisma Client, y usar transacciones gestionadas por Prisma.

## Requisitos previos

- Haber completado los labs anteriores de w7 (API con auth, PostgreSQL avanzado)
- Haber leído el material del D4 de w7
- PostgreSQL en marcha con la base de datos `peliculas_db`

## Lo que vas a construir

La misma API, pero con:
- Schema en `prisma/schema.prisma` con todos los modelos
- Migraciones con `prisma migrate dev`
- Consultas reescritas usando Prisma Client en lugar de `pool.query()`
- Transacciones con `prisma.$transaction`

## Paso 1: Instalar Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

Este comando crea:
- `prisma/schema.prisma` — el schema de tu base de datos
- `.env` actualizado con `DATABASE_URL`

Actualiza `DATABASE_URL` en `.env`:

```shell
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/peliculas_db?schema=public"
```

## Paso 2: Definir el schema

Reemplaza el contenido de `prisma/schema.prisma`:

```sql
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id           Int        @id @default(autoincrement())
  nombre       String     @db.VarChar(100)
  email        String     @unique @db.VarChar(150)
  passwordHash String     @map("password_hash") @db.VarChar(255)
  rol          Rol        @default(usuario)
  activo       Boolean    @default(true)
  createdAt    DateTime   @default(now()) @map("created_at")
  favoritos    Favorito[]

  @@map("usuarios")
}

enum Rol {
  usuario
  admin
}

model Director {
  id        Int        @id @default(autoincrement())
  nombre    String     @unique @db.VarChar(150)
  peliculas Pelicula[]

  @@map("directores")
}

model Genero {
  id        Int        @id @default(autoincrement())
  nombre    String     @db.VarChar(100)
  slug      String     @unique @db.VarChar(100)
  peliculas Pelicula[]

  @@map("generos")
}

model Pelicula {
  id         Int        @id @default(autoincrement())
  titulo     String     @db.VarChar(255)
  anio       Int?
  nota       Decimal?   @db.Decimal(3, 1)
  directorId Int?       @map("director_id")
  generoId   Int?       @map("genero_id")
  createdAt  DateTime   @default(now()) @map("created_at")

  director   Director?  @relation(fields: [directorId], references: [id])
  genero     Genero?    @relation(fields: [generoId], references: [id])
  resenas    Resena[]
  favoritos  Favorito[]

  @@map("peliculas")
}

model Resena {
  id         Int      @id @default(autoincrement())
  peliculaId Int      @map("pelicula_id")
  autor      String   @db.VarChar(100)
  texto      String
  puntuacion Int
  createdAt  DateTime @default(now()) @map("created_at")

  pelicula   Pelicula @relation(fields: [peliculaId], references: [id], onDelete: Cascade)

  @@map("resenas")
}

model Favorito {
  id         Int      @id @default(autoincrement())
  usuarioId  Int      @map("usuario_id")
  peliculaId Int      @map("pelicula_id")
  createdAt  DateTime @default(now()) @map("created_at")

  usuario    Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  pelicula   Pelicula @relation(fields: [peliculaId], references: [id], onDelete: Cascade)

  @@unique([usuarioId, peliculaId])
  @@map("favoritos")
}
```

## Paso 3: Generar la migración

```bash
npx prisma migrate dev --name init
```

Esto:
1. Crea `prisma/migrations/TIMESTAMP_init/migration.sql`
2. Aplica la migración a la base de datos
3. Genera el Prisma Client en `node_modules/@prisma/client`

Verifica en psql que las tablas existen:

```sql
\c peliculas_db
\dt
```

## Paso 4: Crear el cliente de Prisma

Crea `src/config/prisma.js`:

```javascript
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
})

module.exports = prisma
```

## Paso 5: Reescribir el controlador de películas con Prisma

Crea `src/controllers/peliculasPrismaController.js` (trabajaremos en paralelo con el antiguo hasta migrar todo):

```javascript
const prisma = require('../config/prisma')
const AppError = require('../utils/AppError')

// GET /api/peliculas
const listarPeliculas = async (req, res, next) => {
  try {
    const { genero, director, anio, page = 1, limit = 10 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (genero) where.genero = { slug: genero }
    if (director) where.director = { nombre: { contains: director, mode: 'insensitive' } }
    if (anio) where.anio = Number(anio)

    const [peliculas, total] = await prisma.$transaction([
      prisma.pelicula.findMany({
        where,
        include: {
          director: { select: { nombre: true } },
          genero: { select: { nombre: true, slug: true } },
          _count: { select: { resenas: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.pelicula.count({ where })
    ])

    res.json({
      data: peliculas,
      total,
      pagina: Number(page),
      totalPaginas: Math.ceil(total / Number(limit))
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/peliculas/:id
const obtenerPelicula = async (req, res, next) => {
  try {
    const pelicula = await prisma.pelicula.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        director: true,
        genero: true,
        resenas: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: { select: { resenas: true, favoritos: true } }
      }
    })

    if (!pelicula) {
      throw new AppError('Película no encontrada', 404)
    }

    res.json(pelicula)
  } catch (err) {
    next(err)
  }
}

// POST /api/peliculas
const crearPelicula = async (req, res, next) => {
  try {
    const { titulo, anio, nota, director, genero } = req.body

    if (!titulo || !anio) {
      throw new AppError('titulo y anio son obligatorios', 400)
    }

    // Buscar o crear director y género en una transacción
    const pelicula = await prisma.$transaction(async (tx) => {
      let directorId = null
      if (director) {
        const directorRecord = await tx.director.upsert({
          where: { nombre: director },
          update: {},
          create: { nombre: director }
        })
        directorId = directorRecord.id
      }

      let generoId = null
      if (genero) {
        const generoRecord = await tx.genero.findFirst({
          where: {
            OR: [
              { slug: genero.toLowerCase() },
              { nombre: { equals: genero, mode: 'insensitive' } }
            ]
          }
        })
        generoId = generoRecord?.id || null
      }

      return tx.pelicula.create({
        data: {
          titulo,
          anio: Number(anio),
          nota: nota ? Number(nota) : null,
          directorId,
          generoId
        },
        include: {
          director: true,
          genero: true
        }
      })
    })

    res.status(201).json(pelicula)
  } catch (err) {
    next(err)
  }
}

// PUT /api/peliculas/:id
const actualizarPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { titulo, anio, nota, directorId, generoId } = req.body

    const existe = await prisma.pelicula.findUnique({ where: { id } })
    if (!existe) {
      throw new AppError('Película no encontrada', 404)
    }

    const pelicula = await prisma.pelicula.update({
      where: { id },
      data: {
        titulo,
        anio: anio ? Number(anio) : undefined,
        nota: nota !== undefined ? (nota ? Number(nota) : null) : undefined,
        directorId: directorId ? Number(directorId) : undefined,
        generoId: generoId ? Number(generoId) : undefined
      },
      include: { director: true, genero: true }
    })

    res.json(pelicula)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/peliculas/:id
const eliminarPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id)

    const existe = await prisma.pelicula.findUnique({ where: { id } })
    if (!existe) {
      throw new AppError('Película no encontrada', 404)
    }

    await prisma.pelicula.delete({ where: { id } })

    res.json({ ok: true, mensaje: 'Película eliminada' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listarPeliculas, obtenerPelicula, crearPelicula, actualizarPelicula, eliminarPelicula }
```

## Paso 6: Reescribir el controlador de auth con Prisma

Modifica `src/controllers/authController.js` para reemplazar `pool.query` con Prisma:

```javascript
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const AppError = require('../utils/AppError')

const SALT_ROUNDS = 10

const generarToken = (usuario) =>
  jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )

const registro = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body

    if (!nombre || !email || !password) {
      throw new AppError('nombre, email y password son obligatorios', 400)
    }

    if (password.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres', 400)
    }

    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) {
      throw new AppError('Ya existe un usuario con ese email', 409)
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        rol: rol === 'admin' ? 'admin' : 'usuario'
      },
      select: { id: true, nombre: true, email: true, rol: true, createdAt: true }
    })

    res.status(201).json({ token: generarToken(usuario), usuario })
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new AppError('email y password son obligatorios', 400)
    }

    const usuario = await prisma.usuario.findFirst({
      where: { email, activo: true }
    })

    if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
      throw new AppError('Credenciales incorrectas', 401)
    }

    res.json({
      token: generarToken(usuario),
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { registro, login }
```

## Paso 7: Actualizar las rutas para usar el nuevo controlador

En `src/routes/peliculas.js`, reemplaza las importaciones:

```javascript
const {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula
} = require('../controllers/peliculasPrismaController')
```

## Paso 8: Añadir una segunda migración

La funcionalidad ha evolucionado: añade un campo `destacada` a las películas.

Modifica el schema en `prisma/schema.prisma`:

```prisma
model Pelicula {
  // ... campos existentes ...
  destacada  Boolean    @default(false)
  // ...
}
```

Genera la nueva migración:

```bash
npx prisma migrate dev --name add_destacada_to_peliculas
```

Verifica en psql:

```sql
\d peliculas
-- Debe mostrar la columna 'destacada'
```

## Paso 9: Prisma Studio

Explora la base de datos visualmente:

```bash
npx prisma studio
```

Abre `http://localhost:5555`. Aquí puedes:
- Ver y filtrar registros de cualquier tabla
- Crear y editar registros manualmente
- Explorar relaciones entre modelos

## Paso 10: Probar la API migrada

Prueba que todo funciona igual que antes:

```bash
# Listar películas con paginación
curl "http://localhost:3000/api/peliculas?page=1&limit=5"

# Filtrar por género
curl "http://localhost:3000/api/peliculas?genero=ciencia-ficcion"

# Crear película (con token de admin)
curl -X POST http://localhost:3000/api/peliculas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "titulo": "Everything Everywhere All at Once",
    "anio": 2022,
    "nota": 7.8,
    "director": "Daniel Kwan",
    "genero": "ciencia-ficcion"
  }'

# Obtener película con relaciones e includes
curl http://localhost:3000/api/peliculas/1
```

## Parte 2: Reflexión

Responde en `NOTAS.md`:

1. **¿Qué ventajas concretas ofrece Prisma frente a escribir SQL en crudo en este proyecto?** Da al menos dos ejemplos específicos.

2. **¿Qué hace `prisma.$transaction([query1, query2])`?** ¿En qué se diferencia de `prisma.$transaction(async (tx) => { ... })`?

3. **¿Qué archivo NO deberías commitear nunca al repositorio de tu schema de Prisma?** ¿Y cuáles sí deben estar en el repositorio?

## Criterios de evaluación

- [ ] `prisma/schema.prisma` define correctamente los 6 modelos con sus relaciones
- [ ] `npx prisma migrate dev` genera y aplica las migraciones sin errores
- [ ] `GET /api/peliculas` devuelve películas con director y género incluidos (no IDs)
- [ ] `GET /api/peliculas` soporta paginación con `?page=&limit=`
- [ ] `GET /api/peliculas/:id` incluye las últimas 5 reseñas y el conteo de favoritos
- [ ] `POST /api/peliculas` crea o reutiliza el director con `upsert` dentro de una transacción
- [ ] La segunda migración (campo `destacada`) se aplica correctamente
- [ ] `npx prisma studio` muestra todos los modelos con datos
- [ ] `POST /api/auth/registro` y `POST /api/auth/login` funcionan con el nuevo controlador Prisma

## Bonus

1. **Soft delete**: En lugar de eliminar películas de la base de datos, añade un campo `deletedAt DateTime?` al schema. Modifica la query de `listarPeliculas` para que no muestre las películas con `deletedAt != null`. Crea una migración para este cambio.
2. **Seed con Prisma**: Crea `prisma/seed.js` que pobla la base de datos con directores, géneros y películas de prueba. Configura el script en `package.json` con `"prisma": { "seed": "node prisma/seed.js" }` y ejecútalo con `npx prisma db seed`.
3. **Relaciones many-to-many**: Añade una tabla `pelicula_actores` many-to-many entre `Pelicula` y un nuevo modelo `Actor`. Genera la migración y actualiza el endpoint de detalle para incluir el reparto.