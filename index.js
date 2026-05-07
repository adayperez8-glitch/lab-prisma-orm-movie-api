require('dotenv').config()
require('./src/config/prisma')

const express = require('express')
const app = express()

app.use(express.json())

const peliculaRoutes = require('./src/routes/peliculaRoutes')
const authRouter = require('./src/routes/auth')
const favoritosRouter = require('./src/routes/favoritos')

app.use('/api/auth', authRouter)
app.use('/api/peliculas', peliculaRoutes)
app.use('/api/favoritos', favoritosRouter)

app.get('/api/estadisticas', async (req, res, next) => {
  try {
    const prisma = require('./src/config/prisma')
    const [stats, porGenero] = await prisma.$transaction([
      prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS total,
          ROUND(AVG(nota)::numeric, 2) AS media_nota,
          MAX(nota) AS nota_maxima,
          MIN(nota) AS nota_minima
        FROM peliculas
        WHERE nota IS NOT NULL
      `,
      prisma.genero.findMany({
        select: {
          nombre: true,
          _count: { select: { peliculas: true } }
        },
        orderBy: { peliculas: { _count: 'desc' } }
      })
    ])

    res.json({
      total: stats[0].total,
      media_nota: stats[0].media_nota,
      nota_maxima: stats[0].nota_maxima,
      nota_minima: stats[0].nota_minima,
      porGenero: porGenero.map(g => ({
        genero: g.nombre,
        cantidad: g._count.peliculas
      }))
    })
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  res.status(status).json({ error: err.message })
})

const PORT = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`)
  })
}

module.exports = app
