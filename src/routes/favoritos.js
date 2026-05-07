const { Router } = require('express')
const router = Router()
const verificarToken = require('../middleware/verificarToken')
const { añadirFavorito, quitarFavorito, listarFavoritos } = require('../controllers/favoritosController')

router.use(verificarToken)

router.post('/:peliculaId', añadirFavorito)
router.delete('/:peliculaId', quitarFavorito)
router.get('/', listarFavoritos)

module.exports = router
