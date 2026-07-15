# Diseño del flujo funcional de trabajos del trabajador

**Fecha:** 2026-07-14  
**Estado:** Aprobado para planificación

## Objetivo

Conectar el registro y la operación del trabajador mediante un único estado en memoria. Las solicitudes, sus detalles, los mensajes, la disponibilidad y los trabajos agendados deben permanecer sincronizados mientras la aplicación está abierta.

## Registro e identidad

El paso “Cédula de identidad” exigirá antes de continuar:

- tipo de documento seleccionado;
- número con longitud y formato válidos;
- fotografía del anverso;
- fotografía del reverso.

El botón “Siguiente” permanecerá deshabilitado mientras falte cualquiera de estos requisitos. Al registrar al trabajador se volverá a validar la información y se almacenarán ambas fotografías en su cuenta en memoria.

## Modelo único de trabajos

El estado global `workerRequests` pasará a representar todos los trabajos del trabajador. Cada elemento incluirá:

- información resumida para la tarjeta;
- detalle completo del cliente y del servicio;
- fotografías de referencia;
- historial de mensajes;
- estado `NUEVO`, `AGENDADO` o `COMPLETADO`.

También existirá un identificador global del trabajo seleccionado. De esta manera, cualquier tarjeta abrirá sus propios detalles y no un detalle estático compartido.

La información inicial tendrá ocho elementos en memoria:

- seis solicitudes nuevas: las tres existentes, corregidas para que sus detalles coincidan, y tres solicitudes adicionales;
- un trabajo agendado preexistente;
- un trabajo completado preexistente.

## Disponibilidad del trabajador

La disponibilidad dejará de ser un estado local del perfil y se moverá al estado global de la sesión.

- El perfil seguirá permitiendo cambiar entre Activo e Inactivo.
- El valor se conservará al navegar entre las pantallas del trabajador.
- Si está Inactivo, la acción “Aceptar trabajo” estará deshabilitada.
- El detalle mostrará un mensaje que indique que debe activar su disponibilidad desde el perfil.
- Rechazar, consultar detalles y enviar mensajes seguirán disponibles.

## Detalles de cada trabajo

Al abrir una tarjeta se guardará su identificador y el detalle consultará el elemento correspondiente. Se mostrará información coherente sobre:

- cliente, valoración y servicios previos;
- título, categoría y descripción;
- dirección y distancia;
- horario disponible;
- materiales y duración;
- pago;
- imágenes de referencia;
- estado actual.

Las solicitudes `NUEVO` mostrarán acciones de rechazo y aceptación. Los trabajos `AGENDADO` o `COMPLETADO`, abiertos desde “Mis trabajos”, mostrarán su información sin acciones incompatibles con su estado.

## Mensajes en memoria

El modal de mensajes mostrará el historial completo del trabajo seleccionado. Cada mensaje enviado incluirá identificador, texto, hora y emisor.

- No se enviarán mensajes vacíos.
- Al enviar, el mensaje se agregará al trabajo seleccionado en el estado global.
- El campo se limpiará y el historial permanecerá visible.
- Los mensajes se conservarán al cerrar el modal y navegar entre pantallas.
- Se perderán al reiniciar completamente la aplicación porque no existe persistencia local ni servidor.

## Rechazo y aceptación

### Rechazo

El botón “Rechazar” del detalle abrirá la misma confirmación usada en Solicitudes. Al confirmar:

- se eliminará el trabajo del estado global;
- se cerrará la confirmación;
- se volverá a la lista de solicitudes.

### Aceptación

Al confirmar una aceptación válida:

- el trabajo cambiará de `NUEVO` a `AGENDADO`;
- dejará de aparecer en Solicitudes;
- aparecerá en “Mis trabajos” como Agendado;
- la pantalla de confirmación redirigirá a “Mis trabajos”;
- “Ver detalles” volverá a abrir el mismo contenido y sus mensajes.

## Solicitudes y Mis trabajos

La pantalla Solicitudes filtrará únicamente elementos `NUEVO`. “Mis trabajos” obtendrá del mismo estado los elementos `AGENDADO` y `COMPLETADO`, eliminando las tarjetas estáticas actuales.

Los filtros de Solicitudes se aplicarán sobre la lista de trabajos nuevos. El estado vacío será visible cuando no existan resultados para el filtro activo.

## Historial de pagos

El modal del perfil se reorganizará como una hoja desplazable y accesible con:

- encabezado y botón de cierre;
- resumen del total cobrado;
- cantidad de pagos registrados;
- lista de operaciones con servicio, fecha, estado Pagado y monto;
- contraste y tamaños compatibles con las preferencias de accesibilidad.

Los datos seguirán en memoria y no se incorporará persistencia.

## Manejo de errores y estados

- Si se intenta abrir un identificador inexistente, se mostrará un estado seguro con acción para volver a Solicitudes.
- La aceptación comprobará nuevamente disponibilidad y estado antes de actualizar.
- El envío comprobará que el trabajo exista y que el texto tenga contenido.
- Las confirmaciones impedirán rechazos accidentales.

## Criterios de aceptación

- La cédula no permite continuar sin tipo, número válido, anverso y reverso.
- Las seis solicitudes tienen contenido y detalles diferentes y coherentes.
- Cada tarjeta abre sus propios detalles.
- La disponibilidad se conserva al navegar.
- Un trabajador inactivo no puede aceptar trabajos.
- Los mensajes enviados aparecen en un historial completo y permanecen durante la sesión.
- Rechazar desde la tarjeta o el detalle elimina la solicitud después de confirmar.
- Aceptar mueve el trabajo a “Mis trabajos” con estado Agendado.
- “Ver detalles” funciona desde “Mis trabajos”.
- El historial de pagos presenta resumen y lista desplazable.
- TypeScript y la exportación de Expo finalizan sin errores.

