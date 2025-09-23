# 🎓 UPAO Events - Plataforma de Gestión de Eventos Académicos

> **Sistema integral para la gestión y participación en eventos académicos de la Universidad Privada Antenor Orrego**

[![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.3.0-orange?logo=firebase)](https://firebase.google.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-purple?logo=bootstrap)](https://getbootstrap.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.6-green?logo=vite)](https://vitejs.dev/)

---

## 📋 Tabla de Contenidos

- [🎯 Descripción del Proyecto](#-descripción-del-proyecto)
- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [🚀 Instalación y Configuración](#-instalación-y-configuración)
- [📱 Uso de la Aplicación](#-uso-de-la-aplicación)
- [🏗️ Arquitectura del Proyecto](#️-arquitectura-del-proyecto)
- [🔐 Configuración de Firebase](#-configuración-de-firebase)
- [📊 Funcionalidades por Rol](#-funcionalidades-por-rol)
- [🎨 Diseño Responsive](#-diseño-responsive)
- [🧪 Testing y Validaciones](#-testing-y-validaciones)
- [📈 Roadmap](#-roadmap)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)

---

## 🎯 Descripción del Proyecto

**UPAO Events** es una plataforma web moderna desarrollada como proyecto de tesis para automatizar la gestión de eventos académicos en la Universidad Privada Antenor Orrego. La aplicación permite a organizadores crear y gestionar eventos, mientras que los estudiantes pueden explorar y registrarse en actividades de su interés.

### 🎓 Contexto Académico
- **Universidad**: Universidad Privada Antenor Orrego (UPAO)
- **Tipo**: Proyecto de Tesis de Ingeniería
- **Objetivo**: Digitalizar y optimizar la gestión de eventos académicos
- **Impacto**: Mejorar la participación estudiantil y eficiencia administrativa

---

## ✨ Características Principales

### 🔐 **Sistema de Autenticación Completo**
- Registro con validación de email obligatoria
- Verificación por correo electrónico
- Contraseñas seguras con validación en tiempo real
- Gestión de roles (Organizador/Estudiante)
- Toggle de visibilidad de contraseñas

### 🏠 **Dashboard para Organizadores**
- Panel de control con estadísticas en tiempo real
- Gestión CRUD completa de eventos
- Formularios dinámicos con validaciones avanzadas
- Vista previa y edición de eventos
- Control de estados (Borrador/Publicado)

### 🎓 **Portal para Estudiantes**
- Exploración de eventos disponibles
- Información detallada de cada evento
- Sistema de inscripción (en desarrollo)
- Seguimiento de participaciones

### 📱 **Diseño Responsive**
- Optimizado para móvil, tablet y desktop
- Bootstrap 5 con diseño mobile-first
- Navegación adaptativa con menú hamburguesa
- Cards y formularios responsivos

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 19.1.1** - Framework principal
- **Vite 7.1.6** - Build tool y desarrollo
- **Bootstrap 5.3.8** - Framework CSS responsive
- **JavaScript ES6+** - Lenguaje de programación

### **Backend & Base de Datos**
- **Firebase Auth** - Autenticación de usuarios
- **Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Hosting** - Alojamiento web (opcional)

### **Herramientas de Desarrollo**
- **ESLint** - Linting y calidad de código
- **Git** - Control de versiones
- **npm** - Gestión de dependencias

---

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js (v18 o superior)
- npm o yarn
- Cuenta de Firebase
- Git

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/PlataformaWebParaGestionDeEventos/plataforma_gestion_eventos.git
cd gestion_eventosV1
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Firebase**
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Email/Password)
3. Crear base de datos Firestore
4. Copiar configuración en `src/credenciales.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};

const appFirebase = initializeApp(firebaseConfig);
export const db = getFirestore(appFirebase);
export default appFirebase;
```

### **4. Configurar Reglas de Firestore**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Eventos: solo organizadores pueden crear/editar
    match /eventos/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.organizadorId;
      allow create: if request.auth != null;
    }
    
    // Usuarios: solo el propietario puede acceder
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### **5. Ejecutar la Aplicación**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 📱 Uso de la Aplicación

### **👤 Para Organizadores**

1. **Registro/Inicio de Sesión**
   - Registrarse con email @gmail.com
   - Verificar email recibido
   - Iniciar sesión

2. **Gestión de Eventos**
   - Acceder al Dashboard
   - Crear nuevo evento con formulario completo
   - Editar eventos existentes
   - Publicar o mantener como borrador
   - Ver estadísticas en tiempo real

3. **Validaciones Automáticas**
   - Fechas futuras obligatorias
   - Capacidad entre 1-1000 personas
   - Detección de conflictos de horario

### **🎓 Para Estudiantes**

1. **Exploración de Eventos**
   - Ver eventos publicados
   - Información detallada (fecha, ubicación, capacidad)
   - Estado de disponibilidad

2. **Inscripción** (Próximamente)
   - Registro en eventos de interés
   - Seguimiento de inscripciones
   - Notificaciones de eventos

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/
│   ├── Login.jsx              # Autenticación y registro
│   ├── HomeOrganizador.jsx    # Dashboard organizadores
│   └── HomeAlumno.jsx         # Portal estudiantes
├── assets/
│   ├── fondo.jpg              # Imagen de fondo
│   └── logo_upao.jpeg         # Logo institucional
├── App.jsx                    # Componente principal y routing
├── App.css                    # Estilos globales mínimos
├── index.css                  # Estilos base
├── main.jsx                   # Punto de entrada
└── credenciales.js            # Configuración Firebase
```

### **Flujo de Datos**
1. **Autenticación**: Firebase Auth → Estado local
2. **Datos**: Firestore → Componentes React
3. **Estado**: React Hooks (useState, useEffect)
4. **Routing**: Condicional basado en roles

---

## 🔐 Configuración de Firebase

### **Collections de Firestore**

#### **`eventos`**
```javascript
{
  id: "auto-generated",
  titulo: "string",
  descripcion: "string",
  fecha: "YYYY-MM-DD",
  hora: "HH:MM",
  ubicacion: "string",
  capacidadMaxima: number,
  tipo: "conferencia|seminario|taller|curso|charla",
  estado: "borrador|publicado",
  organizadorId: "string",
  organizadorEmail: "string",
  fechaCreacion: timestamp,
  fechaActualizacion: timestamp,
  participantes: array,
  asistentes: array
}
```

#### **`users`**
```javascript
{
  uid: "string",
  nombre: "string",
  apellido: "string",
  email: "string",
  role: "alumno|organizador",
  fechaRegistro: timestamp,
  emailVerificado: boolean
}
```

---

## 📊 Funcionalidades por Rol

### **🔧 Organizadores**
| Función | Descripción | Estado |
|---------|-------------|--------|
| Crear Eventos | Formulario completo con validaciones | ✅ Completo |
| Editar Eventos | Modificación de eventos existentes | ✅ Completo |
| Eliminar Eventos | Borrado con confirmación | ✅ Completo |
| Dashboard | Estadísticas y métricas | ✅ Completo |
| Validaciones | Fechas, capacidad, conflictos | ✅ Completo |
| Vista Participantes | Gestión de inscritos | 🚧 Pendiente |

### **🎓 Estudiantes**
| Función | Descripción | Estado |
|---------|-------------|--------|
| Ver Eventos | Lista de eventos disponibles | ✅ Completo |
| Detalles | Información completa de eventos | ✅ Completo |
| Inscripción | Registro en eventos | 🚧 Pendiente |
| Mis Eventos | Seguimiento de participaciones | 🚧 Pendiente |
| Notificaciones | Alertas de eventos | 🚧 Pendiente |

---

## 🎨 Diseño Responsive

### **Breakpoints Bootstrap 5**
- **xs**: < 576px (Móviles pequeños)
- **sm**: ≥ 576px (Móviles grandes)
- **md**: ≥ 768px (Tablets)
- **lg**: ≥ 992px (Laptops)
- **xl**: ≥ 1200px (Desktops)
- **xxl**: ≥ 1400px (Pantallas grandes)

### **Componentes Responsive**
- ✅ Navbar colapsable con hamburguesa
- ✅ Grid adaptativo de eventos
- ✅ Formularios mobile-first
- ✅ Cards responsivas
- ✅ Botones touch-friendly

---

## 🧪 Testing y Validaciones

### **Validaciones Implementadas**
- ✅ Email con formato @gmail.com
- ✅ Contraseñas seguras (8+ chars, mayús, minús, números, símbolos)
- ✅ Fechas futuras obligatorias
- ✅ Capacidad 1-1000 participantes
- ✅ Títulos 10-100 caracteres
- ✅ Descripciones 20-500 caracteres
- ✅ Detección de conflictos de horario

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
- [ ] Calificación de eventos
- [ ] Certificados digitales
- [ ] Integración con calendario
- [ ] App móvil nativa

---

## 🤝 Contribución

### **Para Desarrolladores**
1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### **Estándares de Código**
- Usar ESLint para calidad de código
- Componentes funcionales con hooks
- Nomenclatura en español para el dominio
- Comentarios descriptivos
- Bootstrap utilities sobre CSS custom

---

## 👨‍💻 Autor

**Desarrollo de Tesis - UPAO**
- **Universidad**: Universidad Privada Antenor Orrego
- **Programa**: Ingeniería de Sistemas
- **Año**: 2025

---

## 📄 Licencia

Este proyecto es desarrollado como trabajo de tesis académica para la Universidad Privada Antenor Orrego. Todos los derechos reservados.

---

## 🙏 Agradecimientos

- Universidad Privada Antenor Orrego por el apoyo institucional
- Comunidad de React y Firebase por la documentación
- Bootstrap team por el framework CSS
- Todos los beta testers que probaron la plataforma

---

## 📞 Soporte

Para dudas o problemas:
- 📧 Contacto institucional UPAO
- 🐛 Issues en GitHub
- 📖 Documentación oficial de las tecnologías utilizadas

---

<div align="center">

**🎓 Hecho con ❤️ para la comunidad académica UPAO**

[![UPAO](https://img.shields.io/badge/UPAO-Universidad%20Privada%20Antenor%20Orrego-blue)](https://www.upao.edu.pe/)

</div>+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
