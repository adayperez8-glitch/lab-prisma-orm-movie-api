# Notas del Lab — Prisma ORM

## Parte 2 — Reflexión

### 1. ¿Qué ventajas concretas ofrece Prisma frente a escribir SQL en crudo en este proyecto? Da al menos dos ejemplos específicos.

. Ventajas de Prisma sobre SQL Nativo
Prisma actúa como un traductor inteligente que simplifica la interacción con la base de datos de dos formas clave:

Seguridad y legibilidad en los filtros: En lugar de pelear con la sintaxis de SQL y el manejo manual de variables (como los típicos $1, $2 que se vuelven un caos en consultas largas), Prisma usa objetos de JavaScript. Por ejemplo, para buscar películas por género, solo pasas un objeto { where: { genero: 'Acción' } }. Esto hace que el código sea mucho más fácil de leer y casi imposible de romper por un error de tipeo.

Relaciones sin dolor (Adiós a los JOINs manuales): En SQL, traer datos de tablas relacionadas requiere escribir sentencias JOIN complejas y luego "limpiar" el resultado. Con Prisma, usas la instrucción include. Si quieres una película con su director, simplemente pones include: { director: true } y Prisma se encarga de estructurar el JSON resultante de forma automática.

### 2. ¿Qué hace `prisma.$transaction([query1, query2])`? ¿En qué se diferencia de `prisma.$transaction(async (tx) => { ... })`?

Ambos métodos garantizan que todas las operaciones se completen con éxito o que ninguna se aplique (evitando datos corruptos), pero su flujo es diferente:

El Array [$query1, $query2]: Se usa para "paquetes" de tareas simples. Es como enviar una lista de mandados: le das todas las instrucciones a Prisma de un solo golpe. Se utiliza cuando las consultas son independientes entre sí y no necesitas el resultado de la primera para ejecutar la segunda.

El Callback async (tx) => { ... }: Se usa para procesos con lógica intermedia. Aquí puedes realizar pasos "interactivos". Por ejemplo: primero creas un usuario, recuperas su ID generado automáticamente, y usas ese ID para crear un perfil. Si el perfil falla, Prisma detecta el error y deshace también la creación del usuario.
### 3. ¿Qué archivo NO deberías commitear nunca al repositorio de tu schema de Prisma? ¿Y cuáles sí deben estar en el repositorio?

Para mantener el proyecto seguro y organizado, hay reglas estrictas sobre qué compartir:

PROHIBIDO commitear: El archivo .env. Este archivo es privado porque guarda la DATABASE_URL, la cual incluye el usuario y la contraseña real de tu base de datos. Si lo subes a GitHub, cualquiera podría entrar a borrar o robar tu información.

OBLIGATORIO commitear:

schema.prisma: Es el plano arquitectónico de tu base de datos; sin él, el proyecto no sabe cómo generar el cliente de Prisma.

La carpeta migrations/: Es el historial de cambios. Permite que cualquier otro desarrollador (o tú mismo en el futuro) pueda reconstruir la base de datos desde cero exactamente como la dejaste.
