# Diseño del flujo de registro de cliente

## Objetivo

Completar el registro de usuarios con perfil `Cliente` mediante un wizard de tres pasos posteriores a la selección de perfil. El flujo conservará todos los datos al navegar hacia atrás, registrará temporalmente al cliente en memoria y quedará preparado para sustituir esa operación por una llamada al backend.

## Alcance y restricción de compatibilidad

El trabajo incluye exclusivamente el flujo de cliente, sus tipos de dominio, su estado compartido y el punto de registro en memoria. No se modificarán el comportamiento, la navegación ni los estilos del flujo de trabajador. Los campos compartidos de `RegistrationDraft` conservarán sus nombres y semántica actuales para evitar regresiones en el registro de trabajador.

## Flujo de navegación

1. `profileSelection`: permite elegir un único rol. `Continuar` permanece deshabilitado sin selección. Elegir `Cliente` conduce a `clientPersonalInformation`; elegir `Trabajador` mantiene la navegación existente a `personalInformation`.
2. `clientPersonalInformation`: captura nombre, apellido, celular, contraseña y confirmación de contraseña. `Siguiente` conduce a `clientLocation` únicamente cuando los campos son válidos.
3. `clientLocation`: captura una dirección manual o solicita la ubicación actual. `Regresar` vuelve directamente al paso anterior conservando datos. `Siguiente` conduce a `clientPropertyType` cuando existe una ubicación válida.
4. `clientPropertyType`: permite seleccionar un tipo de inmueble, añadir una referencia opcional y finalizar. `Regresar` vuelve directamente a ubicación conservando datos. Tras un registro correcto vuelve a `login`.

La X de los pasos 1 a 3 del formulario abre una confirmación. Confirmar descarta el borrador completo y regresa a login; cancelar cierra el diálogo sin perder datos. La navegación normal hacia atrás no solicita confirmación porque no descarta información.

## Estado y modelo de datos

`RegistrationDraft` continuará siendo la fuente central del formulario. Se ampliará con:

- `clientPropertyType`: `Casa | Departamento | Oficina | Local Comercial | Otros | null`.
- `clientReferenceDetails`: texto libre opcional.

Se añadirá `RegisteredClient` con identificador, nombre, apellido, celular, contraseña, dirección, coordenadas opcionales, tipo de inmueble y detalles de referencia. `MiChambaPrototype` mantendrá una colección `registeredClients` y expondrá una operación asíncrona `registerClient` a las pantallas mediante `ScreenRenderProps`.

La operación tendrá forma de servicio aunque inicialmente escriba en memoria. Validará nuevamente el borrador antes de crear el registro, reemplazará un cliente previo con el mismo celular y resolverá exitosamente. Esta frontera permitirá cambiar después la implementación interna por un `POST` sin modificar la pantalla final.

## Validaciones

- Nombre y apellido: texto no vacío después de eliminar espacios exteriores; se conservará el saneamiento actual de letras y espacios.
- Celular: exactamente nueve dígitos. Se almacenará sin espacios y se mostrará con el formato `999 999 999`.
- Contraseña: mínimo ocho caracteres, al menos una mayúscula, una minúscula y un número, siguiendo la validación segura que ya usa el proyecto.
- Confirmación: debe coincidir exactamente con la contraseña.
- Ubicación: dirección manual de al menos seis caracteres o coordenadas obtenidas por GPS.
- Inmueble: selección obligatoria de una de las cinco opciones.
- Referencia: opcional; se enviará recortada.

Cada botón de avance se habilitará solamente cuando el paso correspondiente sea válido. La operación final repetirá la validación completa para impedir registros inconsistentes.

## Ubicación y reverse geocoding

`Usar mi ubicación actual` solicitará permisos con Expo Location, obtendrá coordenadas y ejecutará reverse geocoding. La dirección se formará con los campos disponibles devueltos por el dispositivo. Si el reverse geocoding no devuelve una dirección útil, se conservará una representación legible de latitud y longitud.

La interfaz mostrará estados de búsqueda, éxito, permiso denegado y error. Escribir manualmente una dirección eliminará las coordenadas anteriores para que la dirección visible sea la fuente vigente.

## Interfaz

Se mantendrá el lenguaje visual actual y la referencia suministrada:

- franja superior azul oscuro;
- fondo claro;
- títulos con subrayado azul;
- campos y tarjetas redondeados;
- acciones principales en azul oscuro;
- estados seleccionados en azul;
- footer fijo con indicador `Paso N de 3` y tres segmentos de progreso.

La pantalla de inmueble usará una cuadrícula de dos columnas con tarjetas de selección única e iconos de Ionicons. `Otros` ocupará una tarjeta del mismo tamaño y la referencia se ubicará debajo de la cuadrícula. Los estilos nuevos usarán nombres específicos del cliente para no afectar selectores utilizados por trabajador.

## Registro, carga y errores

Al pulsar `Finalizar registro`:

1. se bloquean interacciones repetidas y se muestra estado de carga;
2. se invoca `registerClient` con el borrador central;
3. si resulta exitoso, se guarda el cliente en memoria, se limpia el borrador y se navega a login;
4. si falla, se muestra un mensaje dentro de la pantalla, se restaura el botón y se conservan todos los datos para reintentar.

La simulación inicial no introducirá fallos aleatorios. La rama de error existirá para cubrir futuras excepciones del backend y errores de validación.

## Archivos previstos

- `src/types/domain.ts`: claves de pantalla, campos del borrador, tipo de inmueble, cliente registrado y contrato de `registerClient`.
- `src/prototype/MiChambaPrototype.tsx`: valores iniciales, colección de clientes y operación de registro en memoria.
- `src/prototype/screenRegistry.tsx`: registro de la nueva pantalla final.
- `src/screens/onboarding/OnboardingScreens.tsx`: completar ubicación, añadir la pantalla de inmueble, formato del celular, reverse geocoding y estilos específicos.
- `src/services/api/clientRegistration.ts`: frontera de servicio y construcción/validación del cliente registrado en memoria.

## Verificación

- Ejecutar `npm run typecheck`.
- Ejecutar `npx expo export --platform web --clear` para verificar empaquetado.
- Verificar manualmente selección de perfil, estados deshabilitados, validaciones, navegación hacia adelante y atrás, persistencia del borrador, cancelación con X, GPS, selección única de inmueble, registro exitoso y retorno a login.
- Revisar que las rutas de trabajador continúen compilando y que ningún estilo de trabajador haya sido modificado.

