# Diseño: adaptación responsive del onboarding

## Objetivo

Hacer que las pantallas de onboarding se adapten automáticamente al ancho, alto y escala de fuente del teléfono, evitando texto cortado, superposiciones y espacios rígidos en dispositivos compactos.

## Alcance

- Aplicar tipografía responsive a `src/screens/onboarding/OnboardingScreens.tsx`.
- Aplicar la misma tipografía a los componentes compartidos utilizados por el onboarding en `src/components/ui.tsx`.
- Sustituir alturas mínimas rígidas de 744 px por crecimiento flexible.
- Mantener el desplazamiento vertical y el escalado de accesibilidad de React Native.
- No modificar navegación, validaciones, cámara, ubicación ni reglas de negocio.

## Diseño técnico

Se creará un componente `ResponsiveText` basado en `Text` de React Native. El componente utilizará `useWindowDimensions()` y calculará un factor moderado según el ancho disponible:

- menos de 360 px: escala compacta;
- entre 360 y 429 px: escala base;
- 430 px o más: escala amplia;
- límites de seguridad para impedir texto demasiado pequeño o grande.

El componente conservará las propiedades originales de `Text`, combinará estilos mediante `StyleSheet.flatten()` y ajustará `fontSize` y `lineHeight`. No se desactivará `allowFontScaling`, por lo que las preferencias de accesibilidad del sistema seguirán funcionando.

Los contenedores principales usarán `flexGrow: 1` en lugar de `minHeight: 744`. Las pantallas extensas seguirán usando `ScrollView`, de modo que el contenido pueda crecer cuando el teléfono sea bajo o el usuario aumente el tamaño de fuente.

## Manejo de casos límite

- Los textos esenciales podrán ocupar varias líneas; no se truncarán mediante `numberOfLines`.
- Botones y campos conservarán alturas mínimas táctiles.
- Los textos gráficos del DNI también se ajustarán, pero con un límite inferior moderado.
- La cámara conservará su área disponible mediante `flex: 1` y no dependerá de una altura fija.

## Verificación

- Ejecutar `npm run typecheck`.
- Revisar que no queden contenedores principales con `minHeight: 744`.
- Probar conceptualmente los rangos 320, 360, 390 y 430 px.
- Confirmar que `ResponsiveText` preserve el escalado accesible del sistema.
