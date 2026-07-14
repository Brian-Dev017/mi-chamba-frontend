# Diseño: registro, acceso e inicio del cliente

## Objetivo

Completar el flujo del cliente desde el registro hasta su pantalla principal. El cliente se identificará con DNI o Carnet de Extranjería, recibirá confirmaciones equivalentes a las del trabajador y, tras iniciar sesión, verá como contenido prioritario su publicación activa y las respuestas de trabajadores.

## Alcance

- Ocultar el indicador de pasos del registro cuando el teclado esté visible.
- Añadir tipo y número de documento al registro del cliente.
- Usar el documento como credencial de inicio de sesión para clientes y trabajadores.
- Confirmar las acciones de retroceso, cancelación y finalización del registro del cliente.
- Mostrar una pantalla de registro exitoso antes de volver al inicio de sesión.
- Incorporar una pantalla principal de cliente centrada en una publicación activa.
- Mantener el lenguaje visual, componentes y comportamiento responsive existentes.

No se implementarán en esta etapa un backend real, chat en tiempo real, pagos, geolocalización de trabajadores ni persistencia después de cerrar la aplicación.

## Flujo aprobado

1. El cliente completa información personal, ubicación y tipo de propiedad.
2. En información personal selecciona `DNI` o `Carnet de Extranjería` e ingresa el número correspondiente.
3. Al finalizar, confirma el registro y visualiza una pantalla de éxito.
4. Inicia sesión con su número de documento y contraseña.
5. El sistema reconoce el rol y dirige al cliente a su pantalla principal.
6. La pantalla principal prioriza una necesidad ya publicada, muestra trabajadores interesados y permite revisar sus respuestas.
7. `Nueva publicación` permanece disponible como acción secundaria.

## Registro y validación documental

El formulario del cliente reutilizará el selector documental y las reglas existentes del registro del trabajador:

- DNI: exactamente 8 dígitos.
- Carnet de Extranjería: exactamente 9 dígitos.
- Solo se admitirán caracteres numéricos.
- Al cambiar el tipo de documento se limpiará el número para evitar conservar un valor inválido.
- No se permitirá registrar dos cuentas con el mismo número de documento, independientemente del rol.

`RegisteredClient` almacenará `documentType` y `documentNumber`. El identificador en memoria dejará de depender del teléfono y se derivará del documento. El teléfono continuará como dato de contacto.

## Inicio de sesión y navegación por rol

El inicio de sesión buscará la combinación documento–contraseña en clientes y trabajadores registrados. Cuando las credenciales sean válidas, conservará el rol autenticado y dirigirá:

- al trabajador hacia `workerHome`;
- al cliente hacia `clientHome`.

El campo de documento admitirá hasta 9 dígitos para cubrir ambos tipos. Un documento inexistente o una contraseña incorrecta producirán el mismo mensaje de error para no presentar comportamientos diferentes entre roles.

## Confirmaciones del registro del cliente

El cliente tendrá el mismo patrón de seguridad de acciones del registro del trabajador:

- **Retroceder:** confirmación antes de regresar y perder los datos de la pantalla actual.
- **Cancelar o salir:** confirmación antes de abandonar el registro completo.
- **Finalizar:** confirmación antes de crear la cuenta.
- **Registro exitoso:** pantalla independiente con una acción para ir a iniciar sesión.

Las confirmaciones utilizarán los componentes existentes para conservar tono, iconografía y jerarquía visual.

## Comportamiento con el teclado

Las pantallas de formulario continuarán dentro del contenedor responsive y desplazable existente. Mientras el teclado esté abierto:

- el indicador inferior de pasos no se renderizará;
- los campos, errores y botones seguirán pudiendo desplazarse por encima del teclado;
- el borde superior del teclado seguirá siendo el límite inferior temporal del área visible.

Al cerrar el teclado, el indicador reaparecerá sin reiniciar el formulario ni alterar el paso actual.

## Pantalla principal del cliente

La variante aprobada es **Con una publicación activa**. La jerarquía será:

1. Encabezado oscuro con saludo, nombre, ubicación y notificaciones.
2. Acción secundaria `Nueva publicación`.
3. Sección principal `Tu publicación activa` con estado, antigüedad, título y ubicación.
4. Resumen de trabajadores interesados.
5. Acción principal `Ver respuestas`.
6. Actividad reciente con la respuesta más nueva de un trabajador.
7. Navegación inferior: `Inicio`, `Publicaciones` y `Perfil`.

La publicación activa será un dato local de demostración para esta etapa. La pantalla se estructurará de manera que posteriormente pueda recibir publicaciones y respuestas reales sin rehacer su composición visual.

## Componentes y límites

- `ClientHomeScreen`: compone el inicio y decide cómo presentar la publicación activa.
- `ActiveNeedCard`: presenta una necesidad y el resumen de interesados.
- `WorkerResponsePreview`: presenta la actividad más reciente.
- El prototipo raíz conserva el usuario autenticado y resuelve la navegación por rol.
- El servicio de registro mantiene las validaciones y crea el cliente en memoria.

Los componentes visuales no realizarán autenticación ni mutarán directamente las colecciones registradas. Recibirán datos y callbacks mediante propiedades.

## Estados y errores

- Documento incompleto o inválido: mensaje debajo del campo y bloqueo de avance.
- Documento duplicado: mensaje de registro existente y permanencia en el formulario.
- Error de credenciales: mensaje en la pantalla de acceso sin revelar qué dato falló.
- Registro cancelado: limpieza del borrador únicamente después de confirmar.
- Publicación sin respuestas: la tarjeta mostrará estado `Publicada` y un mensaje de espera, sin botón de contacto.
- Con respuestas: se habilitará `Ver respuestas`; el contacto se inicia desde la respuesta elegida.

## Verificación

- Validar DNI de 8 dígitos y Carnet de Extranjería de 9 dígitos.
- Confirmar que el documento se almacene en el cliente y sea su credencial de acceso.
- Probar credenciales válidas e inválidas de ambos roles y sus destinos.
- Verificar las confirmaciones de retroceso, cancelación y finalización.
- Confirmar la pantalla de registro exitoso.
- Abrir el teclado en cada paso y comprobar que el indicador desaparezca y el contenido continúe desplazándose.
- Revisar la pantalla principal en anchos compactos y amplios.
- Comprobar los estados de publicación activa con cero y con múltiples respuestas.
- Ejecutar `npm run typecheck`.
