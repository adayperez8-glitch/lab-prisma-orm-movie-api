const AppError = require('../utils/AppError')

// Uso: verificarRol('admin') o verificarRol('admin', 'moderador')
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new AppError('No autenticado', 401))
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(new AppError(
        `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
        403
      ))
    }

    next()
  }
}

module.exports = verificarRol
