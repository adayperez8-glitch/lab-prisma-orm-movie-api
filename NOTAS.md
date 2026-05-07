
¿Cuándo es contraproducente crear un índice? (pista: piensa en tablas con muchas escrituras)

Crear un índice es contraproducente principalmente en tablas con un alto volumen de escrituras (INSERT, UPDATE, DELETE). Esto sucede porque cada vez que modifico un dato, la base de datos no solo tiene que escribir en la tabla, sino también actualizar todos los índices asociados, lo que penaliza el rendimiento.

También evito indexar columnas con baja cardinalidad (como un booleano de true/false), ya que el motor de búsqueda probablemente decida que es más rápido leer toda la tabla que consultar el índice. En resumen, si la tabla es muy pequeña o cambia constantemente, el índice estorba más de lo que ayuda.


¿Qué diferencia hay entre RANK() y DENSE_RANK()? Pon un ejemplo con los datos de la base de datos.

Ambas funciones me sirven para asignar un ranking, pero la diferencia está en cómo manejan los empates:

RANK(): Si hay dos elementos en la misma posición, el siguiente puesto se "salta". Por ejemplo, si hay un empate en el 2º lugar, el que sigue será el 4º.

DENSE_RANK(): No deja huecos. Si hay un empate en el 2º lugar, el que sigue será el 3º, de forma "densa".

¿Por qué el trigger usa AFTER INSERT OR UPDATE OR DELETE en lugar de BEFORE?

He decidido usar AFTER (ya sea INSERT, UPDATE o DELETE) porque en este flujo me interesa actuar una vez que la operación ya ha sido validada y confirmada en la base de datos.

Las razones principales son:

Integridad: Me aseguro de que el trigger solo se ejecute si la operación principal cumplió con todos los constraints (como llaves foráneas).

Acceso a datos generados: Si necesito el id autoincremental de un nuevo registro para guardarlo en otra tabla (como un log de auditoría), ese ID solo está disponible después del insert.

Lógica de reacción: Como la intención es reaccionar a un cambio y no modificar los datos que están entrando (que es para lo que usaría un BEFORE), el AFTER es el evento correcto para mantener la consistencia.