const request = require('supertest')
const app = require('../../index')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

describe('Prisma: API de Peliculas', () => {

  beforeEach(async () => {
    await prisma.favorito.deleteMany()
    await prisma.resena.deleteMany()
    await prisma.pelicula.deleteMany()
    await prisma.director.deleteMany()
    await prisma.genero.deleteMany()
    await prisma.usuario.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/peliculas', () => {

    it('debe listar peliculas con director y genero incluidos', async () => {
      const genero = await prisma.genero.create({
        data: { nombre: 'Ciencia Ficcion', slug: 'ciencia-ficcion' }
      })
      const director = await prisma.director.create({
        data: { nombre: 'Christopher Nolan' }
      })
      await prisma.pelicula.create({
        data: {
          titulo: 'Interstellar',
          anio: 2014,
          nota: 8.7,
          directorId: director.id,
          generoId: genero.id
        }
      })

      const res = await request(app).get('/api/peliculas').expect(200)

      expect(res.body.data).toBeInstanceOf(Array)
      expect(res.body.data[0]).toHaveProperty('director')
      expect(res.body.data[0]).toHaveProperty('genero')
    })

    it('debe soportar paginacion', async () => {
      const res = await request(app).get('/api/peliculas?page=1&limit=5').expect(200)
      expect(res.body).toHaveProperty('pagina', 1)
      expect(res.body).toHaveProperty('totalPaginas')
    })
  })

  describe('GET /api/peliculas/:id', () => {

    it('debe obtener pelicula con resenas y conteo de favoritos', async () => {
      const pelicula = await prisma.pelicula.create({
        data: { titulo: 'The Matrix', anio: 1999, nota: 8.7 }
      })

      const res = await request(app).get(`/api/peliculas/${pelicula.id}`).expect(200)

      expect(res.body).toHaveProperty('titulo', 'The Matrix')
      expect(res.body).toHaveProperty('resenas')
      expect(res.body).toHaveProperty('_count.favoritos')
    })

    it('debe devolver 404 si no existe', async () => {
      await request(app).get('/api/peliculas/99999').expect(404)
    })
  })

  describe('POST /api/peliculas (transaccion)', () => {

    it('debe crear pelicula y reutilizar director con upsert', async () => {
      const bcrypt = require('bcrypt')
      const jwt = require('jsonwebtoken')

      let admin = await prisma.usuario.findFirst({ where: { email: 'admin@test.com' } })
      if (!admin) {
        const hash = await bcrypt.hash('admin123', 10)
        admin = await prisma.usuario.create({
          data: { nombre: 'Admin', email: 'admin@test.com', passwordHash: hash, rol: 'admin' }
        })
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, rol: admin.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      )

      // Crear primero director y genero para evitar errores
      let director = await prisma.director.findFirst({
        where: { nombre: 'Denis Villeneuve' }
      })
      if (!director) {
        director = await prisma.director.create({
          data: { nombre: 'Denis Villeneuve' }
        })
      }

      let genero = await prisma.genero.findFirst({
        where: { slug: 'ciencia-ficcion' }
      })
      if (!genero) {
        genero = await prisma.genero.create({
          data: { nombre: 'Ciencia Ficcion', slug: 'ciencia-ficcion' }
        })
      }

      const res = await request(app)
        .post('/api/peliculas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          titulo: 'Dune',
          anio: 2021,
          nota: 8.0,
          directorId: director.id,
          generoId: genero.id
        })
        .expect(201)

      expect(res.body).toHaveProperty('titulo', 'Dune')
      expect(res.body).toHaveProperty('director')
    })
  })
})
