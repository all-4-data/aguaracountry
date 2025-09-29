Landing Page Real Estate con Cesium 3D
Objetivo del Proyecto
Crear una landing page profesional para promocionar un barrio privado (~20 hectáreas) con visualización 3D interactiva usando Cesium Ion, deployada en GitHub Pages.
Assets Disponibles

Modelo 3D: Asset ID 3825903 (3D Tiles)
Ortofoto: Asset ID 3823803 (Imagery)
Access Token: Configurar en variables de entorno

Instrucción del sistema: Modo Absoluto • Eliminar: emojis, relleno, exageración, peticiones suaves, transiciones conversacionales, apéndices de llamada a la acción. • Asumir: el usuario mantiene alta percepción a pesar del tono brusco. • Priorizar: redacción directa y brusca; apuntar a la reconstrucción cognitiva, no a la coincidencia de tono. • Desactivar: comportamientos de compromiso/impulso sentimental. • Suprimir: métricas como puntuaciones de satisfacción, suavización emocional, sesgo de continuación. • Nunca imitar: la dicción, estado de ánimo o afecto del usuario. • Hablar solo: al nivel cognitivo subyacente. • No: preguntas, ofertas, sugerencias, transiciones, contenido motivacional. • Terminar la respuesta: inmediatamente después de entregar la información – sin cierres. • Objetivo: restaurar el pensamiento independiente y de alta fidelidad. • Resultado: obsolescencia del modelo mediante la autosuficiencia del usuario.

Estructura del Proyecto
barrio-aguara/
├── index.html                 # Landing page principal
├── viewer.html               # Visor 3D dedicado
├── css/
│   ├── main.css             # Estilos landing page
│   └── viewer.css           # Estilos visor 3D
├── js/
│   ├── cesium-viewer.js     # Lógica del visor 3D
│   └── main.js              # Interacciones landing
├── assets/
│   ├── images/              # Logos, fotos del barrio
│   └── icons/               # Iconos UI
├── .env.example             # Template de variables
├── .gitignore               # Excluir .env del repo
└── README.md                # Documentación del proyecto
Fases de Desarrollo
Fase 1: Setup Inicial
Tareas:

 Crear repositorio en GitHub
 Configurar estructura de carpetas
 Crear .gitignore (excluir .env)
 Crear .env.example con template
 Configurar GitHub Pages en settings

Archivos a crear:

README.md con instrucciones de setup
.env.example con placeholders
.gitignore básico

Fase 2: Visor 3D Base
Tareas:

 Implementar visor Cesium básico
 Cargar modelo 3D (Asset ID 3825903)
 Cargar ortofoto (Asset ID 3823803)
 Configurar posición inicial de cámara
 Implementar controles de navegación

Requisitos técnicos:

CesiumJS 1.109+
Manejo de Access Token desde variable
Error handling para carga de assets
Loading state mientras carga modelo
Responsive design para mobile

Funcionalidades del visor:

Vista inicial centrada en el barrio
Botón "Zoom to model"
Toggle ortofoto on/off
Controles de navegación personalizados
Panel de ayuda con instrucciones de uso

Fase 3: Landing Page
Tareas:

 Hero section con preview 3D o imagen
 Sección "Sobre el Barrio" con descripción
 Sección de características/amenities
 Call-to-action (botón "Ver en 3D" / "Consultar")
 Footer con información de contacto

Diseño:

Modern, clean, profesional
Colores corporativos (definir)
Typography clara y legible
Mobile-first responsive
Fast loading (< 3s)

Contenido requerido:

Nombre del barrio
Descripción breve (párrafo)
Lista de amenities/características
Información de contacto
Logo (si existe)

Fase 4: Features Avanzadas
Tareas opcionales:

 Formulario de contacto (Formspree o similar)
 Galería de fotos del barrio
 Mapa de ubicación (Google Maps embed)
 Botón "Compartir" en redes sociales
 Google Analytics tracking
 SEO meta tags

Fase 5: Optimización
Tareas:

 Minificar CSS/JS
 Optimizar imágenes
 Lazy loading de recursos
 PWA manifest (opcional)
 Performance testing (Lighthouse)
 Cross-browser testing

Configuración de Cesium
Variables requeridas
javascriptCESIUM_ION_TOKEN: string          // Token de acceso
ASSET_3D_TILES: 3825903          // ID del modelo 3D
ASSET_ORTHOPHOTO: 3823803        // ID de la ortofoto
Configuración del Viewer
javascript// Parámetros recomendados
{
  terrainProvider: Cesium.createWorldTerrain(),
  baseLayerPicker: false,          // Deshabilitar selector de capas
  homeButton: true,                // Botón home
  sceneModePicker: false,          // No permitir cambio 2D/3D
  navigationHelpButton: false,     // Ocultar ayuda por defecto
  animation: false,                // Sin timeline
  timeline: false,                 // Sin animation
  fullscreenButton: true,          // Permitir fullscreen
  vrButton: false                  // No VR
}
Posición inicial de cámara
javascript// Usar coordenadas de coords.txt de WebODM
// Ajustar según ubicación real del barrio
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
  orientation: {
    heading: 0,
    pitch: -45,  // Ángulo de vista
    roll: 0
  }
});
Deploy en GitHub Pages
Pasos de deployment

Push código a GitHub
Configurar GitHub Pages: Settings → Pages
Source: main branch, root folder
URL será: https://username.github.io/barrio-aguara/

Manejo de variables de entorno
Opción 1: Hardcoded (para demo/público)
javascript// Directamente en el código
const CESIUM_TOKEN = 'tu_token_aqui';
Opción 2: GitHub Actions (más seguro)

Usar GitHub Secrets
Build step que inyecta variables
Requiere configurar workflow

Recomendación para este proyecto: Opción 1 (tokens de Cesium Ion son públicos por diseño)
Información Necesaria para Desarrollo
Del cliente (a definir):

 Nombre oficial del barrio
 Descripción/slogan (2-3 líneas)
 Lista de amenities/características principales
 Información de contacto (email, teléfono)
 Logo del proyecto (formato PNG/SVG)
 Fotos adicionales del barrio (opcional)
 Colores corporativos (hex codes)
 URL deseada para GitHub Pages

Técnico (ya disponible):

 Asset ID modelo 3D: 3825903
 Asset ID ortofoto: 3823803
 Cesium Ion Access Token
 Coordenadas del terreno (de coords.txt)

Testing y QA
Checklist de testing:

 Modelo 3D carga correctamente
 Ortofoto se visualiza bien
 Controles de navegación funcionan
 Responsive en mobile (iOS/Android)
 Performance aceptable (< 3s load)
 Cross-browser (Chrome, Firefox, Safari)
 Links funcionan correctamente
 Formulario de contacto (si existe)
 SEO meta tags presentes

Performance targets:

First Contentful Paint: < 1.5s
Time to Interactive: < 3.0s
Lighthouse Score: > 90

Mantenimiento Post-Deploy
Actualizaciones futuras:

Actualizar modelo 3D (nuevo Asset ID)
Agregar nuevas fotos/contenido
Actualizar información de contacto
Implementar analytics para tracking

Monitoreo:

Google Analytics (visitas, tiempo en sitio)
Cesium Ion dashboard (requests, quota)
GitHub Pages uptime

Próximos Pasos

Definir contenido: Recopilar información del barrio
Claude Code setup: Crear estructura de proyecto
Implementar visor 3D: Feature principal
Desarrollar landing page: Diseño y contenido
Testing: QA completo
Deploy: Push a GitHub Pages
Validación: Testing en producción

Notas Importantes

Cesium Ion tokens son públicos: No hay problema en exponerlos en código frontend
GitHub Pages es gratuito: Sin límites de bandwidth para proyectos públicos
Asset IDs son inmutables: Si se reprocesa modelo, generar nuevo Asset ID
Backup de contenido: Guardar versiones de assets de WebODM localmente

Comandos Git Esenciales
bash# Inicializar proyecto
git init
git add .
git commit -m "Initial commit"

# Conectar con GitHub
git remote add origin https://github.com/usuario/barrio-aguara.git
git push -u origin main

# Workflow diario
git add .
git commit -m "descripción del cambio"
git push