# aTeacher React Application

Aplicación web educativa para la gestión de cursos, profesores y estudiantes.

## Características

- Autenticación de usuarios con múltiples niveles (profesor, alumno)
- Panel de administración para gestión de usuarios
- Mensajería en tiempo real entre usuarios
- Salas virtuales para interacción educativa
- Integración con IA para asistencia educativa
- Perfil de usuario personalizable
- Calendario de eventos y actividades
- Interfaz adaptable a dispositivos móviles

## Tecnologías

- React 18
- React Router 6
- Styled Components
- Context API para gestión de estado
- Optimización de rendimiento con code splitting
- APIs REST para comunicación con backend

## Configuración del Proyecto

### Requisitos Previos

- Node.js (v14+)
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]

# Acceder al directorio
cd my-react-app

# Instalar dependencias
npm install

# Crear archivo .env con las variables de entorno necesarias
cp .env.example .env
```

### Variables de Entorno

```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_AUTH_PROVIDER=direct
```

### Ejecución

```bash
# Iniciar en modo desarrollo
npm start

# Compilar para producción
npm run build
```

## Estructura del Proyecto

- `/src/api`: Servicios para comunicación con el backend
- `/src/components`: Componentes reutilizables
- `/src/context`: Contextos de React para estado global
- `/src/pages`: Componentes de página principal
- `/src/routes`: Configuración de rutas
- `/src/styles`: Estilos globales y componentes de estilo
- `/src/utils`: Utilidades y funciones auxiliares

## Directrices de Desarrollo

- Utilizar componentes funcionales con hooks
- Seguir las buenas prácticas de React para optimización de rendimiento
- Mantener consistencia en nombrado de archivos y componentes
- Documentar funciones y componentes complejos
