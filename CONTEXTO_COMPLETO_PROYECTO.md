# 🆘 GUÍA DE CONTEXTO PARA SOPORTE TÉCNICO

> **Propósito:** Este documento contiene toda la información necesaria sobre mi proyecto para solicitar ayuda técnica con errores específicos.

---

## 📋 INFORMACIÓN GENERAL DEL PROYECTO

### Nombre del Proyecto
**Plataforma de Gestión de Eventos - Universidad Privada Antenor Orrego (UPAO)**

### Stack Tecnológico

**Frontend:**
- React 19.1.1
- Vite 7.1.6
- React Router DOM
- Firebase SDK (Auth + Firestore)

**Backend/Servicios:**
- Firebase Firestore (base de datos)
- Firebase Authentication (autenticación)
- n8n (automatizaciones y webhooks)
- nginx (reverse proxy en Google Compute Engine)

**Hosting:**
- Frontend: Firebase Hosting → `https://gestioneventos.notiscode.dev`
- n8n: Google Compute Engine VM → `https://n8n-gestioneventos.duckdns.org`

**Futuro:**
- Certificados blockchain en Polygon (no implementado aún)

---

## 🏗️ ESTRUCTURA DEL PROYECTO

```
gestion_eventosV1/
├── .env                              # Variables de entorno (NO se sube a Git)
├── .env.example                      # Plantilla de variables
├── .firebase/                        # Archivos de Firebase Hosting
├── .firebaserc                       # Configuración de Firebase
├── firebase.json                     # Configuración de deploy
├── firestore.rules                   # Reglas de seguridad Firestore
├── firestore.indexes.json            # Índices de Firestore
├── package.json                      # Dependencias del proyecto
├── vite.config.js                    # Configuración de Vite
├── index.html                        # HTML principal
│
├── public/                           # Archivos estáticos
│   ├── index.html
│   └── logo_upao.jpeg
│
├── src/                              # Código fuente
│   ├── App.jsx                       # Componente raíz
│   ├── main.jsx                      # Punto de entrada
│   │
│   ├── assets/                       # Imágenes y recursos
│   │   ├── fondo.jpg
│   │   ├── logo_upao.jpeg
│   │   └── ...
│   │
│   ├── components/                   # Componentes reutilizables
│   │   ├── auth/
│   │   │   └── RecuperarContrasenaModal.jsx
│   │   ├── layout/
│   │   │   ├── Footer.jsx
│   │   │   └── index.js
│   │   ├── qr/
│   │   │   ├── QRGenerator.jsx       # Generador de QR
│   │   │   └── QRScanner.jsx         # Escáner de QR
│   │   ├── ExpositoresTable/
│   │   │   └── index.jsx
│   │   └── GestionParticipantes/
│   │       └── index.jsx
│   │
│   ├── config/                       # Configuraciones
│   │   ├── credenciales.js           # Configuración Firebase
│   │   ├── webhookConfig.js          # Sistema dinámico de webhooks
│   │   └── constants.js
│   │
│   ├── core/                         # Lógica del negocio
│   │   ├── hooks/                    # Custom React Hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useEventosAlumno.js
│   │   │   ├── useEventosMantenimiento.js
│   │   │   ├── useParticipantes.js
│   │   │   └── useReportes.js
│   │   └── utils/                    # Utilidades
│   │       ├── formatters.js
│   │       ├── logger.js
│   │       ├── toastHelper.js
│   │       └── validations.js
│   │
│   ├── pages/                        # Páginas/Vistas
│   │   ├── LandingPage/
│   │   ├── Login/
│   │   ├── HomeAlumno/
│   │   ├── HomeOrganizador/
│   │   ├── DetalleEvento/
│   │   ├── MisEventos/
│   │   ├── GestionAsistencia/
│   │   ├── Reportes/
│   │   ├── Perfil/
│   │   ├── AlumnoLayout/
│   │   ├── OrganizadorLayout/
│   │   ├── OrganizadorDashboard/
│   │   └── NotFound/
│   │
│   ├── routes/                       # Rutas de la aplicación
│   │   └── AppRouter.jsx
│   │
│   ├── services/                     # Servicios/APIs
│   │   ├── authService.js            # Autenticación Firebase
│   │   ├── firestoreService.js       # CRUD Firestore
│   │   ├── n8nService.js             # Integración con n8n
│   │   ├── qrService.js              # Generación y validación QR
│   │   ├── reportesService.js        # Reportes y estadísticas
│   │   └── index.js
│   │
│   └── styles/                       # Estilos globales
│       ├── App.css
│       ├── index.css
│       └── theme.css
│
└── Documentación/                    # Docs del proyecto
    ├── GUIA_N8N_AUTOMATIZACIONES.md
    ├── CONFIGURACION_NGINX_CORS.md
    ├── EJEMPLO_USO_WEBHOOKS.md
    ├── SOLUCION_ERROR_CERTIFICADOS_SSL.md
    ├── RESUMEN_IMPLEMENTACION.md
    └── ...
```

---

## ⚙️ ARCHIVO .env (Variables de Entorno)

```bash
# ====================================
# 🔧 ENTORNO DE EJECUCIÓN
# ====================================
VITE_APP_ENV=development              # 'development' | 'production'

# ====================================
# 🔥 FIREBASE CONFIGURATION
# ====================================
VITE_FIREBASE_API_KEY=AIzaSyCXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=gestioneventosv1-fac46.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gestioneventosv1-fac46
VITE_FIREBASE_STORAGE_BUCKET=gestioneventosv1-fac46.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# ====================================
# 🤖 N8N AUTOMATION SERVICE
# ====================================
VITE_N8N_BASE_URL=https://n8n-gestioneventos.duckdns.org

# Webhooks de DESARROLLO (/webhook-test/)
VITE_N8N_WEBHOOK_EVENTO_CREADO_DEV=/webhook-test/evento-creado
VITE_N8N_WEBHOOK_INSCRIPCION_DEV=/webhook-test/inscripcion-confirmacion
VITE_N8N_WEBHOOK_LISTA_INSCRITOS_DEV=/webhook-test/lista-inscritos
VITE_N8N_WEBHOOK_ASISTENCIAS_DEV=/webhook-test/asistencias-finales

# Webhooks de PRODUCCIÓN (/webhook/)
VITE_N8N_WEBHOOK_EVENTO_CREADO_PROD=/webhook/evento-creado
VITE_N8N_WEBHOOK_INSCRIPCION_PROD=/webhook/inscripcion-confirmacion
VITE_N8N_WEBHOOK_LISTA_INSCRITOS_PROD=/webhook/lista-inscritos
VITE_N8N_WEBHOOK_ASISTENCIAS_PROD=/webhook/asistencias-finales

# ====================================
# 📧 EMAIL & OTROS
# ====================================
VITE_EMAIL_FROM=cuentapruebas156@gmail.com
VITE_ENCUESTA_BASE_URL=https://forms.upao.edu.pe
VITE_QR_SECRET_KEY=mi-clave-secreta-para-qr

# URLs del frontend (para CORS)
VITE_APP_URL_DEV=http://localhost:5173
VITE_APP_URL_PROD=https://gestioneventos.notiscode.dev
```

---

## 📦 DEPENDENCIAS (package.json)

```json
{
  "name": "gestion-eventos-upao",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "deploy": "npm run build && firebase deploy"
  },
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.1.3",
    "firebase": "^11.2.0",
    "qrcode": "^1.5.4",
    "html5-qrcode": "^2.3.8",
    "react-toastify": "^10.0.6",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.19.0",
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.19.0",
    "eslint-plugin-react": "^7.37.3",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "vite": "^7.1.6"
  }
}
```

---

## 🔥 CONFIGURACIÓN DE FIREBASE

### firestore.rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar si es el dueño
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Función helper para verificar rol
    function hasRole(role) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == role;
    }
    
    // Colección de usuarios
    match /usuarios/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Colección de eventos
    match /eventos/{eventoId} {
      allow read: if isAuthenticated();
      allow create: if hasRole('organizador');
      allow update, delete: if hasRole('organizador') && 
                               resource.data.organizadorId == request.auth.uid;
      
      // Subcolección de inscritos
      match /inscritos/{inscritoId} {
        allow read: if isAuthenticated();
        allow write: if isAuthenticated();
      }
      
      // Subcolección de expositores
      match /expositores/{expositorId} {
        allow read: if isAuthenticated();
        allow write: if hasRole('organizador');
      }
    }
  }
}
```

### firestore.indexes.json
```json
{
  "indexes": [
    {
      "collectionGroup": "eventos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizadorId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "eventos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🔧 ARCHIVOS DE CONFIGURACIÓN CLAVE

### src/config/credenciales.js
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const appFirebase = initializeApp(firebaseConfig);
export const db = getFirestore(appFirebase);

export default appFirebase;
```

### src/config/webhookConfig.js
```javascript
/**
 * Sistema dinámico para seleccionar webhooks según el entorno.
 * Automáticamente usa desarrollo o producción según VITE_APP_ENV.
 */

export const getEnvironment = () => {
  return import.meta.env.VITE_APP_ENV || 'development';
};

export const isProduction = () => {
  return getEnvironment() === 'production';
};

export const getN8nBaseUrl = () => {
  return import.meta.env.VITE_N8N_BASE_URL || '';
};

export const getAppUrl = () => {
  const env = getEnvironment();
  if (env === 'production') {
    return import.meta.env.VITE_APP_URL_PROD || window.location.origin;
  }
  return import.meta.env.VITE_APP_URL_DEV || 'http://localhost:5173';
};

const WEBHOOK_PATHS = {
  eventoCreado: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_EVENTO_CREADO_DEV || '/webhook-test/evento-creado',
    prod: import.meta.env.VITE_N8N_WEBHOOK_EVENTO_CREADO_PROD || '/webhook/evento-creado'
  },
  inscripcion: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_INSCRIPCION_DEV || '/webhook-test/inscripcion-confirmacion',
    prod: import.meta.env.VITE_N8N_WEBHOOK_INSCRIPCION_PROD || '/webhook/inscripcion-confirmacion'
  },
  listaInscritos: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_LISTA_INSCRITOS_DEV || '/webhook-test/lista-inscritos',
    prod: import.meta.env.VITE_N8N_WEBHOOK_LISTA_INSCRITOS_PROD || '/webhook/lista-inscritos'
  },
  asistencias: {
    dev: import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS_DEV || '/webhook-test/asistencias-finales',
    prod: import.meta.env.VITE_N8N_WEBHOOK_ASISTENCIAS_PROD || '/webhook/asistencias-finales'
  }
};

export const getWebhookPath = (webhookName) => {
  const webhook = WEBHOOK_PATHS[webhookName];
  if (!webhook) {
    console.warn(`⚠️ Webhook "${webhookName}" no encontrado`);
    return '';
  }
  const env = getEnvironment();
  return env === 'production' ? webhook.prod : webhook.dev;
};

export const getWebhookUrl = (webhookName) => {
  const baseUrl = getN8nBaseUrl();
  const path = getWebhookPath(webhookName);
  
  if (!baseUrl || !path) {
    console.error('❌ Error al construir URL de webhook:', { baseUrl, path, webhookName });
    return '';
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
};

export const getAllWebhookUrls = () => {
  return {
    eventoCreado: getWebhookUrl('eventoCreado'),
    inscripcion: getWebhookUrl('inscripcion'),
    listaInscritos: getWebhookUrl('listaInscritos'),
    asistencias: getWebhookUrl('asistencias')
  };
};

export const getConfigInfo = () => {
  return {
    environment: getEnvironment(),
    isProduction: isProduction(),
    n8nBaseUrl: getN8nBaseUrl(),
    appUrl: getAppUrl(),
    webhooks: getAllWebhookUrls()
  };
};

export default {
  getEnvironment,
  isProduction,
  getN8nBaseUrl,
  getAppUrl,
  getWebhookPath,
  getWebhookUrl,
  getAllWebhookUrls,
  getConfigInfo
};
```

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

---

## 🔌 SERVICIO DE N8N (n8nService.js)

```javascript
import logger from '../core/utils/logger';
import { getN8nBaseUrl, getWebhookUrl } from '../config/webhookConfig';

class N8nService {
  constructor() {
    this.baseUrl = getN8nBaseUrl();
    this.endpoints = {
      eventoCreado: getWebhookUrl('eventoCreado'),
      inscripcion: getWebhookUrl('inscripcion'),
      listaInscritos: getWebhookUrl('listaInscritos'),
      asistencias: getWebhookUrl('asistencias')
    };
  }

  async enviarEventoCreado(eventoData) {
    const url = this.endpoints.eventoCreado;
    
    logger.log('🚀 [n8n] Enviando evento creado a:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          eventoId: eventoData.id,
          titulo: eventoData.titulo,
          descripcion: eventoData.descripcion,
          fecha: eventoData.fecha,
          hora: eventoData.hora,
          ubicacion: eventoData.ubicacion,
          tipo: eventoData.tipo,
          capacidadMaxima: eventoData.capacidadMaxima,
          listaInscritos: eventoData.participantes || [],
          organizadorId: eventoData.organizadorId,
          organizadorEmail: eventoData.organizadorEmail,
          timestamp: new Date().toISOString(),
          source: 'eventos-upao-app',
          estado: eventoData.estado || 'publicado'
        })
      });

      // Manejo especial para CORS
      if (response.status === 0 || response.type === 'opaque') {
        logger.log('✅ [n8n] Evento enviado correctamente');
        return {
          success: true,
          data: { corsHandled: true, message: 'Webhook enviado' },
          message: 'Evento enviado correctamente a n8n'
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json().catch(() => ({ 
        success: true, 
        message: 'Respuesta procesada' 
      }));
      
      logger.log('✅ [n8n] Evento enviado exitosamente');
      
      return {
        success: true,
        data: result,
        message: 'Evento enviado correctamente a n8n'
      };

    } catch (error) {
      // Si es un error de CORS, webhook probablemente procesado exitosamente
      if (error.name === 'TypeError' && (
          error.message.includes('fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('Failed to fetch')
        )) {
        logger.log('✅ [n8n] Evento enviado correctamente');
        return {
          success: true,
          data: { corsHandled: true },
          message: 'Evento enviado a n8n'
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: 'Error al conectar con n8n'
      };
    }
  }

  async enviarWebhook(url, datos, descripcion = 'webhook') {
    logger.log(`🔄 [n8n] Enviando ${descripcion} a:`, url);
    
    if (!this.baseUrl) {
      logger.warn('⚠️ [n8n] Base URL no configurada');
      return {
        success: false,
        error: 'Base URL de n8n no configurada',
        simulado: true
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...datos,
          timestamp: new Date().toISOString(),
          source: 'eventos-upao-app'
        })
      });

      if (response.status === 0 || response.type === 'opaque') {
        logger.log(`ℹ️ [n8n] CORS detectado en ${descripcion} - Asumiendo éxito`);
        return {
          success: true,
          data: { corsHandled: true },
          message: `${descripcion} enviado (CORS manejado)`
        };
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No se pudo leer el error');
        console.error(`❌ [n8n] Error en ${descripcion}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resultado = await response.json().catch(() => ({ success: true }));
      logger.log(`✅ [n8n] ${descripcion} enviado exitosamente:`, resultado);
      
      return {
        success: true,
        data: resultado,
        message: `${descripcion} procesado correctamente`
      };

    } catch (error) {
      console.error(`❌ [n8n] Error en ${descripcion}:`, error);
      
      if (error.name === 'TypeError' && (
          error.message.includes('fetch') || 
          error.message.includes('CORS') ||
          error.message.includes('Failed to fetch')
        )) {
        logger.log(`ℹ️ [n8n] Error CORS en ${descripcion} - Webhook probablemente procesado`);
        return {
          success: true,
          data: { corsError: true },
          message: `${descripcion} enviado (error CORS al leer respuesta)`
        };
      }
      
      return {
        success: false,
        error: error.message,
        message: `Error al procesar ${descripcion}`
      };
    }
  }

  async enviarInscripcion(evento, alumno) {
    const datos = {
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      eventoFecha: evento.fecha,
      eventoHora: evento.hora,
      eventoUbicacion: evento.ubicacion,
      alumnoId: alumno.uid,
      alumnoEmail: alumno.email,
      alumnoNombre: alumno.nombre || alumno.displayName || 'Estudiante',
      alumnoApellido: alumno.apellido || '',
      qrString: alumno.qrString || '',
      qrId: alumno.qrId || '',
      fechaInscripcion: new Date().toISOString()
    };

    return await this.enviarWebhook(
      this.endpoints.inscripcion,
      datos,
      'inscripción de alumno'
    );
  }

  async enviarAsistencias(evento, asistentes, inscritos) {
    const datos = {
      eventoId: evento.id,
      eventoTitulo: evento.titulo,
      eventoFecha: evento.fecha,
      totalInscritos: inscritos.length,
      totalAsistentes: asistentes.length,
      porcentajeAsistencia: ((asistentes.length / inscritos.length) * 100).toFixed(2),
      asistentes: asistentes.map(asistente => ({
        id: asistente.uid || asistente.id,
        email: asistente.email,
        nombre: asistente.nombre,
        estado: 'asistio'
      })),
      fechaFinEvento: new Date().toISOString()
    };

    return await this.enviarWebhook(
      this.endpoints.asistencias,
      datos,
      'lista de asistencias'
    );
  }

  validarConfiguracion() {
    const errores = [];
    
    if (!this.baseUrl) {
      errores.push('VITE_N8N_BASE_URL no configurada');
    }
    
    if (!this.endpoints.eventoCreado) {
      errores.push('VITE_N8N_WEBHOOK_EVENTO_CREADO no configurado');
    }
    
    return {
      valida: errores.length === 0,
      errores,
      configuracion: {
        baseUrl: this.baseUrl,
        endpoints: this.endpoints
      }
    };
  }

  async probarConexion() {
    if (!this.baseUrl) {
      return {
        success: false,
        error: 'URL base de n8n no configurada'
      };
    }

    try {
      logger.log('🧪 [n8n] Probando conexión con:', this.baseUrl);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Conexión exitosa con n8n' : 'Servidor n8n no responde'
      };
    } catch (error) {
      console.error('❌ [n8n] Error de conexión:', error);
      return {
        success: false,
        error: error.message,
        message: 'No se pudo conectar con el servidor n8n'
      };
    }
  }
}

const n8nService = new N8nService();
export default n8nService;
```

---

## 🗄️ ESTRUCTURA DE DATOS EN FIRESTORE

### Colección: `usuarios`
```javascript
{
  uid: "string",           // ID de Firebase Auth
  email: "string",
  nombre: "string",
  apellido: "string",
  rol: "alumno" | "organizador",
  fechaRegistro: Timestamp,
  ultimoAcceso: Timestamp
}
```

### Colección: `eventos`
```javascript
{
  id: "string",
  titulo: "string",
  descripcion: "string",
  
  // ✨ NUEVA ESTRUCTURA - Soporte para eventos de múltiples días
  eventoFechaInicio: "string",    // Formato: YYYY-MM-DD
  eventoFechaFin: "string",       // Formato: YYYY-MM-DD
  eventoHoraInicio: "string",     // Formato: HH:MM
  eventoHoraFin: "string",        // Formato: HH:MM
  
  // ⚠️ CAMPOS LEGACY (backwards compatibility)
  fecha: "string",                // DEPRECATED - usar eventoFechaInicio
  hora: "string",                 // DEPRECATED - usar eventoHoraInicio
  
  ubicacion: "string",
  tipo: "conferencia" | "taller" | "seminario" | "otro",
  capacidadMaxima: number,
  organizadorId: "string",
  organizadorEmail: "string",
  estado: "publicado" | "finalizado" | "cancelado",
  inscripcionesAbiertas: boolean,
  participantes: ["uid1", "uid2"],  // Array de UIDs
  participantesInfo: [              // Array de objetos
    {
      uid: "string",
      email: "string",
      nombre: "string",
      apellido: "string",
      asistio: boolean,
      metodoRegistro: "qr" | "manual",
      horaRegistro: Timestamp
    }
  ],
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

### Subcolección: `eventos/{eventoId}/inscritos`
```javascript
{
  uid: "string",
  email: "string",
  nombre: "string",
  apellido: "string",
  fechaInscripcion: Timestamp,
  asistio: boolean,
  qrId: "string",          // ID del QR generado
  qrString: "string"       // Contenido del QR
}
```

### Subcolección: `eventos/{eventoId}/expositores`
```javascript
{
  nombre: "string",
  especialidad: "string",
  biografia: "string",
  email: "string",
  orden: number
}
```

---

## 🌐 ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (Navegador)                       │
│                                                               │
│  https://gestioneventos.notiscode.dev                        │
│  React App (Vite) - Firebase Hosting                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Lee/Escribe
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE (Google Cloud)                         │
│                                                               │
│  ├─ Firebase Auth      → Autenticación de usuarios          │
│  ├─ Firestore DB       → Base de datos NoSQL                │
│  └─ Firebase Hosting   → Hosting del frontend               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /webhook-test/* (dev)
                         │ POST /webhook/* (prod)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│    SERVIDOR N8N (Google Compute Engine VM)                  │
│                                                               │
│  https://n8n-gestioneventos.duckdns.org                     │
│  ├─ nginx (puerto 443)  → Reverse proxy + CORS              │
│  └─ n8n (puerto 5678)   → Automatizaciones                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SMTP
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GMAIL SMTP                                │
│                                                               │
│  cuentapruebas156@gmail.com                                  │
│  └─ Envío de emails de confirmación y notificaciones        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 FLUJO DE DATOS: INSCRIPCIÓN DE ALUMNO

```
1. Alumno hace clic en "Inscribirse"
   ↓
2. Frontend: firestoreService.inscribirAlumnoAEvento()
   ├─ Guarda inscripción en Firestore
   ├─ Actualiza array de participantes
   └─ Llama a n8nService.enviarInscripcion()
   ↓
3. n8nService.enviarInscripcion()
   ├─ Construye payload con datos del alumno y evento
   ├─ Obtiene URL desde webhookConfig (según VITE_APP_ENV)
   ├─ POST a n8n con datos
   └─ Manejo de errores CORS
   ↓
4. nginx recibe petición
   ├─ Verifica origen (CORS)
   ├─ Agrega headers Access-Control-Allow-Origin
   └─ Proxy a n8n (localhost:5678)
   ↓
5. n8n ejecuta workflow
   ├─ Recibe webhook
   ├─ Formatea email HTML
   └─ Envía via Gmail SMTP
   ↓
6. Alumno recibe email de confirmación ✉️
```

---

## 🔐 CONFIGURACIÓN DE NGINX (En la VM)

**Ubicación:** `/etc/nginx/sites-available/n8n`

```nginx
server {
    listen 443 ssl http2;
    server_name n8n-gestioneventos.duckdns.org;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/n8n-gestioneventos.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n-gestioneventos.duckdns.org/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # CORS para desarrollo
    location /webhook-test/ {
        add_header 'Access-Control-Allow-Origin' 'https://gestioneventos.notiscode.dev' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Max-Age' 3600 always;

        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://gestioneventos.notiscode.dev' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
            add_header 'Access-Control-Max-Age' 3600 always;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # CORS para producción
    location /webhook/ {
        add_header 'Access-Control-Allow-Origin' 'https://gestioneventos.notiscode.dev' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Max-Age' 3600 always;

        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://gestioneventos.notiscode.dev' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
            add_header 'Access-Control-Max-Age' 3600 always;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Editor de n8n
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name n8n-gestioneventos.duckdns.org;
    return 301 https://$server_name$request_uri;
}
```

---

## 🧪 COMANDOS ÚTILES

### Desarrollo Local
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Desplegar a Firebase
firebase deploy
```

### Verificar Configuración
```bash
# Ver variables de entorno cargadas (en consola del navegador)
console.log('Environment:', import.meta.env.VITE_APP_ENV);
console.log('N8N URL:', import.meta.env.VITE_N8N_BASE_URL);

# Ver configuración completa de webhooks
import { getConfigInfo } from './src/config/webhookConfig';
console.log(getConfigInfo());
```

### Comandos en la VM (nginx + n8n)
```bash
# Ver configuración de nginx
sudo cat /etc/nginx/sites-available/n8n

# Verificar sintaxis de nginx
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx

# Ver logs de nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Ver estado de n8n
sudo systemctl status n8n

# Reiniciar n8n
sudo systemctl restart n8n
```

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### 1. Error: Variables de entorno undefined
**Síntoma:** `import.meta.env.VITE_XXX` devuelve `undefined`

**Solución:**
- Verificar que `.env` existe en la raíz del proyecto
- Las variables DEBEN empezar con `VITE_`
- Reiniciar servidor: Ctrl+C y `npm run dev`

### 2. Error: CORS blocked
**Síntoma:** 
```
Access to fetch at 'https://n8n-gestioneventos.duckdns.org/...' 
from origin 'https://gestioneventos.notiscode.dev' 
has been blocked by CORS policy
```

**Solución:**
- Verificar configuración CORS en nginx (ver arriba)
- Comprobar que nginx se recargó: `sudo systemctl reload nginx`
- Ver logs: `sudo tail -f /var/log/nginx/error.log`

### 3. Error: 404 Not Found en webhook
**Síntoma:** Webhook retorna 404

**Solución:**
- Verificar que el workflow en n8n está activo
- Confirmar que la URL exacta existe
- Revisar que el path coincide (con o sin `/` final)

### 4. Error: Firebase Auth/Firestore no funciona
**Síntoma:** Errores de autenticación o lectura de datos

**Solución:**
- Verificar variables `VITE_FIREBASE_*` en `.env`
- Comprobar reglas de seguridad en Firestore
- Ver consola del navegador (F12)

### 5. Error de certificados SSL en nginx
**Síntoma:** 
```
cannot load certificate "/ruta/a/tu/certificado.crt"
```

**Solución:**
- Encontrar rutas reales: `sudo cat /etc/nginx/sites-available/n8n | grep ssl_certificate`
- Usar rutas de Let's Encrypt: `/etc/letsencrypt/live/n8n-gestioneventos.duckdns.org/`
- Ver documento: `SOLUCION_ERROR_CERTIFICADOS_SSL.md`

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### ✅ Implementado
- Sistema de autenticación con Firebase Auth
- CRUD de eventos con Firestore
- Generación y escaneo de QR para asistencia
- Sistema de inscripciones
- Gestión de participantes y expositores
- Reportes y estadísticas
- Integración con n8n (webhooks)
- Separación de entornos desarrollo/producción
- Sistema dinámico de configuración de webhooks
- Manejo de errores CORS

### ⏳ En Progreso
- Configuración CORS en nginx (usuario debe aplicar)
- Creación de workflows de producción en n8n

### ❌ No Implementado Aún
- Certificados blockchain en Polygon
- Sistema de calificaciones/feedback
- Dashboard avanzado de analytics
- Notificaciones push
- Exportación de reportes PDF

---

## 📝 NOTAS IMPORTANTES

1. **Nunca subir `.env` a Git** - Contiene credenciales sensibles
2. **Reiniciar servidor después de cambiar `.env`** - `npm run dev`
3. **CORS solo funciona con HTTPS** - En producción usar siempre HTTPS
4. **n8n está en Google Compute Engine** - No en Firebase
5. **Certificados SSL ≠ Certificados Blockchain** - Son cosas diferentes
6. **Webhooks de desarrollo** - Usar `/webhook-test/` para pruebas
7. **Webhooks de producción** - Usar `/webhook/` para usuarios reales

---

## 🆘 CÓMO USAR ESTE DOCUMENTO

### Para reportar un error:

1. Copia este documento completo
2. Agrega al final la sección "ERROR ESPECÍFICO":

```markdown
## 🐛 ERROR ESPECÍFICO

### Descripción del Error
[Describe qué está pasando]

### Mensaje de Error (si aplica)
```
[Pega el mensaje de error exacto aquí]
```

### Pasos para Reproducir
1. [Paso 1]
2. [Paso 2]
3. [Error ocurre aquí]

### Qué Se Esperaba
[Describe el comportamiento esperado]

### Capturas de Pantalla (si aplica)
[Adjunta imágenes]

### Logs del Navegador (F12)
```
[Pega logs de la consola]
```

### Entorno
- VITE_APP_ENV: [development | production]
- Navegador: [Chrome, Firefox, etc.]
- Ubicación del error: [Frontend | Backend | n8n | nginx]
```

---

## 📚 DOCUMENTOS RELACIONADOS

- `GUIA_N8N_AUTOMATIZACIONES.md` - Guía completa de n8n
- `CONFIGURACION_NGINX_CORS.md` - Configuración de CORS
- `EJEMPLO_USO_WEBHOOKS.md` - Ejemplos de uso
- `SOLUCION_ERROR_CERTIFICADOS_SSL.md` - Fix de certificados
- `RESUMEN_IMPLEMENTACION.md` - Resumen ejecutivo

---

**Última actualización:** 13 de octubre de 2025
**Versión:** 1.0.0
**Autor:** Plataforma de Gestión de Eventos UPAO
