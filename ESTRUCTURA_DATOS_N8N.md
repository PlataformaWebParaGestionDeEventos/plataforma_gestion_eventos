# 📊 Estructura de Datos - Webhooks n8n

Este documento describe la estructura exacta de los datos que tu aplicación envía a n8n.

---

## 🎯 **Webhook 1: Evento Creado**

**Endpoint:** `/webhook/evento-creado`  
**Llamado desde:** `firestoreService.crearEvento()` (línea 50)  
**Cuándo:** Inmediatamente después de crear un evento en Firestore

### **Payload:**

```json
{
  "eventoId": "abc123def456",
  "titulo": "Conferencia de Inteligencia Artificial",
  "descripcion": "Introducción a los conceptos básicos de IA",
  
  "eventoFechaInicio": "2025-10-15",
  "eventoFechaFin": "2025-10-15",
  "eventoHoraInicio": "10:00",
  "eventoHoraFin": "12:00",
  
  "fecha": "2025-10-15",
  "hora": "10:00",
  
  "ubicacion": "Auditorio Principal - Piso 3",
  "tipo": "conferencia",
  "capacidadMaxima": 100,
  "listaInscritos": [],
  
  "organizadorId": "org_xyz123",
  "organizadorEmail": "organizador@upao.edu.pe",
  
  "timestamp": "2025-01-10T15:30:00.000Z",
  "source": "eventos-upao-app",
  "estado": "publicado"
}
```

### **Campos Explicados:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `eventoId` | String | ID único de Firestore | `"abc123def456"` |
| `titulo` | String | Título del evento | `"Conferencia de IA"` |
| `descripcion` | String | Descripción completa | `"Introducción a..."` |
| `eventoFechaInicio` | String (ISO) | Fecha de inicio del evento | `"2025-10-15"` |
| `eventoFechaFin` | String (ISO) | Fecha de fin del evento | `"2025-10-15"` |
| `eventoHoraInicio` | String | Hora de inicio HH:MM | `"10:00"` |
| `eventoHoraFin` | String | Hora de fin HH:MM | `"12:00"` |
| `fecha` | String (ISO) | **⚠️ DEPRECATED** - Usar `eventoFechaInicio` | `"2025-10-15"` |
| `hora` | String | **⚠️ DEPRECATED** - Usar `eventoHoraInicio` | `"10:00"` o `"14:30"` |
| `ubicacion` | String | Lugar físico o virtual | `"Auditorio Principal"` |
| `tipo` | String | Categoría del evento | `"conferencia"`, `"taller"`, `"seminario"` |
| `capacidadMaxima` | Number | Cupo máximo | `100` |
| `listaInscritos` | Array | IDs de inscritos (vacío al crear) | `[]` |
| `organizadorId` | String | UID del organizador | `"org_xyz123"` |
| `organizadorEmail` | String | Email del organizador | `"org@upao.edu.pe"` |
| `timestamp` | String (ISO) | Fecha/hora de creación | `"2025-01-10T15:30:00.000Z"` |
| `source` | String | Origen del evento (siempre fijo) | `"eventos-upao-app"` |
| `estado` | String | Estado del evento | `"publicado"`, `"borrador"` |

### **Uso en n8n:**

```javascript
// Acceder a campos en nodos de n8n:
={{$json.eventoId}}
={{$json.titulo}}
={{$json.organizadorEmail}}
```

---

## 📧 **Webhook 2: Inscripción Confirmada**

**Endpoint:** `/webhook/inscripcion-confirmacion`  
**Llamado desde:** `firestoreService.inscribirAlumnoEvento()` (línea 296)  
**Cuándo:** Después de inscribir exitosamente a un alumno

### **Payload:**

```json
{
  "eventoId": "abc123def456",
  "eventoTitulo": "Conferencia de Inteligencia Artificial",
  "eventoDescripcion": "Introducción a los conceptos básicos de IA",
  "eventoTipo": "conferencia",
  "eventoUbicacion": "Auditorio Principal - Piso 3",
  
  "eventoFechaInicio": "2025-10-15",
  "eventoFechaFin": "2025-10-15",
  "eventoHoraInicio": "10:00",
  "eventoHoraFin": "12:00",
  
  "fecha": "2025-10-15",
  "hora": "10:00",
  
  "alumnoId": "user_xyz789",
  "alumnoEmail": "juan.perez@upao.edu.pe",
  "alumnoNombre": "Juan",
  "alumnoApellido": "Pérez",
  
  "qrString": "EVT-abc123-USER-xyz789-TOKEN-12345",
  "qrId": "qr_unique_id_67890",
  
  "fechaInscripcion": "2025-01-10T15:30:00.000Z",
  "timestamp": "2025-01-10T15:30:00.000Z",
  "source": "eventos-upao-app"
}
```

### **Campos Explicados:**

**Datos del Evento:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `eventoId` | String | ID del evento | `"abc123def456"` |
| `eventoTitulo` | String | Título del evento | `"Conferencia de IA"` |
| `eventoDescripcion` | String | Descripción completa | `"Introducción a..."` |
| `eventoTipo` | String | Categoría del evento | `"conferencia"`, `"taller"` |
| `eventoUbicacion` | String | Ubicación | `"Auditorio Principal"` |
| `eventoFechaInicio` | String (ISO) | Fecha de inicio | `"2025-10-15"` |
| `eventoFechaFin` | String (ISO) | Fecha de fin | `"2025-10-15"` |
| `eventoHoraInicio` | String | Hora de inicio HH:MM | `"10:00"` |
| `eventoHoraFin` | String | Hora de fin HH:MM | `"12:00"` |
| `fecha` | String (ISO) | **⚠️ DEPRECATED** - Usar `eventoFechaInicio` | `"2025-10-15"` |
| `hora` | String | **⚠️ DEPRECATED** - Usar `eventoHoraInicio` | `"10:00"` |

**Datos del Alumno:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `alumnoId` | String | UID de Firebase Auth | `"user_xyz789"` |
| `alumnoEmail` | String | Email institucional | `"juan.perez@upao.edu.pe"` |
| `alumnoNombre` | String | Primer nombre | `"Juan"` |
| `alumnoApellido` | String | Apellido(s) | `"Pérez"` o `"Pérez García"` |

**Datos del QR:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `qrString` | String | Código QR completo | `"EVT-abc123-USER-xyz789-TOKEN-12345"` |
| `qrId` | String | ID único del QR | `"qr_unique_id_67890"` |

**Metadata:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `fechaInscripcion` | String (ISO) | Fecha/hora de inscripción | `"2025-01-10T15:30:00.000Z"` |
| `timestamp` | String (ISO) | Timestamp del evento | `"2025-01-10T15:30:00.000Z"` |
| `source` | String | Origen (siempre fijo) | `"eventos-upao-app"` |

### **Uso en n8n:**

#### **Concatenar nombre completo:**
```javascript
={{$json.alumnoNombre}} ={{$json.alumnoApellido}}
// Resultado: "Juan Pérez"
```

#### **Formatear fecha legible:**
```javascript
// Usar los nuevos campos de fecha/hora
={{DateTime.fromISO($json.eventoFechaInicio).toFormat('dd/MM/yyyy')}}
// Resultado: "15/10/2025"

// Formatear rango de fechas
={{DateTime.fromISO($json.eventoFechaInicio).toFormat('dd/MM/yyyy')}} - ={{DateTime.fromISO($json.eventoFechaFin).toFormat('dd/MM/yyyy')}}
// Resultado: "15/10/2025 - 15/10/2025"

// Mostrar hora inicio y fin
Horario: ={{$json.eventoHoraInicio}} - ={{$json.eventoHoraFin}}
// Resultado: "Horario: 10:00 - 12:00"
```

#### **Generar imagen QR:**
```html
<!-- API pública para generar QR -->
<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={{$json.qrString}}" />
```

#### **Email del alumno:**
```javascript
To: ={{$json.alumnoEmail}}
```

---

## 📋 **Webhook 3: Lista de Inscritos** (Futuro)

**Endpoint:** `/webhook/lista-inscritos`  
**Llamado desde:** `firestoreService.cerrarInscripcionesYEnviarLista()`  
**Cuándo:** Al cerrar inscripciones manualmente o por capacidad llena

### **Payload Esperado:**

```json
{
  "eventoId": "abc123def456",
  "eventoTitulo": "Conferencia de IA",
  "eventoFechaInicio": "2025-10-15",
  "eventoFechaFin": "2025-10-15",
  "eventoHoraInicio": "10:00",
  "eventoHoraFin": "12:00",
  "capacidadMaxima": 100,
  "totalInscritos": 85,
  "porcentajeOcupacion": 85.0,
  
  "organizadorId": "org_xyz123",
  "organizadorEmail": "organizador@upao.edu.pe",
  "organizadorNombre": "Prof. García",
  
  "participantes": [
    {
      "id": "user_001",
      "email": "alumno1@upao.edu.pe",
      "nombre": "Juan",
      "apellido": "Pérez",
      "fechaInscripcion": "2025-01-10T15:30:00.000Z",
      "qrId": "qr_12345"
    },
    {
      "id": "user_002",
      "email": "alumno2@upao.edu.pe",
      "nombre": "María",
      "apellido": "García",
      "fechaInscripcion": "2025-01-10T16:00:00.000Z",
      "qrId": "qr_67890"
    }
    // ... más participantes
  ],
  
  "fechaCierre": "2025-01-15T18:00:00.000Z",
  "motivoCierre": "capacidad_maxima",
  "timestamp": "2025-01-15T18:00:00.000Z",
  "source": "eventos-upao-app"
}
```

---

## 📊 **Webhook 4: Asistencias Finales** (Futuro)

**Endpoint:** `/webhook/asistencias-finales`  
**Cuándo:** Al finalizar el evento y generar reporte de asistencias

### **Payload Esperado:**

```json
{
  "eventoId": "abc123def456",
  "eventoTitulo": "Conferencia de IA",
  "eventoFechaInicio": "2025-10-15",
  "eventoFechaFin": "2025-10-15",
  "eventoHoraInicio": "10:00",
  "eventoHoraFin": "12:00",
  "totalInscritos": 85,
  "totalAsistentes": 72,
  "porcentajeAsistencia": 84.7,
  
  "asistentes": [
    {
      "id": "user_001",
      "email": "alumno1@upao.edu.pe",
      "nombre": "Juan Pérez",
      "metodoRegistro": "qr",
      "horaAsistencia": "2025-10-15T10:05:00.000Z"
    },
    {
      "id": "user_002",
      "email": "alumno2@upao.edu.pe",
      "nombre": "María García",
      "metodoRegistro": "manual",
      "horaAsistencia": "2025-10-15T10:15:00.000Z"
    }
  ],
  
  "ausentes": [
    {
      "id": "user_003",
      "email": "alumno3@upao.edu.pe",
      "nombre": "Carlos López"
    }
  ],
  
  "estadisticas": {
    "asistentesPorQR": 60,
    "asistentesManual": 12,
    "porcentajeQR": 83.3
  },
  
  "fechaFinEvento": "2025-10-15T12:00:00.000Z",
  "timestamp": "2025-10-15T12:00:00.000Z",
  "source": "eventos-upao-app"
}
```

---

## 🔍 **Validaciones de Datos**

Tu `n8nService.js` incluye validaciones automáticas:

### **1. Campos requeridos:**

```javascript
// En todos los webhooks se agrega automáticamente:
{
  "timestamp": "2025-01-10T15:30:00.000Z",  // ✅ Siempre presente
  "source": "eventos-upao-app"              // ✅ Siempre presente
}
```

### **2. Manejo de campos vacíos:**

```javascript
// Si un campo no existe, tu código usa fallbacks:
nombre: alumno.nombre || 'Estudiante'
apellido: alumno.apellido || ''
email: alumno.email || 'sin-email@upao.edu.pe'
```

### **3. Formato de fechas:**

```javascript
// Siempre en formato ISO 8601:
"2025-01-10T15:30:00.000Z"

// Convertir en n8n a formato legible:
={{DateTime.fromISO($json.fecha).toFormat('dd/MM/yyyy')}}
// Resultado: "10/01/2025"
```

---

## 🧪 **Testing - Datos de Prueba**

### **Para Inscripción:**

```javascript
const testInscripcion = {
  eventoId: "test-evt-123",
  eventoTitulo: "Evento de Prueba",
  eventoFecha: "2025-12-31",
  eventoHora: "15:00",
  eventoUbicacion: "Aula Virtual",
  
  alumnoId: "test-user-456",
  alumnoEmail: "test@upao.edu.pe",
  alumnoNombre: "Test",
  alumnoApellido: "Usuario",
  
  qrString: "EVT-TEST-12345",
  qrId: "qr-test-789",
  
  fechaInscripcion: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  source: "eventos-upao-app"
};

fetch('http://localhost:5678/webhook/inscripcion-confirmacion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testInscripcion)
});
```

---

## 📝 **Notas Importantes**

### **✅ Campos que SÍ están implementados en tu app:**
- `alumnoApellido` (agregado recientemente)
- `qrString` y `qrId` (sistema QR completo)
- `timestamp` y `source` (metadata automática)

### **⚠️ Campos que NO existen en tu app:**
- `telefono` del alumno (no se captura en inscripción)
- `carrera` o `ciclo` (no están en el modelo de usuario)
- `imagen` del evento (solo tiene flyer en algunos casos)

### **🔄 Campos que pueden ser null:**
- `alumnoApellido` - Si no se proporcionó durante inscripción
- `descripcion` - Eventos pueden no tener descripción
- `organizadorEmail` - Si el organizador no tiene email configurado

---

## 🎯 **Uso Práctico en n8n**

### **Filtrar eventos por tipo:**

```javascript
// En nodo IF o Switch
={{$json.tipo === 'conferencia'}}
```

### **Validar email institucional:**

```javascript
={{$json.alumnoEmail.includes('@upao.edu.pe')}}
```

### **Calcular días hasta el evento:**

```javascript
={{Math.ceil((DateTime.fromISO($json.eventoFecha) - DateTime.now()) / (1000 * 60 * 60 * 24))}} días
```

---

**Última actualización:** 10 de enero de 2025  
**Versión de la app:** Con sistema de apellidos y estadísticas actualizadas
