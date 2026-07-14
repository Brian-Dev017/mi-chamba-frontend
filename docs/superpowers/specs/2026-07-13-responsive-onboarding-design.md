# Diseño: adaptación responsive del onboarding

## Objetivo

Hacer que las pantallas de onboarding se adapten automáticamente al ancho, alto y escala de fuente del teléfono, evitando texto cortado, superposiciones y espacios rígidos en dispositivos compactos.

## Alcance

- Aplicar tipografía responsive a `src/screens/onboarding/OnboardingScreens.tsx`.
- Aplicar la misma tipografía a los componentes compartidos utilizados por el onboarding en `src/components/ui.tsx`.
- Sustituir alturas mínimas rígidas de 744 px por crecimiento flexible.
- Mantener el desplazamiento vertical y el escalado de accesibilidad de React Native.
- Permitir que los formularios continúen desplazándose cuando el teclado esté abierto.
- No modificar navegación, validaciones, cámara, ubicación ni reglas de negocio.

## Diseño técnico

Se creará un componente `ResponsiveText` basado en `Text` de React Native. El componente utilizará `useWindowDimensions()` y calculará un factor moderado según el ancho disponible:

- menos de 360 px: escala compacta;
- entre 360 y 429 px: escala base;
- 430 px o más: escala amplia;
- límites de seguridad para impedir texto demasiado pequeño o grande.

El componente conservará las propiedades originales de `Text`, combinará estilos mediante `StyleSheet.flatten()` y ajustará `fontSize` y `lineHeight`. No se desactivará `allowFontScaling`, por lo que las preferencias de accesibilidad del sistema seguirán funcionando.

Los contenedores principales usarán `flexGrow: 1` en lugar de `minHeight: 744`. Las pantallas extensas seguirán usando `ScrollView`, de modo que el contenido pueda crecer cuando el teléfono sea bajo o el usuario aumente el tamaño de fuente.

## Comportamiento con el teclado

Las pantallas que contienen campos utilizarán un contenedor compartido compuesto por `KeyboardAvoidingView` y `ScrollView`. Cuando se abra el teclado, el sistema reducirá el área útil de la pantalla y el borde superior del teclado se tratará como el límite inferior de la página visible. Ningún contenido interactivo deberá quedar detrás del teclado.

La configuración será:

- `KeyboardAvoidingView` con `behavior="padding"` en iOS y `behavior="height"` en Android;
- `ScrollView` con `flex: 1` y `contentContainerStyle={{ flexGrow: 1 }}`;
- `keyboardShouldPersistTaps="handled"` para permitir botones y validaciones con el teclado abierto;
- `keyboardDismissMode="interactive"` en iOS y `keyboardDismissMode="on-drag"` en Android;
- ajuste automático de insets del teclado en iOS;
- `softwareKeyboardLayoutMode: "resize"` en Android para que la ventana termine en el borde superior del teclado.

El usuario podrá desplazarse desde el encabezado hasta el último control mientras el teclado permanezca visible. El campo activo, los mensajes de validación y la acción siguiente deberán poder quedar por encima del teclado. Al cerrarlo, el contenedor recuperará automáticamente toda la altura del dispositivo.

## Manejo de casos límite

- Los textos esenciales podrán ocupar varias líneas; no se truncarán mediante `numberOfLines`.
- Botones y campos conservarán alturas mínimas táctiles.
- Los textos gráficos del DNI también se ajustarán, pero con un límite inferior moderado.
- La cámara conservará su área disponible mediante `flex: 1` y no dependerá de una altura fija.
- El teclado no cubrirá campos, mensajes de error, botones ni pies de formulario.
- El borde superior del teclado funcionará como final temporal del área visible y desplazable.

## Verificación

- Ejecutar `npm run typecheck`.
- Revisar que no queden contenedores principales con `minHeight: 744`.
- Probar conceptualmente los rangos 320, 360, 390 y 430 px.
- Confirmar que `ResponsiveText` preserve el escalado accesible del sistema.
- Abrir el teclado en cada formulario y verificar que sea posible desplazar el último campo y el botón de continuación por encima de él.
- Verificar el redimensionamiento de la ventana en Android y el ajuste de insets en iOS.
