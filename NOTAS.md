--¿Cuándo es contraproducente crear un índice? (pista: piensa en tablas con muchas escrituras)
Es contraproducente cuando:

La tabla tiene muchas operaciones de INSERT, UPDATE o DELETE frecuentes
La tabla es muy pequeña (con pocos datos es más rápido leer todo directamente)
La columna tiene muy pocos valores distintos (por ejemplo, una columna activo que solo tiene true o false — el índice no ayuda mucho)


--¿Qué diferencia hay entre RANK() y DENSE_RANK()? Pon un ejemplo con los datos de la base de datos.

RANK() — salta números cuando hay empate.

DENSE_RANK() — no salta números.


--¿Por qué el trigger usa AFTER INSERT OR UPDATE OR DELETE en lugar de BEFORE?

Hay dos momentos en los que puede ejecutarse un trigger:
BEFORE — antes de que se ejecute la operación

Se usa cuando quieres modificar o cancelar la operación antes de que ocurra
Por ejemplo, validar datos antes de insertarlos

AFTER — después de que se ejecute la operación

Se usa cuando quieres registrar o reaccionar a algo que ya pasó
En nuestro caso, queremos guardar en el log lo que ya ocurrió — tiene sentido usar AFTER porque si usáramos BEFORE y la operación fallara, habríamos registrado algo que nunca pasó