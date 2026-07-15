# Publicaciones y mensajería compartida cliente-trabajador

## Objetivo

Extender el prototipo en memoria para que una necesidad publicada por un cliente se convierta en una solicitud visible para el trabajador, con imagen, categoría, precio, método de pago y una conversación compartida. También se mejorará la lista de solicitudes con paginación de tres tarjetas y se informará mediante una alerta cuando un trabajador inactivo intente aceptar un trabajo.

## Alcance

- Los datos continúan almacenados únicamente en memoria durante la ejecución de la aplicación.
- No se agrega backend, base de datos ni persistencia local.
- Se conserva el diseño visual y el sistema de accesibilidad existente.
- La publicación se comunica entre los perfiles de cliente y trabajador mediante el estado común de trabajos existente.

## Arquitectura

`MiChambaPrototypeContent` seguirá siendo la fuente de verdad de los trabajos mediante `workerRequests`. La pantalla del cliente dejará de mantener una publicación aislada en su estado local y leerá o creará trabajos dentro del mismo arreglo que consume el trabajador. Cada trabajo conservará su propio historial de mensajes, por lo que ambos perfiles verán y modificarán la misma conversación.

Cada cliente verá únicamente los trabajos cuyo `clientId` coincida con su cuenta autenticada. La sección Publicaciones admitirá varias necesidades del mismo cliente y las ordenará desde la más reciente. Los datos de demostración existentes podrán conservar un identificador de cliente independiente y seguirán visibles para el trabajador.

No se creará un contexto global adicional. Este enfoque mantiene el prototipo simple, evita duplicar publicaciones y permite que los cambios sean visibles al cambiar de perfil mientras la aplicación siga abierta.

## Modelo de datos

`WorkerJob` se ampliará con los siguientes datos:

- `clientId`: identifica al cliente que creó la publicación.
- `paymentMethod`: admite `Yape`, `Plin` o `Efectivo`.
- `referencePhotos`: conservará al menos una imagen para las publicaciones creadas por el cliente.
- `messages`: historial ordenado con remitente `client` o `worker`.

El precio se almacenará de forma compatible con el modelo actual y se mostrará con el formato `S/ 00.00`. El título y la descripción usarán el texto introducido por el cliente; la categoría será una selección obligatoria entre Cerrajero, Plomero, Pintor o Gasfitero.

## Creación de una publicación

El compositor del cliente solicitará:

1. Descripción de la necesidad.
2. Categoría del servicio.
3. Una imagen obligatoria seleccionada desde la galería con `expo-image-picker`.
4. Precio propuesto mayor que cero.
5. Un método de pago: Yape, Plin o efectivo.

El botón Publicar permanecerá deshabilitado mientras falte algún dato o el precio no sea válido. Si el permiso de galería es rechazado o la selección falla, se mostrará una explicación y la publicación no se creará. Al publicar, se construirá un `WorkerJob` con estado `NUEVO`, se agregará al estado compartido, se limpiará el formulario y se mostrará la publicación en la sección Publicaciones del cliente.

La tarjeta del cliente mostrará la imagen, categoría, precio y método de pago. La tarjeta del trabajador mostrará la imagen de referencia junto con el resumen existente, y el detalle conservará la galería de imágenes y mostrará el método de pago correcto.

## Paginación de solicitudes

La pantalla Mis solicitudes mostrará un máximo de tres tarjetas por página. La paginación se aplicará después del filtro activo:

- Todos: todos los trabajos nuevos.
- Cerca: trabajos con distancia de hasta 4 km.
- Mejor Precio: trabajos ordenados de mayor a menor precio.
- Electricidad: trabajos de esa categoría en los datos existentes.

Se mostrarán controles Anterior y Siguiente, el número de página actual y el total de páginas. Los controles se deshabilitarán en los límites. Al cambiar de filtro se volverá a la página 1. Si una solicitud se rechaza o acepta y la página actual queda fuera del nuevo rango, la página se ajustará automáticamente a la última disponible.

## Disponibilidad del trabajador

El botón Aceptar trabajo no se deshabilitará visualmente cuando el trabajador esté inactivo. Si intenta usarlo, se abrirá una alerta con el mensaje de que está inactivo y debe activar su disponibilidad desde el perfil. La alerta tendrá una única acción de confirmación para cerrarla. Solo un trabajador activo podrá cambiar el estado del trabajo a `AGENDADO`.

## Mensajería compartida

El trabajador podrá iniciar la conversación desde el detalle de cualquier solicitud. El mensaje se agregará al arreglo `messages` del trabajo con remitente `worker`.

El cliente solo podrá abrir y responder el chat cuando exista al menos un mensaje del trabajador en su publicación. Antes de ello, el botón de conversación aparecerá deshabilitado con una explicación breve. Una vez iniciada la conversación, el cliente verá el historial completo, podrá enviar mensajes con remitente `client` y el trabajador los verá al volver al detalle del mismo trabajo.

Los mensajes vacíos no se enviarán. Cada mensaje tendrá un identificador, texto y hora local. El historial se mantendrá ordenado según su inserción y permanecerá disponible únicamente mientras la aplicación continúe ejecutándose.

## Estados y errores

- Sin publicaciones del cliente: se mostrará un estado vacío y el acceso para crear una necesidad.
- Sin solicitudes en una página o filtro: se conservará el estado vacío actual.
- Imagen no seleccionada o permiso denegado: se mostrará un mensaje y no se publicará.
- Precio vacío, no numérico o menor o igual a cero: el formulario no se enviará.
- Trabajador inactivo: se mostrará la alerta y no se modificará el trabajo.
- Chat no iniciado: el cliente verá el botón deshabilitado hasta recibir un mensaje del trabajador.
- Trabajo eliminado o inexistente: se conservará el estado seguro de detalle no encontrado.

## Accesibilidad

Los nuevos campos, selectores, imágenes y controles de paginación tendrán etiquetas y estados accesibles. Los botones deshabilitados expondrán `accessibilityState`. La interfaz respetará tamaño de texto, alto contraste y modo de lectura amigable existentes.

## Verificación

Se comprobarán manual y técnicamente los siguientes escenarios:

1. Una publicación incompleta no puede enviarse.
2. Una publicación válida aparece en el perfil del cliente y en las solicitudes del trabajador.
3. La imagen, precio y método de pago coinciden en tarjeta y detalle.
4. Cada página contiene como máximo tres solicitudes y los filtros reinician la página.
5. Un trabajador inactivo recibe la alerta y no acepta el trabajo.
6. Un trabajador activo acepta el trabajo y este pasa a Mis trabajos.
7. El cliente no puede iniciar el chat.
8. Después del primer mensaje del trabajador, ambos perfiles comparten el mismo historial y pueden responder.
9. `npm run typecheck` finaliza correctamente.
10. La exportación web de Expo se genera sin errores.
