# 🎓 Plataforma de Gestión de Eventos Académicos

> **Sistema integral para la gestión y participación en eventos académicos de la Universidad Privada Antenor Orrego**

---

## 📋 Tabla de Contenidos

- [🎯 Descripción del Proyecto](#-descripción-del-proyecto)
- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [📱 Uso de la Aplicación](#-uso-de-la-aplicación)
- [🏗️ Arquitectura del Proyecto](#️-arquitectura-del-proyecto)
- [🧪 Testing y Validaciones](#-testing-y-validaciones)
- [📈 Roadmap](#-roadmap)

---

## 🎯 Descripción del Proyecto

**Plataforma web moderna desarrollada como proyecto de tesis para automatizar la gestión de eventos académicos en la Universidad Privada Antenor Orrego. La aplicación permite a organizadores crear y gestionar eventos, mientras que los estudiantes pueden explorar y registrarse en actividades de su interés.

### 🎓 Contexto Académico
- **Universidad**: Universidad Privada Antenor Orrego (UPAO)
- **Tipo**: Proyecto de Tesis de Ingeniería
- **Objetivo**: Digitalizar y optimizar la gestión de eventos académicos
- **Impacto**: Mejorar la participación estudiantil y eficiencia administrativa

---

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- ✅ **Login/registro con dominios permitidos** (gmail.com, hotmail.com, upao.edu.pe)
- ✅ **Lista blanca de dominios** - Solo emails institucionales y proveedores confiables
- ✅ Verificación por email obligatoria
- ✅ Firebase Authentication con gestión de roles (Alumno / Organizador)
- ✅ **Route Guards protegiendo rutas** por autenticación y rol
- ✅ Reglas de seguridad con Firebase Security Rules actualizadas

### 🏠 Panel de Organizador
- ✅ Dashboard de eventos con estado (borrador/publicado)
- ✅ CRUD de eventos académicos
- ✅ **Rangos de fecha y hora** (eventos de uno o múltiples días)
- ✅ **Gestión de múltiples expositores** con horarios específicos
- ✅ **Controles manuales reversibles** (cerrar/reabrir inscripciones y asistencias)
- ✅ **Modos de asistencia flexibles**: por día o por ponente
- ✅ Validación de horarios (06:00 AM - 11:00 PM)
- ✅ Validación de aforos (1-1000 participantes)
- ✅ Detección de conflictos de horario

### 👥 Sistema de Expositores Expandido
- ✅ **Tabla de expositores obligatoria** (mínimo 1, máximo 20)
- ✅ **Campos completos por expositor**:
  - 📅 Día específico de exposición (date picker)
  - ⏰ Hora de inicio (time picker)
  - ⏱️ Duración en minutos (15-480 min)
  - ☕ Indicador de break (checkbox)
- ✅ Gestión de horarios por expositor
- ✅ Temas específicos por exposición
- ✅ Validación de horas únicas (sin duplicados)
- ✅ Horas de expositores dentro del rango del evento
- ✅ **Datos optimizados para generación de flyers con n8n**

### 🎓 Portal del Estudiante
- ✅ Navegación de eventos abiertos
- ✅ Registro a eventos con control de cupo
- ✅ Vista detallada de eventos con cronograma de expositores
- ✅ Seguimiento de inscripciones

### 🧩 Diseño Modular y Responsive
- ✅ Bootstrap 5 + CSS personalizado
- ✅ Componentes reutilizables tipo Atomic Design
- ✅ Optimizado para desktop y móvil
- ✅ Interfaz intuitiva con validaciones en tiempo real

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 19.1.1** - Framework principal
- **Vite 7.1.6** - Build tool y desarrollo
- **Bootstrap 5.3.8** - Framework CSS responsive
- **JavaScript ES6+** - Lenguaje de programación
- **Yup 1.6.0** - Validación de esquemas y formularios

### **Backend & Base de Datos**
- **Firebase Auth** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Security Rules** - Reglas de seguridad actualizadas
- **Firebase Hosting** - Alojamiento web (opcional)

### **Automatización**
- **n8n** - Automatización de workflows (emails, flyers, reportes)
- **Webhooks** - Integración en tiempo real con servicios externos

### **Herramientas de Desarrollo**
- **ESLint** - Linting y calidad de código
- **JSDoc** - Documentación inline de código
- **Git** - Control de versiones
- **npm** - Gestión de dependencias

---

## 🆕 Nuevas Características (v2.0.0)

### 🎯 Modos de Asistencia Flexibles

La plataforma ahora soporta **dos modos de registro de asistencia**:

#### 📅 **Por Día** (por_dia)
- Genera un QR único por cada día del evento
- Ideal para eventos multi-día donde la asistencia se registra diariamente
- Los alumnos escanean un QR diferente cada día

#### 🎤 **Por Ponente** (por_ponente)
- Genera un QR único por cada expositor/ponente
- Ideal para eventos con múltiples sesiones paralelas
- Permite tracking preciso de qué ponencias asistió cada alumno
- Los QR se generan basados en los expositores configurados

**Configuración:** Se selecciona al momento de crear el evento en el campo `modoAsistencia`.

### 🎛️ Controles Manuales Reversibles

Los organizadores ahora tienen **control total** sobre el flujo del evento:

| Acción | Descripción | Reversible |
|--------|-------------|------------|
| **Cerrar Inscripciones** | Impide nuevas inscripciones | ✅ Sí - Botón "Reabrir Inscripciones" |
| **Reabrir Inscripciones** | Permite inscripciones después de cerrar | ✅ Sí - Útil si se cerró por error |
| **Cerrar Asistencia** | Impide escaneo de QRs | ✅ Sí - Botón "Reabrir Asistencia" |
| **Reabrir Asistencia** | Reactiva escaneo de QRs | ✅ Sí - Para registros tardíos |

**Ubicación:** Botones disponibles en las tarjetas de eventos del Dashboard de Organizador.

### 📊 Modelo de Expositor Expandido

Cada expositor ahora incluye campos detallados para mejor gestión y automatización:

```javascript
{
  nombre: "Dr. Juan Pérez",           // Nombre completo
  correo: "jperez@upao.edu.pe",       // Email de contacto
  tema: "Inteligencia Artificial",    // Tema de la ponencia
  dia: "2025-11-15",                  // Día específico (YYYY-MM-DD)
  hora: "09:00",                      // Hora de inicio (HH:MM)
  duracion: 90,                       // Duración en minutos (15-480)
  break: true                         // ¿Incluye coffee break?
}
```

**Beneficios:**
- ✅ Generación automática de flyers con n8n usando estos datos
- ✅ Cronogramas detallados visibles para alumnos
- ✅ Validación automática de solapamientos de horarios
- ✅ Cálculo automático de breaks entre sesiones

### 🏗️ Arquitectura Mejorada

#### **Validación Centralizada con Yup**
- Esquemas de validación en `src/core/validation/eventoValidation.js`
- Validación consistente en cliente antes de enviar a Firebase
- Mensajes de error estandarizados y traducidos

#### **Configuración Centralizada**
- Todas las constantes en `src/config/constants.js` (185 líneas)
- Sin "números mágicos" en el código
- Fácil configuración de límites y valores por ambiente

#### **Route Guards**
- Componentes dedicados en `src/routes/ProtectedRoute.jsx`
- `ProtectedRoute` - Requiere autenticación
- `RoleBasedRoute` - Requiere rol específico (alumno/organizador)
- `PublicRoute` - Redirige si ya autenticado

#### **Documentación JSDoc**
- Servicios completamente documentados
- Hooks con ejemplos de uso
- Tipos de parámetros y retornos especificados

### 🔒 Reglas de Seguridad Actualizadas

Las Firebase Security Rules ahora validan:

```javascript
// Validación de expositor con nuevos campos
function isValidExpositor(expositor) {
  return expositor.dia matches '\\d{4}-\\d{2}-\\d{2}'  // YYYY-MM-DD
    && expositor.hora matches '\\d{2}:\\d{2}'          // HH:MM
    && expositor.duracion >= 15 && expositor.duracion <= 480
    && expositor.break is bool;
}

// Validación de modo de asistencia
function isValidModoAsistencia(modo) {
  return modo in ['por_dia', 'por_ponente'];
}

// Permisos para controles manuales
allow update: if isOwner() && 
  (onlyChanging(['inscripcionesAbiertas']) ||
   onlyChanging(['asistenciaAbierta']));
```

---


## 📱 Uso de la Aplicación

### **👤 Para Organizadores**

1. **Registro/Inicio de Sesión**
   - Registrarse con cualquier email válido
   - Verificar email recibido
   - Iniciar sesión

2. **Gestión de Eventos**
   - Acceder al Dashboard
   - Crear nuevo evento con formulario completo:
     * Rango de fechas (inicio - fin)
     * Rango de horarios (06:00 - 23:00)
     * Lista de expositores con cronograma
   - Editar eventos existentes
   - Publicar o mantener como borrador

3. **Gestión de Expositores**
   - Agregar expositor con nombre, hora y tema
   - Validación automática de horarios
   - Vista de cronograma ordenado
   - Eliminación de expositores

4. **Validaciones Automáticas**
   - Fechas futuras obligatorias
   - Capacidad entre 1-1000 personas
   - Horarios entre 06:00 AM y 11:00 PM
   - Mínimo 1 expositor por evento
   - Horas de expositores dentro del rango del evento
   - Detección de conflictos de horario

### **🎓 Para Estudiantes**

1. **Exploración de Eventos**
   - Ver eventos publicados
   - Información detallada (fecha, ubicación, capacidad)
   - Estado de disponibilidad

2. **Inscripción** 
   - Registro en eventos de interés
   - Seguimiento de inscripciones
   - Notificaciones de eventos

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── assets/                      # Imágenes e íconos
├── config/                      # Configuración centralizada
│   ├── constants.js            # Todas las constantes
│   ├── credenciales.js         # Firebase config
│   └── webhookConfig.js        # URLs de n8n
├── core/                        # Lógica de negocio y utilidades
│   ├── hooks/                  # Hooks personalizados con JSDoc
│   │   ├── useAuth.js          # Autenticación
│   │   ├── useEventosAlumno.js # Eventos del alumno
│   │   ├── useParticipantes.js # Gestión de participantes
│   │   └── useReportes.js      # Reportes y estadísticas
│   ├── utils/                  # Utilidades compartidas
│   │   ├── formatters.js       # Formateo de datos
│   │   ├── toastHelper.js      # Notificaciones
│   │   └── logger.js           # Sistema de logs
│   └── validation/             # Validación centralizada
│       └── eventoValidation.js # Esquemas Yup
├── services/                    # Servicios con JSDoc completo
│   ├── authService.js          # Autenticación Firebase
│   ├── firestoreService.js     # CRUD + Controles manuales
│   ├── n8nService.js           # Integración n8n
│   ├── qrService.js            # Generación y validación de QRs
│   └── reportesService.js      # Reportes y estadísticas
├── routes/                      # Routing y protección
│   ├── AppRouter.jsx           # Router principal con guards
│   └── ProtectedRoute.jsx      # Route Guards por rol
├── pages/                       # Vistas principales
│   ├── Login/
│   ├── LandingPage/
│   ├── HomeAlumno/
│   ├── HomeOrganizador/        # Con controles manuales
│   ├── DetalleEvento/
│   ├── MisEventos/
│   ├── GestionAsistencia/      # Escaneo y registro QR
│   ├── GestionParticipantes/   # Lista de inscritos
│   ├── Reportes/               # Dashboard de reportes
│   └── NotFound/
├── components/                  # Componentes reutilizables
│   ├── ExpositoresTable/       # Gestión de expositores
│   ├── GestionParticipantes/   # Tabla de participantes
│   ├── qr/                     # QRGenerator y QRScanner
│   ├── auth/                   # RecuperarContrasenaModal
│   └── layout/                 # Footer
├── styles/                      # Estilos globales
│   ├── index.css
│   ├── App.css
│   └── theme.css
├── App.jsx                      # Componente raíz
└── main.jsx                     # Punto de entrada Vite
```

### **Flujo de Datos**
1. **Autenticación**: Firebase Auth + Context API
2. **Acceso a datos**: servicios en `services/` con Firestore
3. **Gestión de estado**: React Hooks y Context
4. **Ruteo**: React Router DOM + protección según rol
---

## 🧪 Testing y Validaciones

### **Validaciones Implementadas con Yup**

#### **Evento**
- ✅ **Email válido** - Solo dominios permitidos: gmail.com, hotmail.com, upao.edu.pe
- ✅ **Prevención de correos temporales** - Lista blanca de dominios confiables
- ✅ Contraseñas seguras (8+ chars, mayús, minús, números, símbolos)
- ✅ Fechas futuras obligatorias
- ✅ FechaFin >= FechaInicio
- ✅ Horarios entre 06:00 AM y 11:00 PM
- ✅ HoraFin > HoraInicio (mismo día)
- ✅ Capacidad 1-1000 participantes
- ✅ Títulos 10-100 caracteres
- ✅ Descripciones 20-500 caracteres
- ✅ Mínimo 1 expositor, máximo 20
- ✅ **Modo de asistencia válido** ('por_dia' o 'por_ponente')

#### **Expositor** 🆕
- ✅ Nombre: 2-200 caracteres
- ✅ Correo: formato email válido (5-200 chars)
- ✅ Tema: 3-300 caracteres
- ✅ **Día: formato YYYY-MM-DD** (dentro del rango del evento)
- ✅ **Hora: formato HH:MM** (dentro del horario del evento)
- ✅ **Duración: 15-480 minutos** (0.25 - 8 horas)
- ✅ **Break: boolean** (true/false)
- ✅ Horas de expositores únicas (no duplicados)
- ✅ **Detección de solapamientos** de horarios por día
- ✅ Horas de expositores dentro del rango del evento
- ✅ Detección de conflictos de horario con rangos de fechas

#### **Firebase Security Rules**
- ✅ Validación en servidor de todos los campos
- ✅ Protección contra escritura no autorizada
- ✅ Validación de permisos de controles manuales
- ✅ Verificación de estructura de expositores completa

### **Testing Manual**
- ✅ Registro y verificación de email
- ✅ Creación y edición de eventos
- ✅ Responsive en múltiples dispositivos
- ✅ Validaciones de formularios
- ✅ Navegación entre vistas

---

## 📈 Roadmap

### **🚧 Próximas Funcionalidades**
- [ ] **Sistema de Inscripciones**
  - Registro real de estudiantes
  - Confirmación por email
  - Lista de espera

- [ ] **Gestión de Participantes**
  - Vista detallada de inscritos
  - Control de asistencia
  - Exportación de listas

- [ ] **Reportes y Analytics**
  - Estadísticas avanzadas
  - Gráficos de participación
  - Exportación de reportes

- [ ] **Notificaciones**
  - Alertas de nuevos eventos
  - Recordatorios automáticos
  - Confirmaciones de inscripción

- [ ] **Búsqueda y Filtros**
  - Filtros por tipo, fecha, ubicación
  - Búsqueda de texto
  - Ordenamiento personalizado

### **🔮 Funcionalidades Futuras**
- [ ] Chat en tiempo real
- [ ] Búsqueda y filtros por fecha, programa, tipo
- [ ] Panel de métricas para autoridades
- [ ] Emisión de certificados verificables con Blockchain
- [ ] Integración con calendario

---

## 🤖 Automatizaciones con n8n

Esta plataforma incluye integración con **n8n** para automatizar procesos:

### **📚 Documentación de Automatizaciones**

| Archivo | Descripción | Para Quién |
|---------|-------------|-----------|
| **[PRODUCCION_N8N.md](./PRODUCCION_N8N.md)** | 🎉 n8n en producción - Pruebas | ⚡ EMPEZAR AQUÍ |
| **[INICIO_RAPIDO_N8N.md](./INICIO_RAPIDO_N8N.md)** | Configuración local en 10 minutos | 🏠 Desarrollo local |
| **[GUIA_N8N_AUTOMATIZACIONES.md](./GUIA_N8N_AUTOMATIZACIONES.md)** | Guía completa y detallada | 📖 Referencia completa |
| **[ESTRUCTURA_DATOS_N8N.md](./ESTRUCTURA_DATOS_N8N.md)** | Estructura de datos de webhooks | 🔍 Para desarrolladores |

### **🌐 Servidor n8n en Producción**

- **URL:** https://n8n-gestioneventos.duckdns.org
- **Estado:** ✅ Activo
- **Webhook:** `/webhook-test/inscripcion-confirmacion`

### **✅ Automatizaciones Implementadas**

- ✅ **Email de confirmación** al inscribirse a un evento
- ✅ **Notificación al organizador** cuando hay nueva inscripción
- ✅ **Integración automática** desde `firestoreService.js`
- ✅ **Manejo de errores CORS** implementado
- ✅ **Sistema de logging** con `logger.js`

### **📦 Archivos Clave**

```
src/services/n8nService.js      # Servicio de integración con n8n
src/services/firestoreService.js # Llamadas automáticas a n8n (líneas 50, 296)
.env.example                     # Variables de entorno necesarias
```

### **🚀 Inicio Rápido n8n**

```bash
# 1. Instalar n8n
npm install n8n -g

# 2. Crear archivo .env (copiar desde .env.example)
cp .env.example .env

# 3. Iniciar n8n
n8n start

# 4. Abrir navegador
http://localhost:5678
```

**Ver:** [INICIO_RAPIDO_N8N.md](./INICIO_RAPIDO_N8N.md) para pasos detallados.

---

<div align="center">

**Desarrollado con ❤️ para la Universidad Privada Antenor Orrego**

</div>