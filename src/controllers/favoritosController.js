const prisma = require('../config/prisma')
const AppError = require('../utils/AppError')

const añadirFavorito = async (req, res, next) => {
  try {
    const peliculaId = Number(req.params.peliculaId)
    const usuarioId = req.usuario.id

    const pelicula = await prisma.pelicula.findUnique({ where: { id: peliculaId } })
    if (!pelicula) {
      throw new AppError('Película no encontrada', 404)
    }

    try {
      const favorito = await prisma.favorito.create({
        data: {
          usuarioId,
          peliculaId
        }
      })
      res.status(201).json({ ok: true, favorito })
    } catch (err) {
      if (err.code === 'P2002') {
        throw new AppError('Esta película ya está en tus favoritos', 409)
      }
      throw err
    }
  } catch (err) {
    next(err)
  }
}

const quitarFavorito = async (req, res, next) => {
  try {
    const peliculaId = Number(req.params.peliculaId)
    const usuarioId = req.usuario.id

    const result = await prisma.favorito.deleteMany({
      where: {
        usuarioId,
        peliculaId
      }
    })

    if (result.count === 0) {
      throw new AppError('Favorito no encontrado', 404)
    }

    res.json({ ok: true, mensaje: 'Eliminado de favoritos' })
  } catch (err) {
    next(err)
  }
}

const listarFavoritos = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id

    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId },
      include: {
        pelicula: {
          select: { id: true, titulo: true, anio: true, nota: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(favoritos.map(f => ({
      ...f.pelicula,
      añadido_en: f.createdAt
    })))
  } catch (err) {
    next(err)
  }
}

module.exports = { añadirFavorito, quitarFavorito, listarFavoritos }
