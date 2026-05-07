const { Router } = require('express')
const router = Router()
const verificarToken = require('../middleware/verificarToken')
const verificarRol = require('../middleware/verificarRol')
const {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula,
  obtenerResenas,
  crearResena
} = require('../controllers/peliculaController')

// Rutas públicas
router.get('/', listarPeliculas)
router.get('/:id', obtenerPelicula)
router.get('/:id/resenas', obtenerResenas)

// Rutas protegidas: cualquier usuario autenticado
router.post('/', verificarToken, crearPelicula)
router.post('/:id/resenas', verificarToken, crearResena)

// Rutas protegidas: solo admin
router.put('/:id', verificarToken, verificarRol('admin'), actualizarPelicula)
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarPelicula)

module.exports = router
