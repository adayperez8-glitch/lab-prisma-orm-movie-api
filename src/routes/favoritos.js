const { Router } = require('express')
const router = Router()
const verificarToken = require('../middleware/verificarToken')
const { añadirFavorito, quitarFavorito, listarFavoritos } = require('../controllers/favoritosController')

router.use(verificarToken)

router.post('/', añadirFavorito)
router.delete('/', quitarFavorito)
router.get('/', listarFavoritos)

module.exports = router
