require('dotenv').config()
require('./src/config/prisma')

const express = require('express')
const app = express()

app.use(express.json())

const favoritosRouter = require('./src/routes/favoritos')
const directoresRouter = require('./src/routes/directores')
const peliculasRouter = require('./src/routes/peliculas')
const auditoria = require('./src/middleware/auditoria')
const authRouter = require('./src/routes/auth')
const estadisticasRouter = require('./src/routes/estadisticas')

app.use('/api/auth', authRouter)
app.use('/api/directores', directoresRouter)
app.use('/api/peliculas', auditoria, peliculasRouter)
app.use('/api/estadisticas', estadisticasRouter)
app.use('/api/favoritos', favoritosRouter)

app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status).json({ error: err.message })
})

app.use((req, res) => {
  res.status(404).json({ error: `${req.method} ${req.url} no encontrada` })
})

const PORT = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`)
  })
}

module.exports = app
