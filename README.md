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
- ✅ **Login/registro con cualquier correo electrónico** (gmail, hotmail, upao.edu.pe, etc.)
- ✅ Verificación por email obligatoria
- ✅ Firebase Authentication con gestión de roles (Alumno / Organizador)
- ✅ Reglas de seguridad con Firebase Security Rules

### 🏠 Panel de Organizador
- ✅ Dashboard de eventos con estado (borrador/publicado)
- ✅ CRUD de eventos académicos
- ✅ **Rangos de fecha y hora** (eventos de uno o múltiples días)
- ✅ **Gestión de múltiples expositores** con horarios específicos
- ✅ Validación de horarios (06:00 AM - 11:00 PM)
- ✅ Validación de aforos (1-1000 participantes)
- ✅ Detección de conflictos de horario

### 👥 Sistema de Expositores
- ✅ **Tabla de expositores obligatoria** (mínimo 1, máximo 20)
- ✅ Gestión de horarios por expositor
- ✅ Temas específicos por exposición
- ✅ Validación de horas únicas (sin duplicados)
- ✅ Horas de expositores dentro del rango del evento

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

### **Backend & Base de Datos**
- **Firebase Auth** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Hosting** - Alojamiento web (opcional)

### **Herramientas de Desarrollo**
- **ESLint** - Linting y calidad de código
- **Git** - Control de versiones
- **npm** - Gestión de dependencias

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
├── assets/ # Imágenes e íconos
├── config/ # Configuración de Firebase, credenciales y reglas
├── core/ # Contextos globales y hooks reutilizables
│ ├── hooks/
│ ├── contexts/
│ └── utils/
├── services/ # Servicios desacoplados: auth, firestore, certificados
├── routes/ # Routing central y rutas protegidas
├── pages/ # Vistas por ruta
│ ├── Login/
│ ├── LandingPage/
│ ├── HomeAlumno/
│ ├── HomeOrganizador/
│ └── NotFound/
├── components/ # Componentes reutilizables
│ ├── ui/ # Botones, inputs, tarjetas, etc.
│ └── layout/ # Navbar, Sidebar, Footer
├── styles/ # Estilos globales
│ ├── index.css
│ └── App.css
├── App.jsx # Componente raíz
└── main.jsx # Punto de entrada Vite
```

### **Flujo de Datos**
1. **Autenticación**: Firebase Auth + Context API
2. **Acceso a datos**: servicios en `services/` con Firestore
3. **Gestión de estado**: React Hooks y Context
4. **Ruteo**: React Router DOM + protección según rol
---

## 🧪 Testing y Validaciones

### **Validaciones Implementadas**
- ✅ Email válido (cualquier dominio)
- ✅ Contraseñas seguras (8+ chars, mayús, minús, números, símbolos)
- ✅ Fechas futuras obligatorias
- ✅ FechaFin >= FechaInicio
- ✅ Horarios entre 06:00 AM y 11:00 PM
- ✅ HoraFin > HoraInicio (mismo día)
- ✅ Capacidad 1-1000 participantes
- ✅ Títulos 10-100 caracteres
- ✅ Descripciones 20-500 caracteres
- ✅ Mínimo 1 expositor, máximo 20
- ✅ Horas de expositores únicas (no duplicados)
- ✅ Horas de expositores dentro del rango del evento
- ✅ Detección de conflictos de horario con rangos de fechas

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
- [ ] Recordatorios automáticos y notificaciones
- [ ] Panel de métricas para autoridades
- [ ] Emisión de certificados verificables con Polygon
- [ ] Integración con calendario

---



<div align="center">



</div>