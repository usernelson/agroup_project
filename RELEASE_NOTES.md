# AGroup APP - Release Notes

## Version 1.1 (Junio 2023)

### Resumen de la versión

La versión 1.1 de AGroup APP incluye importantes mejoras en la gestión de usuarios, autenticación y experiencia general de la plataforma. Hemos optimizado la forma en que se maneja la información de profesores y alumnos, mejorando la estabilidad del sistema y añadiendo nuevas funcionalidades.

### Nuevas características

- **Gestión mejorada de cuentas de alumnos**: Los profesores ahora pueden ver, crear, editar y eliminar cuentas de alumnos con mayor facilidad.
- **Campo de ID de Profesor**: Ahora se muestra claramente el ID del profesor que creó cada cuenta de alumno, mejorando la trazabilidad.
- **Interfaz optimizada**: Rediseño de componentes clave para una experiencia más intuitiva y moderna.
- **Autenticación robusta**: Sistema más seguro y confiable para la gestión de sesiones.

### Mejoras

#### Gestión de Usuarios
- Preservación correcta del ID de profesor en el campo `created_by` al editar cuentas de alumnos.
- Visualización explícita del ID de profesor en formularios de edición como campo de solo lectura.
- Extracción mejorada de atributos de usuario desde la estructura de Keycloak.
- Implementación más robusta del manejo de teléfono y género en formularios.

#### Autenticación
- Sistema robusto de detección de roles para profesores y alumnos.
- Mejor manejo de tokens y sesiones para prevenir problemas de autenticación.
- Prevención de redirecciones infinitas en rutas protegidas.
- Manejo mejorado de mensajes de error durante el inicio de sesión.

#### Interfaz de Usuario
- Navegación móvil optimizada para mejor acceso a funcionalidades.
- Mejoras en los formularios con validaciones más claras.
- Visualización consistente de información en tablas y listas.
- Mensajes informativos más claros y amigables.

### Correcciones

#### Gestión de Usuarios
- Solucionado problema donde el campo "Creado por" mostraba "9" en lugar del ID de profesor.
- Corregido manejo inconsistente de atributos anidados como teléfono y género.
- Solucionado problema con valores duplicados en campos de formulario al editar usuarios.
- Corregida la visualización incorrecta de IDs de profesor en la lista de alumnos.

#### Autenticación
- Resueltos problemas con `refreshAuth` que causaban errores al iniciar sesión.
- Corregido manejo de roles que podía causar problemas de permisos.
- Solucionado problema con tokens de sesión que no se renovaban correctamente.
- Corregidos problemas de redirección después del inicio de sesión exitoso.

#### Integración con Keycloak
- Mejorado el mapeo de atributos entre Keycloak y la aplicación.
- Corregido el manejo de la estructura de datos al recibir información del usuario.
- Estandarizado el formato de envío de datos al actualizar información de usuario.
- Resueltos problemas con la estructura de atributos en las respuestas de API.

### Cambios internos

- Refactorización del código para mejor organización y mantenibilidad.
- Mejoras en la estructura de proyectos y nomenclatura.
- Implementación de helpers y utilidades para funciones comunes.
- Mejor gestión de estados y contextos de React.
- Mayor consistencia en la nomenclatura de variables y funciones.

### Requisitos del sistema

- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Conexión a Internet estable
- Resolución mínima recomendada: 1280x720

### Notas adicionales

- Se recomienda limpiar la caché del navegador después de actualizar a esta versión.
- Los usuarios de versiones anteriores no necesitan acciones adicionales para migrar.
- Para información de soporte, contactar al equipo técnico.
