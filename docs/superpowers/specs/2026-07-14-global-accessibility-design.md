# Diseño de accesibilidad global

**Fecha:** 2026-07-14  
**Estado:** Aprobado para planificación

## Objetivo

Incorporar una configuración de accesibilidad compartida para clientes y trabajadores. Cada perfil tendrá un botón propio de acceso, pero ambos abrirán el mismo panel y modificarán una única configuración global durante la sesión.

## Alcance funcional

El panel incluirá:

1. **Tamaño de texto** con tres niveles: Normal, Grande y Muy grande.
2. **Contraste alto** como opción activable.
3. **Dislexia amigable** como opción activable.
4. **Restablecer configuración** para recuperar los valores predeterminados.

Los ajustes podrán combinarse y su efecto será inmediato en toda la aplicación.

## Acceso desde los perfiles

- El perfil del trabajador conservará su acceso actual, pero el botón dejará de ser únicamente visual y abrirá el panel compartido.
- El perfil del cliente incorporará un botón equivalente y claramente identificado como “Accesibilidad”.
- Ambos controles tendrán etiqueta, rol y estado accesibles para lectores de pantalla.

## Panel compartido

La configuración se presentará en un modal sobre la pantalla actual para evitar añadir rutas innecesarias. El panel tendrá:

- título y explicación breve;
- selector de tamaño de texto;
- interruptores para contraste alto y dislexia amigable;
- muestra de texto para previsualizar el resultado;
- acción secundaria “Restablecer configuración”;
- acción principal para cerrar el panel.

El contenido podrá desplazarse cuando el tamaño de texto seleccionado requiera más espacio.

## Comportamiento de las opciones

### Tamaño de texto

Se aplicará un multiplicador adicional al ajuste responsivo existente:

- Normal: `1.0`;
- Grande: `1.15`;
- Muy grande: `1.30`.

El sistema seguirá respetando el escalado de fuente configurado en el teléfono. El contenido deberá crecer sin quedar cortado ni superpuesto.

### Contraste alto

El modo de contraste alto usará una paleta reforzada para superficies, textos, bordes, controles y estados interactivos. La legibilidad no dependerá únicamente del color: selección, errores y acciones mantendrán texto, iconos o bordes que comuniquen su significado.

### Dislexia amigable

El modo amigable para dislexia priorizará legibilidad mediante la tipografía OpenDyslexic incluida en la aplicación, mayor altura de línea, espaciado moderado entre caracteres y menor densidad visual. Los archivos Regular y Bold se distribuirán con su licencia SIL Open Font License 1.1. No se incorporará almacenamiento en esta etapa.

## Estado y duración

Las preferencias se administrarán en un contexto global en memoria y se compartirán entre todas las pantallas.

Valores iniciales:

- tamaño Normal;
- contraste alto desactivado;
- dislexia amigable desactivada.

No se guardarán en el dispositivo. Por tanto:

- cerrar completamente la aplicación recuperará los valores iniciales;
- cerrar sesión ejecutará explícitamente el restablecimiento antes de volver al acceso;
- cambiar entre pantallas o perfiles durante una misma sesión conservará los ajustes.

## Arquitectura propuesta

- Un contexto global expondrá preferencias, acciones de actualización y restablecimiento.
- El componente de texto responsivo combinará el tamaño de pantalla con las preferencias de accesibilidad.
- Un panel reutilizable será invocado desde ambos perfiles.
- Los contenedores y componentes principales consumirán la paleta de contraste para que el cambio afecte la experiencia completa, no solo al modal.
- Los flujos de cierre de sesión llamarán al restablecimiento global.

## Criterios de aceptación

- Existe un botón de accesibilidad funcional en cada perfil.
- Ambos botones abren el mismo panel y muestran el mismo estado.
- Los tres niveles de texto producen un cambio inmediato y mantienen el contenido utilizable.
- El contraste alto modifica superficies, texto y controles principales en toda la aplicación.
- El modo dislexia amigable mejora espaciado y altura de línea globalmente.
- Las opciones pueden combinarse.
- Restablecer devuelve las tres preferencias a sus valores iniciales.
- Cerrar sesión restablece las preferencias.
- Reiniciar la app no conserva preferencias anteriores.
- El proyecto supera la comprobación de TypeScript.
