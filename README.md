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



<div align="center">



</div>+ Vite


