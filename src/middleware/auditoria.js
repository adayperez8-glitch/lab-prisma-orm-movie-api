const prisma = require('../config/prisma')

const auditoria = async (req, res, next) => {
  const usuario = req.usuario?.email || 'anonimo'
  const operacion = req.method
  const peliculaId = req.params.id || null

  res.on('finish', async () => {
    try {
      await prisma.$executeRaw`
        INSERT INTO auditoria_peliculas (pelicula_id, operacion, datos_antes, datos_despues, usuario_db)
        VALUES (${peliculaId}, ${operacion}, NULL, NULL, ${usuario})
      `
    } catch (err) {
      console.error('Error en auditoría:', err.message)
    }
  })

  next()
}

module.exports = auditoria
