const { Router } = require('express')
const router = Router()
const verificarToken = require('../middleware/verificarToken')

// GET /api/estadisticas
router.get('/', verificarToken, async (req, res, next) => {
  try {
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

module.exports = router
