const { Router } = require('express')
const router = Router()
const verificarToken = require('../middleware/verificarToken')
const verificarRol = require('../middleware/verificarRol')
const { listarPeliculas, obtenerPelicula, crearPelicula, actualizarPelicula, eliminarPelicula } = require('../controllers/peliculaController')

// Rutas públicas
router.get('/', listarPeliculas)
router.get('/:id', obtenerPelicula)

// Rutas protegidas: cualquier usuario autenticado
router.post('/', verificarToken, crearPelicula)
router.post('/:id/resenas', verificarToken, require('../controllers/peliculaController').crearResena)

// Rutas protegidas: solo admin
router.put('/:id', verificarToken, verificarRol('admin'), actualizarPelicula)
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarPelicula)

// Favoritos integrados en peliculas
router.use('/:peliculaId/favoritos', verificarToken, require('./favoritos'))

module.exports = router
