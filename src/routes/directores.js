const { Router } = require('express')
const router = Router()
const verificarToken = require('../middleware/verificarToken')
const verificarRol = require('../middleware/verificarRol')
const prisma = require('../config/prisma')

// GET /api/directores
router.get('/', verificarToken, async (req, res, next) => {
  try {
    const directores = await prisma.director.findMany({
      orderBy: { nombre: 'asc' }
    })
    res.json(directores)
  } catch (err) {
    next(err)
  }
})

// POST /api/directores (solo admin)
router.post('/', verificarToken, verificarRol('admin'), async (req, res, next) => {
  try {
    const { nombre, nacionalidad, fecha_nac } = req.body

    if (!nombre) {
      throw new AppError('nombre es obligatorio', 400)
    }

    const director = await prisma.director.create({
      data: { nombre, nacionalidad, fecha_nac: fecha_nac ? new Date(fecha_nac) : null }
    })

    res.status(201).json(director)
  } catch (err) {
    next(err)
  }
})

module.exports = router
