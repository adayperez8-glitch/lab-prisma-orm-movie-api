![logo_ironhack_blue 7](https://user-images.githubusercontent.com/23629340/40541063-a07a0a8a-601a-11e8-91b5-2f13e4e6b441.png)

# Lab | PostgreSQL Avanzado — Consultas Complejas sobre la API de Películas

## Objetivo

Explorar las capacidades avanzadas de PostgreSQL mediante consultas complejas sobre la base de datos de películas: JOINs múltiples, CTEs, funciones de ventana, índices y triggers. Al terminar sabrás escribir consultas analíticas reales y optimizarlas.

## Requisitos previos

- Haber completado el Lab D4 de w6 (base de datos `peliculas_db` con las tablas `directores`, `generos`, `peliculas`, `resenas`)
- Haber completado el Lab D1 de w7 (tabla `usuarios`)
- Haber leído el material del D2 de w7
- psql disponible en terminal

## Lo que vas a construir

- Consultas analíticas con JOINs, GROUP BY y subqueries
- CTEs para consultas legibles y reutilizables
- Funciones de ventana (RANK, ROW_NUMBER, LAG)
- Índices para optimizar búsquedas frecuentes
- Triggers para auditoría automática
- Vistas para simplificar consultas complejas
- Nuevos endpoints en la API que aprovechen estas consultas

## Parte 1: Poblar la base de datos con datos de prueba

Antes de hacer consultas interesantes, necesitamos suficientes datos. Ejecuta este script en psql:

```sql
-- c peliculas_db

-- Insertar directores
INSERT INTO directores (nombre) VALUES
  ('Christopher Nolan'),
  ('Denis Villeneuve'),
  ('Greta Gerwig'),
  ('Jordan Peele'),
  ('Alfonso Cuarón')
ON CONFLICT DO NOTHING;

-- Insertar géneros
INSERT INTO generos (nombre, slug) VALUES
  ('Ciencia Ficción', 'ciencia-ficcion'),
  ('Drama', 'drama'),
  ('Terror', 'terror'),
  ('Animación', 'animacion'),
  ('Crimen', 'crimen')
ON CONFLICT (slug) DO NOTHING;

-- Insertar películas (referencia los IDs reales de tus directores/géneros)
INSERT INTO peliculas (titulo, anio, nota, director_id, genero_id)
SELECT p.titulo, p.anio, p.nota, d.id, g.id
FROM (VALUES
  ('Inception', 2010, 8.8, 'Christopher Nolan', 'ciencia-ficcion'),
  ('Interstellar', 2014, 8.6, 'Christopher Nolan', 'ciencia-ficcion'),
  ('Oppenheimer', 2023, 8.5, 'Christopher Nolan', 'drama'),
  ('Dune', 2021, 8.0, 'Denis Villeneuve', 'ciencia-ficcion'),
  ('Blade Runner 2049', 2017, 8.0, 'Denis Villeneuve', 'ciencia-ficcion'),
  ('Arrival', 2016, 7.9, 'Denis Villeneuve', 'ciencia-ficcion'),
  ('Barbie', 2023, 6.9, 'Greta Gerwig', 'drama'),
  ('Lady Bird', 2017, 7.4, 'Greta Gerwig', 'drama'),
  ('Get Out', 2017, 7.7, 'Jordan Peele', 'terror'),
  ('Us', 2019, 6.8, 'Jordan Peele', 'terror'),
  ('Roma', 2018, 7.7, 'Alfonso Cuarón', 'drama'),
  ('Gravity', 2013, 7.7, 'Alfonso Cuarón', 'ciencia-ficcion')
) AS p(titulo, anio, nota, director, genero)
JOIN directores d ON d.nombre = p.director
JOIN generos g ON g.slug = p.genero
ON CONFLICT DO NOTHING;

-- Insertar reseñas
INSERT INTO resenas (pelicula_id, autor, texto, puntuacion)
SELECT p.id, r.autor, r.texto, r.puntuacion
FROM (VALUES
  ('Inception', 'María', 'Obra maestra del cine moderno', 9),
  ('Inception', 'Carlos', 'Confusa pero brillante', 8),
  ('Inception', 'Ana', 'La vi tres veces y cada vez entiendo más', 10),
  ('Dune', 'Luis', 'Visualmente impresionante', 9),
  ('Dune', 'Sara', 'Fiel al libro', 8),
  ('Oppenheimer', 'Pedro', 'Tres horas que pasan volando', 9),
  ('Barbie', 'Elena', 'Más profunda de lo que parece', 8),
  ('Barbie', 'Tomás', 'No era para mí', 5),
  ('Get Out', 'Julia', 'Perturbadora y necesaria', 9),
  ('Roma', 'Miguel', 'Poesía visual pura', 10)
) AS r(titulo, autor, texto, puntuacion)
JOIN peliculas p ON p.titulo = r.titulo;
```

Verifica que tienes datos:
```sql
SELECT COUNT(*) FROM peliculas;
SELECT COUNT(*) FROM resenas;
```

## Parte 2: Consultas con JOIN

### Paso 1: JOIN básico — películas con su director y género

```sql
-- Películas con información completa
SELECT
  p.id,
  p.titulo,
  p.anio,
  p.nota,
  d.nombre AS director,
  g.nombre AS genero
FROM peliculas p
LEFT JOIN directores d ON d.id = p.director_id
LEFT JOIN generos g ON g.id = p.genero_id
ORDER BY p.anio DESC;
```

**Pregunta**: ¿Por qué usamos `LEFT JOIN` en lugar de `INNER JOIN`? ¿Qué filas se perderían con `INNER JOIN`?

### Paso 2: Películas con número de reseñas y puntuación media

```sql
SELECT
  p.titulo,
  p.nota AS nota_editorial,
  COUNT(r.id) AS total_resenas,
  ROUND(AVG(r.puntuacion), 2) AS media_usuarios,
  ROUND(AVG(r.puntuacion) - p.nota, 2) AS diferencia
FROM peliculas p
LEFT JOIN resenas r ON r.pelicula_id = p.id
GROUP BY p.id, p.titulo, p.nota
ORDER BY total_resenas DESC;
```

### Paso 3: Directores con estadísticas

```sql
SELECT
  d.nombre AS director,
  COUNT(p.id) AS peliculas,
  ROUND(AVG(p.nota), 2) AS nota_media,
  MAX(p.nota) AS nota_maxima,
  MIN(p.nota) AS nota_minima
FROM directores d
JOIN peliculas p ON p.director_id = d.id
GROUP BY d.id, d.nombre
HAVING COUNT(p.id) >= 2
ORDER BY nota_media DESC;
```

## Parte 3: CTEs (Common Table Expressions)

### Paso 4: CTE simple — top directores

```sql
WITH estadisticas_directores AS (
  SELECT
    d.nombre AS director,
    COUNT(p.id) AS num_peliculas,
    ROUND(AVG(p.nota), 2) AS nota_media
  FROM directores d
  JOIN peliculas p ON p.director_id = d.id
  GROUP BY d.id, d.nombre
)
SELECT *
FROM estadisticas_directores
WHERE num_peliculas >= 2
ORDER BY nota_media DESC;
```

### Paso 5: CTEs encadenadas — películas mejor valoradas por los usuarios vs. la crítica

```sql
WITH medias_usuarios AS (
  SELECT
    pelicula_id,
    ROUND(AVG(puntuacion), 2) AS media_usuarios,
    COUNT(*) AS num_resenas
  FROM resenas
  GROUP BY pelicula_id
),
comparacion AS (
  SELECT
    p.titulo,
    p.nota AS nota_editorial,
    mu.media_usuarios,
    mu.num_resenas,
    ROUND(mu.media_usuarios - p.nota, 2) AS diferencia
  FROM peliculas p
  JOIN medias_usuarios mu ON mu.pelicula_id = p.id
)
SELECT *
FROM comparacion
ORDER BY diferencia DESC;
```

**Pregunta**: ¿Qué películas tienen usuarios más entusiastas que la crítica? ¿Y al revés?

## Parte 4: Funciones de ventana

### Paso 6: RANK — ranking de películas por género

```sql
SELECT
  p.titulo,
  g.nombre AS genero,
  p.nota,
  RANK() OVER (
    PARTITION BY g.nombre
    ORDER BY p.nota DESC
  ) AS posicion_en_genero
FROM peliculas p
JOIN generos g ON g.id = p.genero_id
ORDER BY g.nombre, posicion_en_genero;
```

### Paso 7: ROW_NUMBER y LAG — evolución de nota por director

```sql
SELECT
  d.nombre AS director,
  p.titulo,
  p.anio,
  p.nota,
  ROW_NUMBER() OVER (
    PARTITION BY d.nombre
    ORDER BY p.anio
  ) AS num_pelicula,
  LAG(p.nota) OVER (
    PARTITION BY d.nombre
    ORDER BY p.anio
  ) AS nota_pelicula_anterior,
  ROUND(
    p.nota - LAG(p.nota) OVER (
      PARTITION BY d.nombre
      ORDER BY p.anio
    ), 2
  ) AS diferencia_con_anterior
FROM directores d
JOIN peliculas p ON p.director_id = d.id
ORDER BY d.nombre, p.anio;
```

**Pregunta**: ¿Qué directores tienen una trayectoria ascendente (cada película mejor que la anterior)?

### Paso 8: NTILE — cuartiles de películas por nota

```sql
SELECT
  titulo,
  nota,
  NTILE(4) OVER (ORDER BY nota DESC) AS cuartil,
  CASE NTILE(4) OVER (ORDER BY nota DESC)
    WHEN 1 THEN 'Excelente'
    WHEN 2 THEN 'Buena'
    WHEN 3 THEN 'Regular'
    WHEN 4 THEN 'Mala'
  END AS categoria
FROM peliculas
WHERE nota IS NOT NULL
ORDER BY nota DESC;
```

## Parte 5: Índices

### Paso 9: Crear índices para consultas frecuentes

```sql
-- Índice para buscar películas por año (búsqueda frecuente)
CREATE INDEX idx_peliculas_anio ON peliculas(anio);

-- Índice para buscar por género (filtros frecuentes)
CREATE INDEX idx_peliculas_genero ON peliculas(genero_id);

-- Índice compuesto para ordenar por nota dentro de un género
CREATE INDEX idx_peliculas_genero_nota ON peliculas(genero_id, nota DESC);

-- Índice en resenas para lookups por pelicula_id (muy frecuente en JOINs)
CREATE INDEX idx_resenas_pelicula ON resenas(pelicula_id);
```

Verifica el uso de un índice con EXPLAIN:

```sql
-- Sin índice (observa el plan)
EXPLAIN ANALYZE SELECT * FROM peliculas WHERE anio > 2015;

-- El planificador debería usar idx_peliculas_anio para tablas grandes
-- Con pocos datos puede que no lo use — eso es normal
```

## Parte 6: Triggers

### Paso 10: Tabla de auditoría y trigger

Crea una tabla de log para registrar cambios automáticamente:

```sql
CREATE TABLE auditoria_peliculas (
  id          SERIAL PRIMARY KEY,
  pelicula_id INTEGER,
  operacion   VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
  datos_antes JSONB,
  datos_despues JSONB,
  usuario_db  VARCHAR(100) DEFAULT current_user,
  fecha       TIMESTAMPTZ DEFAULT NOW()
);
```

Crea la función del trigger:

```sql
CREATE OR REPLACE FUNCTION registrar_cambio_pelicula()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria_peliculas (pelicula_id, operacion, datos_despues)
    VALUES (NEW.id, 'INSERT', row_to_json(NEW));

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria_peliculas (pelicula_id, operacion, datos_antes, datos_despues)
    VALUES (NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria_peliculas (pelicula_id, operacion, datos_antes)
    VALUES (OLD.id, 'DELETE', row_to_json(OLD));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Asocia el trigger a la tabla:

```sql
CREATE TRIGGER trigger_auditoria_peliculas
AFTER INSERT OR UPDATE OR DELETE ON peliculas
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_pelicula();
```

Prueba el trigger:

```sql
-- Insertar una película (debería aparecer en auditoría)
INSERT INTO peliculas (titulo, anio) VALUES ('Test Trigger', 2024);

-- Actualizar
UPDATE peliculas SET nota = 7.5 WHERE titulo = 'Test Trigger';

-- Eliminar
DELETE FROM peliculas WHERE titulo = 'Test Trigger';

-- Verificar el log
SELECT operacion, datos_antes->>'titulo', datos_despues->>'nota', fecha
FROM auditoria_peliculas
ORDER BY fecha DESC
LIMIT 5;
```

## Parte 7: Vistas y nuevos endpoints

### Paso 11: Crear una vista

```sql
CREATE OR REPLACE VIEW v_peliculas_completas AS
SELECT
  p.id,
  p.titulo,
  p.anio,
  p.nota AS nota_editorial,
  d.nombre AS director,
  g.nombre AS genero,
  g.slug AS genero_slug,
  COUNT(r.id) AS num_resenas,
  ROUND(AVG(r.puntuacion), 2) AS media_usuarios
FROM peliculas p
LEFT JOIN directores d ON d.id = p.director_id
LEFT JOIN generos g ON g.id = p.genero_id
LEFT JOIN resenas r ON r.pelicula_id = p.id
GROUP BY p.id, p.titulo, p.anio, p.nota, d.nombre, g.nombre, g.slug;
```

Ahora puedes hacer:

```sql
SELECT * FROM v_peliculas_completas WHERE genero_slug = 'ciencia-ficcion';
```

### Paso 12: Endpoint de estadísticas avanzadas

Añade a `src/controllers/peliculasController.js`:

```javascript
// GET /api/estadisticas/directores
const estadisticasDirectores = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        d.nombre AS director,
        COUNT(p.id) AS num_peliculas,
        ROUND(AVG(p.nota), 2) AS nota_media,
        MAX(p.nota) AS nota_maxima,
        MIN(p.nota) AS nota_minima
      FROM directores d
      JOIN peliculas p ON p.director_id = d.id
      GROUP BY d.id, d.nombre
      HAVING COUNT(p.id) >= 1
      ORDER BY nota_media DESC
    `)
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

// GET /api/estadisticas/generos
const estadisticasGeneros = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      WITH stats AS (
        SELECT
          g.nombre AS genero,
          COUNT(p.id) AS num_peliculas,
          ROUND(AVG(p.nota), 2) AS nota_media,
          COUNT(r.id) AS total_resenas
        FROM generos g
        LEFT JOIN peliculas p ON p.genero_id = g.id
        LEFT JOIN resenas r ON r.pelicula_id = p.id
        GROUP BY g.id, g.nombre
      )
      SELECT *, RANK() OVER (ORDER BY nota_media DESC NULLS LAST) AS ranking
      FROM stats
      ORDER BY ranking
    `)
    res.json(rows)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  // ... exports anteriores ...
  estadisticasDirectores,
  estadisticasGeneros
}
```

Añade las rutas en `src/routes/estadisticas.js` (o donde tengas las estadísticas):

```javascript
router.get('/directores', estadisticasDirectores)
router.get('/generos', estadisticasGeneros)
```

## Parte 8: Reflexión

Responde en `NOTAS.md`:

1. **¿Cuándo es contraproducente crear un índice?** (pista: piensa en tablas con muchas escrituras)
2. **¿Qué diferencia hay entre `RANK()` y `DENSE_RANK()`?** Pon un ejemplo con los datos de la base de datos.
3. **¿Por qué el trigger usa `AFTER INSERT OR UPDATE OR DELETE` en lugar de `BEFORE`?**

## Criterios de evaluación

- [ ] La base de datos tiene al menos 10 películas con directores y géneros relacionados
- [ ] La consulta de estadísticas por director devuelve media, máximo y mínimo correctos
- [ ] La CTE encadenada de comparación usuarios vs. crítica devuelve resultados coherentes
- [ ] La consulta con `RANK() OVER (PARTITION BY)` muestra el ranking correcto por género
- [ ] La consulta con `LAG()` muestra la nota de la película anterior del mismo director
- [ ] Los 4 índices están creados (`\d peliculas` en psql muestra los índices)
- [ ] El trigger registra correctamente INSERT, UPDATE y DELETE en `auditoria_peliculas`
- [ ] La vista `v_peliculas_completas` existe y devuelve resultados correctos
- [ ] `GET /api/estadisticas/directores` devuelve el JSON esperado
- [ ] `GET /api/estadisticas/generos` incluye el campo `ranking`

## Bonus

1. **Script de migración versionado**: Crea una carpeta `migrations/` con archivos `001_initial.sql`, `002_add_auditoria.sql`, `003_add_indexes.sql`. Cada script debe ser idempotente (ejecutable múltiples veces sin error). Añade una tabla `schema_migrations` que registre qué migraciones se han aplicado.
2. **Full-text search**: Usa `tsvector` y `tsquery` para implementar búsqueda de texto en títulos y nombres de directores. Añade un índice GIN y un endpoint `GET /api/peliculas?buscar=nolan`.
3. **Función SQL personalizada**: Crea una función PostgreSQL `peliculas_del_director(nombre_director TEXT)` que devuelva las películas de ese director con sus estadísticas de reseñas.