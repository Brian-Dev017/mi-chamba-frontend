# Estructura del frontend

Esta carpeta contiene la implementacion visual inicial de **Mi Chamba** basada en la pagina `ALTA FIDELIDAD` de Figma, pero organizada para crecer hacia una app real con endpoints y base de datos.

## Carpetas

- `prototype`: contenedor principal del prototipo y registro de pantallas.
- `components`: componentes reutilizables de UI como botones, campos, contenedores y navegacion inferior.
- `data`: datos mock temporales. Estos objetos simulan respuestas de backend.
- `screens/auth`: pantallas de acceso y seleccion de perfil.
- `screens/onboarding`: registro, identidad, documentos y foto de perfil.
- `screens/worker`: solicitudes, detalle de solicitud, trabajos y perfil del trabajador.
- `services/api`: capa preparada para llamadas HTTP.
- `theme`: colores y tokens visuales.
- `types`: tipos de dominio compartidos entre pantallas, datos mock y API.

## Como conectar endpoints despues

La idea es que las pantallas no llamen directamente a `fetch`. Primero se crean funciones en `services/api`, por ejemplo:

- `getWorkerRequests()`
- `getRequestDetail(id)`
- `acceptRequest(id)`
- `getWorkerProfile()`
- `getWorkerReviews()`

Al inicio esas funciones pueden devolver datos de `data/mockData.ts`. Cuando exista backend, se cambian internamente para usar `apiGet` o `apiPost` desde `services/api/client.ts`.

## Relacion futura con base de datos

El frontend no se conecta directo a la base de datos. El flujo correcto sera:

1. Pantalla React Native.
2. Funcion en `services/api`.
3. Endpoint del backend.
4. Base de datos PostgreSQL/Supabase.

Esto evita exponer credenciales, permite validar permisos por rol y mantiene limpia la app movil.
