# 🤖 Guía Completa: Configuración de Automatizaciones con n8n

## 📋 **Índice**
1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación de n8n](#instalación-de-n8n)
4. [Configuración Inicial](#configuración-inicial)
5. [Workflows a Implementar](#workflows-a-implementar)
6. [Integración con la Plataforma](#integración-con-la-plataforma)
7. [Testing y Debugging](#testing-y-debugging)
8. [Despliegue en Producción](#despliegue-en-producción)

---

## 🎯 **Introducción**

n8n es una herramienta de automatización que permite crear workflows para:
- Enviar emails automáticos a participantes
- Notificar a organizadores
- Generar certificados
- Enviar recordatorios
- Actualizar estados en Firestore

---

## ✅ **Requisitos Previos**

### **Software necesario:**
- ✅ Node.js v18 o superior
- ✅ npm o pnpm
- ✅ Cuenta de Gmail (para enviar emails)
- ✅ Firebase Service Account (ya lo tienes)

### **Cuentas y credenciales:**
- 📧 Gmail App Password (para SMTP)
- 🔥 Firebase Service Account JSON
- 🌐 URL pública de tu aplicación (para webhooks)

---

## 📦 **Paso 1: Instalación de n8n**

### **Opción A: Instalación Local (Desarrollo)**

```powershell
# Instalar n8n globalmente
npm install n8n -g

# O con pnpm (más rápido)
pnpm add -g n8n

# Iniciar n8n
n8n start

# n8n se abrirá en http://localhost:5678
```

### **Opción B: Docker (Recomendado para Producción)**

```powershell
# Crear directorio para datos persistentes
mkdir C:\n8n-data

# Ejecutar contenedor
docker run -it --rm `
  --name n8n `
  -p 5678:5678 `
  -v C:\n8n-data:/home/node/.n8n `
  n8nio/n8n
```

### **Opción C: Render.com (Hosting Gratuito)**

1. Ve a https://render.com
2. Crea una cuenta
3. Click en "New +" → "Web Service"
4. Conecta tu repositorio o usa imagen Docker:
   - Docker Image: `n8nio/n8n`
   - Port: `5678`
   - Environment Variables:
     ```
     N8N_BASIC_AUTH_ACTIVE=true
     N8N_BASIC_AUTH_USER=admin
     N8N_BASIC_AUTH_PASSWORD=tu_password_seguro
     N8N_HOST=tu-app-n8n.onrender.com
     WEBHOOK_URL=https://tu-app-n8n.onrender.com/
     ```

---

## 🔧 **Paso 2: Configuración Inicial**

### **2.1 Acceder a n8n**

1. Abre tu navegador en: http://localhost:5678
2. Crea tu cuenta de administrador:
   - Email: tu email
   - Password: contraseña segura

### **2.2 Configurar Credenciales**

#### **A) Gmail (SMTP)**

1. En n8n, ve a: **Credentials** → **New**
2. Busca y selecciona: **SMTP**
3. Completa los datos:
   ```
   Host: smtp.gmail.com
   Port: 587
   Secure: Off (usa TLS)
   User: tu-email@gmail.com
   Password: [App Password - ver abajo]
   ```

**Cómo obtener Gmail App Password:**

1. Ve a: https://myaccount.google.com/security
2. Habilita "2-Step Verification"
3. Ve a "App passwords"
4. Genera una contraseña para "Mail" → "Other (Custom name)" → "n8n"
5. Copia el password de 16 caracteres

#### **B) Firebase Admin SDK**

1. En n8n: **Credentials** → **New**
2. Busca: **Google Service Account**
3. Sube tu archivo `credenciales.json` de Firebase
4. O pega el contenido JSON directamente

---

## 🚀 **Paso 3: Workflows a Implementar**

### **Workflow 1: 📧 Confirmación de Inscripción**

**Trigger:** Webhook (llamado desde tu app al inscribirse)

**Pasos:**

#### **3.1 Crear el Workflow**

1. Click en **Workflows** → **New workflow**
2. Nombre: "Confirmación de Inscripción"

#### **3.2 Configurar Nodos**

```
┌─────────────┐
│  Webhook    │ → Recibe datos de inscripción
└─────────────┘
      ↓
┌─────────────┐
│   Set       │ → Prepara variables
└─────────────┘
      ↓
┌─────────────┐
│   Send Email│ → Envía confirmación
└─────────────┘
      ↓
┌─────────────┐
│  Respond    │ → Responde a la app
└─────────────┘
```

#### **Configuración detallada:**

**Nodo 1: Webhook**
```javascript
- HTTP Method: POST
- Path: inscripcion-confirmacion
- Response Mode: When Last Node Finishes
- Authentication: None (opcional: agregar Basic Auth después)
```

**💡 Datos que recibirá este webhook desde tu app:**

Tu `n8nService.notificarInscripcion()` envía automáticamente:

```json
{
  "eventoId": "abc123",
  "eventoTitulo": "Conferencia de IA",
  "eventoFecha": "2025-10-15",
  "eventoHora": "10:00",
  "eventoUbicacion": "Auditorio Principal",
  
  "alumnoId": "user_xyz",
  "alumnoEmail": "juan.perez@upao.edu.pe",
  "alumnoNombre": "Juan",
  "alumnoApellido": "Pérez",
  
  "qrString": "EVT-abc123-USER-xyz-TOKEN-12345",
  "qrId": "qr_unique_id_12345",
  
  "fechaInscripcion": "2025-01-10T15:30:00.000Z",
  "timestamp": "2025-01-10T15:30:00.000Z",
  "source": "eventos-upao-app"
}
```

**Nodo 2: Set (Preparar Variables)**

⚠️ **IMPORTANTE:** Los campos vienen de tu `n8nService`, no como en el ejemplo genérico.

```javascript
{
  "nombreAlumno": "={{$json.alumnoNombre}} ={{$json.alumnoApellido}}",
  "emailAlumno": "={{$json.alumnoEmail}}",
  "tituloEvento": "={{$json.eventoTitulo}}",
  "fechaEvento": "={{$json.eventoFecha}}",
  "horaEvento": "={{$json.eventoHora}}",
  "ubicacionEvento": "={{$json.eventoUbicacion}}",
  "qrString": "={{$json.qrString}}",
  "qrId": "={{$json.qrId}}"
}
```

**Campos disponibles desde tu app:**
- `eventoId`, `eventoTitulo`, `eventoFecha`, `eventoHora`, `eventoUbicacion`
- `alumnoId`, `alumnoEmail`, `alumnoNombre`, `alumnoApellido`
- `qrString` (texto del QR), `qrId` (ID único del QR)
- `fechaInscripcion`, `timestamp`, `source`

**Nodo 3: Send Email (Gmail)**
```javascript
From: Sistema de Eventos UPAO <tu-email@gmail.com>
To: ={{$json.emailAlumno}}
Subject: ✅ Confirmación de Inscripción - {{$json.tituloEvento}}

Body (HTML):
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196f3 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
        .evento-card { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { max-width: 200px; border: 3px solid #2196f3; border-radius: 10px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .button { display: inline-block; padding: 12px 30px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ¡Inscripción Confirmada!</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{{$json.nombreAlumno}}</strong>,</p>
            
            <p>Tu inscripción al siguiente evento ha sido <strong>confirmada exitosamente</strong>:</p>
            
            <div class="evento-card">
                <h2 style="color: #2196f3; margin-top: 0;">📅 {{$json.tituloEvento}}</h2>
                <p><strong>📍 Ubicación:</strong> {{$json.ubicacionEvento}}</p>
                <p><strong>🗓️ Fecha:</strong> {{$json.fechaEvento}}</p>
                <p><strong>🕐 Hora:</strong> {{$json.horaEvento}}</p>
            </div>
            
            <div class="qr-code">
                <h3>Tu Código QR de Asistencia</h3>
                <p>Presenta este código el día del evento:</p>
                
                <!-- OPCIÓN 1: Si tienes servicio para convertir qrString a imagen -->
                <!-- <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={{$json.qrString}}" alt="Código QR"> -->
                
                <!-- OPCIÓN 2: Mostrar el código como texto (más simple) -->
                <div style="background: white; padding: 20px; border-radius: 10px; font-family: monospace; font-size: 18px; font-weight: bold; color: #333;">
                    {{$json.qrString}}
                </div>
                
                <p style="font-size: 12px; color: #666; margin-top: 15px;">
                    También puedes ver tu QR desde "Mis Eventos" en la plataforma
                </p>
            </div>
            
            <div style="text-align: center;">
                <a href="https://tu-plataforma.com/mis-eventos" class="button">
                    Ver Mis Eventos
                </a>
            </div>
            
            <div class="footer">
                <p>Este es un email automático, por favor no respondas.</p>
                <p>© 2025 Universidad Privada Antenor Orrego - Sistema de Gestión de Eventos</p>
            </div>
        </div>
    </div>
</body>
</html>
```

**Nodo 4: Respond to Webhook**
```javascript
Response Code: 200
Response Body:
{
  "success": true,
  "message": "Email de confirmación enviado"
}
```

#### **3.3 Guardar y Activar**

1. Click en **Save** (arriba a la derecha)
2. Toggle **Active** para activar el workflow
3. Copia la URL del webhook (algo como: `http://localhost:5678/webhook/inscripcion-confirmacion`)

---

### **Workflow 2: 🔔 Notificación al Organizador**

**Trigger:** Webhook (llamado cuando hay nueva inscripción)

**Pasos:**

```
┌─────────────┐
│  Webhook    │ → Recibe datos de inscripción
└─────────────┘
      ↓
┌─────────────┐
│   Firestore │ → Consulta total de inscritos
└─────────────┘
      ↓
┌─────────────┐
│   Send Email│ → Notifica al organizador
└─────────────┘
```

**Configuración:**

**Nodo 1: Webhook**
```javascript
- HTTP Method: POST
- Path: notificar-organizador
```

**Nodo 2: Firestore (Google Cloud Firestore)**
```javascript
Operation: Get All
Collection: eventos/{{$json.eventoId}}/inscritos
```

**Nodo 3: Send Email**
```javascript
From: Sistema de Eventos <tu-email@gmail.com>
To: ={{$json.organizadorEmail}}
Subject: 🔔 Nueva inscripción - {{$json.evento.titulo}}

Body:
Hola {{$json.organizadorNombre}},

Un nuevo participante se ha inscrito a tu evento:

👤 Participante: {{$json.participante.nombreCompleto}}
📧 Email: {{$json.participante.email}}
📱 Total de inscritos: {{$node["Firestore"].json.length}} / {{$json.evento.capacidadMaxima}}

📊 Capacidad: {{($node["Firestore"].json.length / $json.evento.capacidadMaxima * 100).toFixed(1)}}%

Puedes ver todos los participantes en tu panel de control.

Saludos,
Sistema de Gestión de Eventos UPAO
```

---

### **Workflow 3: ⏰ Recordatorio 24h Antes**

**Trigger:** Cron (se ejecuta diariamente)

**Pasos:**

```
┌─────────────┐
│    Cron     │ → Se ejecuta todos los días a las 9 AM
└─────────────┘
      ↓
┌─────────────┐
│  Firestore  │ → Busca eventos de mañana
└─────────────┘
      ↓
┌─────────────┐
│   Function  │ → Filtra eventos con participantes
└─────────────┘
      ↓
┌─────────────┐
│    Loop     │ → Por cada evento
└─────────────┘
      ↓
┌─────────────┐
│  Firestore  │ → Obtiene participantes
└─────────────┘
      ↓
┌─────────────┐
│    Loop     │ → Por cada participante
└─────────────┘
      ↓
┌─────────────┐
│  Send Email │ → Envía recordatorio
└─────────────┘
```

**Configuración:**

**Nodo 1: Cron**
```javascript
Mode: Every Day
Hour: 9
Minute: 0
```

**Nodo 2: Firestore Query**
```javascript
Operation: Run Query
Collection: eventos
Where:
  - Field: fecha
    Operator: ==
    Value: ={{new Date(Date.now() + 86400000).toISOString().split('T')[0]}}
  - Field: estado
    Operator: ==
    Value: publicado
```

**Nodo 3: Function (Preparar datos)**
```javascript
// Código JavaScript
const eventos = items[0].json;
const eventosFiltrados = eventos.filter(e => e.participantes && e.participantes.length > 0);
return eventosFiltrados.map(e => ({ json: e }));
```

**Nodo 4: Loop Over Items**

**Nodo 5: Firestore (Obtener participantes)**
```javascript
Operation: Get All
Collection: eventos/{{$json.id}}/inscritos
```

**Nodo 6: Loop Over Participants**

**Nodo 7: Send Email (Recordatorio)**
```javascript
To: ={{$json.correo}}
Subject: ⏰ Recordatorio: {{$parent.$json.titulo}} - Mañana

Body (HTML):
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ ¡El evento es mañana!</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{{$json.nombreCompleto}}</strong>,</p>
            
            <div class="alert">
                <strong>🔔 Recordatorio importante:</strong><br>
                El evento al que te inscribiste se realizará <strong>mañana</strong>.
            </div>
            
            <h2>📅 {{$parent.$json.titulo}}</h2>
            <p><strong>📍 Ubicación:</strong> {{$parent.$json.ubicacion}}</p>
            <p><strong>🗓️ Fecha:</strong> {{$parent.$json.fecha}}</p>
            <p><strong>🕐 Hora:</strong> {{$parent.$json.hora}}</p>
            
            <p><strong>📱 No olvides:</strong></p>
            <ul>
                <li>Llegar 10 minutos antes</li>
                <li>Traer tu código QR (desde tu perfil)</li>
                <li>Llevar materiales si es necesario</li>
            </ul>
            
            <p>¡Nos vemos mañana! 🎉</p>
        </div>
    </div>
</body>
</html>
```

---

### **Workflow 4: 📜 Cierre de Inscripciones y Envío de Lista**

**Trigger:** Webhook (llamado desde HomeOrganizador al cerrar inscripciones)

**Pasos:**

```
┌─────────────┐
│  Webhook    │ → Recibe solicitud de cierre
└─────────────┘
      ↓
┌─────────────┐
│  Firestore  │ → Obtiene participantes
└─────────────┘
      ↓
┌─────────────┐
│  Function   │ → Genera lista en CSV/PDF
└─────────────┘
      ↓
┌─────────────┐
│  Send Email │ → Envía al organizador
└─────────────┘
      ↓
┌─────────────┐
│  Firestore  │ → Actualiza evento (inscripcionesAbiertas: false)
└─────────────┘
      ↓
┌─────────────┐
│  Respond    │ → Confirma a la app
└─────────────┘
```

**Configuración:**

**Nodo 1: Webhook**
```javascript
Path: cerrar-inscripciones
Method: POST
```

**Nodo 2: Firestore (Obtener participantes)**
```javascript
Operation: Get All
Collection: eventos/{{$json.eventoId}}/inscritos
```

**Nodo 3: Function (Generar CSV)**
```javascript
const participantes = items[0].json;
const evento = $input.first().json.evento;

// Generar CSV
let csv = 'Nombre,Email,Teléfono,Fecha de Inscripción\n';
participantes.forEach(p => {
  csv += `${p.nombreCompleto},"${p.correo}","${p.telefono || 'N/A'}","${p.fechaInscripcion}"\n`;
});

return [{
  json: {
    participantes,
    evento,
    csvData: csv,
    totalParticipantes: participantes.length
  }
}];
```

**Nodo 4: Send Email (Con adjunto)**
```javascript
To: ={{$json.evento.organizadorEmail}}
Subject: 📋 Lista de Participantes - {{$json.evento.titulo}}
Attachments: 
  - Name: participantes.csv
    Data: ={{$json.csvData}}
    
Body:
Hola {{$json.evento.organizador}},

Las inscripciones para tu evento "{{$json.evento.titulo}}" se han cerrado.

📊 Total de participantes: {{$json.totalParticipantes}}

Adjunto encontrarás la lista completa de participantes en formato CSV.

También puedes descargar reportes desde tu panel de control.

Saludos,
Sistema de Gestión de Eventos
```

**Nodo 5: Firestore Update**
```javascript
Operation: Update
Collection: eventos
Document ID: ={{$json.evento.id}}
Fields to Send: Define Fields Below
Fields:
  - Name: inscripcionesAbiertas
    Value: false
  - Name: fechaCierre
    Value: ={{new Date().toISOString()}}
```

**Nodo 6: Respond**
```javascript
{
  "success": true,
  "message": "Inscripciones cerradas y lista enviada"
}
```

---

## 🔗 **Paso 4: Integración con tu Plataforma**

### **4.1 Configurar URLs de Webhook en tu app**

**✅ TU SERVICIO YA ESTÁ CREADO** en `src/services/n8nService.js`

Tu implementación actual usa **Vite** (no Create React App), así que las variables de entorno son diferentes:

**Métodos disponibles en tu n8nService:**
- ✅ `enviarEventoCreado(eventoData)` - Cuando se crea un evento
- ✅ `notificarInscripcion(evento, alumno)` - Cuando un alumno se inscribe
- ✅ `enviarAsistencias(evento, asistentes, inscritos)` - Al finalizar evento
- ✅ `enviarWebhook(endpoint, datos, descripcion)` - Método genérico

**Características de tu implementación:**
- ✅ Manejo automático de errores CORS
- ✅ Logging completo con `logger`
- ✅ Validación de configuración
- ✅ Método `probarConexion()` para testing

### **4.2 Agregar variables de entorno**

Crea el archivo `.env` en la **raíz del proyecto** (mismo nivel que `package.json`):

```bash
# Configuración de n8n (DESARROLLO)
VITE_N8N_BASE_URL=http://localhost:5678

# Webhooks individuales
VITE_N8N_WEBHOOK_EVENTO_CREADO=/webhook/evento-creado
VITE_N8N_WEBHOOK_INSCRIPCION=/webhook/inscripcion-confirmacion
VITE_N8N_WEBHOOK_LISTA_INSCRITOS=/webhook/lista-inscritos
VITE_N8N_WEBHOOK_ASISTENCIAS=/webhook/asistencias-finales

# IMPORTANTE: En producción, cambiar a tu URL de Render/Railway
# VITE_N8N_BASE_URL=https://tu-app-n8n.onrender.com
```

**⚠️ IMPORTANTE:** Las variables deben empezar con `VITE_` (no `REACT_APP_`) porque usas Vite.

### **4.3 Integración ya implementada** ✅

Tu código **YA TIENE** las integraciones:

**✅ En `firestoreService.js`:**
- Línea 50: `n8nService.enviarEventoCreado()` al crear evento
- Línea 296: `n8nService.notificarInscripcion()` al inscribirse alumno
- Incluye QR en el payload de inscripción

**✅ Datos que se envían en inscripción:**
```javascript
{
  eventoId: evento.id,
  eventoTitulo: evento.titulo,
  eventoFecha: evento.fecha,
  eventoHora: evento.hora,
  eventoUbicacion: evento.ubicacion,
  
  alumnoId: alumno.uid,
  alumnoEmail: alumno.email,
  alumnoNombre: alumno.nombre,
  alumnoApellido: alumno.apellido,  // ✅ Ahora incluye apellido
  
  qrString: qrResult.qrString,  // ✅ Código QR incluido
  qrId: qrResult.qrId,
  
  fechaInscripcion: timestamp
}
```

---

## 🧪 **Paso 5: Testing**

### **5.1 Probar Webhook Individual**

En n8n, click en **Test Workflow** y luego click en **Listen for Test Event** en el nodo Webhook.

**Opción A: Desde tu app React (Recomendado)**

Simplemente crea un evento o inscríbete a uno. El sistema automáticamente enviará los datos a n8n.

**Opción B: Desde Postman/Thunder Client**

Envía un POST con la estructura REAL que usa tu app:

```json
POST http://localhost:5678/webhook/inscripcion-confirmacion

{
  "eventoId": "evento123",
  "eventoTitulo": "Conferencia de IA",
  "eventoFecha": "2025-10-15",
  "eventoHora": "10:00",
  "eventoUbicacion": "Auditorio Principal",
  "eventoTipo": "conferencia",
  
  "alumnoId": "user123",
  "alumnoEmail": "juan@upao.edu.pe",
  "alumnoNombre": "Juan",
  "alumnoApellido": "Pérez",
  
  "qrString": "EVT-12345-USER-67890",
  "qrId": "qr_abc123def456",
  
  "fechaInscripcion": "2025-01-10T15:30:00Z",
  "timestamp": "2025-01-10T15:30:00Z",
  "source": "eventos-upao-app"
}
```

**Opción C: Usar la consola del navegador**

Abre DevTools (F12) en tu app y ejecuta:

```javascript
// Probar webhook de inscripción
const testData = {
  eventoId: "test123",
  eventoTitulo: "Evento de Prueba",
  eventoFecha: "2025-10-15",
  eventoHora: "10:00",
  eventoUbicacion: "Virtual",
  alumnoId: "test-user",
  alumnoEmail: "test@upao.edu.pe",
  alumnoNombre: "Usuario",
  alumnoApellido: "Prueba",
  qrString: "TEST-QR-CODE-12345",
  qrId: "test-qr-id"
};

fetch('http://localhost:5678/webhook/inscripcion-confirmacion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### **5.2 Verificar Ejecuciones**

1. En n8n, ve a **Executions** (panel izquierdo)
2. Verás todas las ejecuciones con status (Success/Error)
3. Click en una para ver detalles y datos de cada nodo

---

## 🚀 **Paso 6: Despliegue en Producción**

### **Opción A: Render.com (Recomendado - Gratis)**

1. **Crear cuenta en Render:**
   - Ve a https://render.com
   - Regístrate con GitHub

2. **Crear Web Service:**
   - New → Web Service
   - Docker Image: `n8nio/n8n:latest`
   - Name: `tu-app-n8n`
   - Region: Oregon (US West)
   - Instance Type: Free

3. **Variables de Entorno:**
   ```
   N8N_BASIC_AUTH_ACTIVE=true
   N8N_BASIC_AUTH_USER=admin
   N8N_BASIC_AUTH_PASSWORD=tu_password_super_seguro_aqui
   N8N_HOST=tu-app-n8n.onrender.com
   WEBHOOK_URL=https://tu-app-n8n.onrender.com/
   N8N_PROTOCOL=https
   N8N_PORT=5678
   NODE_ENV=production
   ```

4. **Desplegar:**
   - Click "Create Web Service"
   - Espera 5-10 minutos

5. **Acceder:**
   - URL: https://tu-app-n8n.onrender.com
   - Usuario: admin
   - Password: el que configuraste

### **Opción B: Railway.app (Alternativa)**

Similar a Render, pero con $5 gratis al mes:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Agregar variables
railway variables set N8N_BASIC_AUTH_ACTIVE=true
railway variables set N8N_HOST=tu-app.railway.app

# Desplegar
railway up
```

---

## 📊 **Paso 7: Monitoreo**

### **7.1 Ver logs en tiempo real**

En Render:
- Ve a tu servicio
- Tab "Logs"
- Verás todas las ejecuciones en tiempo real

### **7.2 Configurar alertas**

En n8n:
1. Settings → Error Workflow
2. Crea un workflow que envíe email cuando falla otro:

```
┌─────────────┐
│ Error Trigger│
└─────────────┘
      ↓
┌─────────────┐
│  Send Email │ → A tu email personal
└─────────────┘

Body:
Error en workflow: {{$json.workflow.name}}
Error: {{$json.error.message}}
Fecha: {{$json.executedAt}}
```

---

## ✅ **Checklist Final**

Antes de ir a producción:

**Configuración de n8n:**
- [ ] n8n instalado y corriendo (local o Render)
- [ ] Acceso a http://localhost:5678 funciona
- [ ] Cuenta de administrador creada
- [ ] Gmail SMTP credentials configuradas
- [ ] Firebase Service Account configurado

**Variables de Entorno (.env):**
- [ ] Archivo `.env` creado en la raíz del proyecto
- [ ] `VITE_N8N_BASE_URL` configurada (http://localhost:5678)
- [ ] `VITE_N8N_WEBHOOK_EVENTO_CREADO` configurada
- [ ] `VITE_N8N_WEBHOOK_INSCRIPCION` configurada
- [ ] `VITE_N8N_WEBHOOK_LISTA_INSCRITOS` configurada
- [ ] `VITE_N8N_WEBHOOK_ASISTENCIAS` configurada

**Workflows en n8n:**
- [ ] Workflow "Confirmación de Inscripción" creado y activo
- [ ] Webhook path: `/webhook/inscripcion-confirmacion`
- [ ] Nodo Set configurado con campos correctos
- [ ] Nodo Send Email configurado con Gmail
- [ ] Template HTML del email actualizado
- [ ] Workflow testeado con datos reales

**Testing:**
- [ ] Webhook responde correctamente desde Postman
- [ ] Crear evento en la app → n8n recibe datos
- [ ] Inscribirse a evento → email llega correctamente
- [ ] QR code visible en el email
- [ ] Logs en n8n muestran ejecuciones exitosas
- [ ] Revisar **Executions** en n8n (panel izquierdo)

**Producción (cuando despliegues):**
- [ ] n8n desplegado en Render/Railway
- [ ] URL de producción configurada en `.env`
- [ ] CORS habilitado en n8n (ya manejado en tu código)
- [ ] Error workflow configurado
- [ ] Backup de workflows exportado (Settings → Export)
- [ ] Monitoring activo

**Integración con tu app:**
- [ ] `n8nService.js` ✅ (ya existe)
- [ ] `firestoreService.js` llama a n8n ✅ (ya implementado)
- [ ] Console logs muestran `[n8n]` messages
- [ ] Errores CORS manejados correctamente ✅

---

## 🎉 **¡Listo para Automatizar!**

Ahora tienes:
✅ Sistema de emails automáticos
✅ Notificaciones en tiempo real
✅ Recordatorios programados
✅ Cierre automático de inscripciones

**Siguiente paso:** Implementar workflow de certificados automáticos (requiere plantilla PDF)

---

## 📞 **Soporte**

Si tienes problemas:

1. **n8n Community:** https://community.n8n.io
2. **Documentation:** https://docs.n8n.io
3. **Discord:** https://discord.gg/n8n

**Comandos útiles:**

```powershell
# Ver logs de n8n con debug
n8n start --log-level=debug

# Exportar workflows
# En UI: Settings → Export all workflows

# Importar workflows
# En UI: Settings → Import workflows

# Reiniciar servidor Vite después de cambiar .env
npm run dev
```

---

## 🔧 **Troubleshooting - Problemas Comunes**

### **1. "n8n no recibe los webhooks"**

**Síntomas:** Los logs de tu app muestran `[n8n]` pero n8n no registra ejecuciones.

**Soluciones:**
```powershell
# 1. Verificar que n8n esté corriendo
# Abrir http://localhost:5678 en el navegador

# 2. Verificar variables de entorno
# En la consola del navegador (F12):
console.log(import.meta.env.VITE_N8N_BASE_URL)

# 3. Verificar que el workflow esté ACTIVO
# En n8n: Toggle "Active" debe estar en ON (verde)

# 4. Ver logs en tiempo real
# En n8n: Click en "Executions" (panel izquierdo)
```

### **2. "Error CORS en n8n"**

**Síntomas:** Error `Access-Control-Allow-Origin` en consola.

**Solución:** ✅ Tu código YA maneja esto automáticamente en `n8nService.js` (líneas 88-98).

Si aún aparece:
1. En n8n local, agregar variables:
   ```bash
   N8N_CORS_ENABLE=true
   N8N_CORS_ORIGIN=http://localhost:5173
   ```

2. En Render, agregar en Variables de Entorno:
   ```
   N8N_CORS_ENABLE=true
   N8N_CORS_ORIGIN=https://tu-app.netlify.app
   ```

### **3. "Los emails no llegan"**

**Pasos de diagnóstico:**

1. **Verificar Gmail App Password:**
   - Debe ser de 16 caracteres sin espacios
   - 2FA debe estar habilitado en tu Gmail

2. **Verificar nodo Send Email en n8n:**
   ```
   From Email: TU_EMAIL@gmail.com (debe ser el mismo del SMTP)
   SMTP Host: smtp.gmail.com
   Port: 587 (NO 465)
   Secure: Off (usa TLS automático)
   ```

3. **Probar envío manual:**
   - En n8n, click en "Test Workflow"
   - Click en "Execute Node" en el nodo Send Email
   - Ver error específico si falla

4. **Revisar spam:**
   - Los emails pueden ir a spam la primera vez

### **4. "Variables de entorno no se cargan"**

**Síntomas:** `import.meta.env.VITE_N8N_BASE_URL` es `undefined`

**Soluciones:**
```powershell
# 1. Verificar que el archivo se llame exactamente ".env"
ls .env  # Debe existir en la raíz del proyecto

# 2. Verificar que las variables empiecen con VITE_
# ❌ MAL: REACT_APP_N8N_URL
# ✅ BIEN: VITE_N8N_BASE_URL

# 3. REINICIAR el servidor de desarrollo
Ctrl+C  # Detener servidor
npm run dev  # Iniciar de nuevo

# 4. Verificar en el navegador (F12 → Console)
console.log(import.meta.env)
```

### **5. "Workflow ejecutado pero no hace nada"**

**Verificar en n8n:**

1. Click en **Executions** (panel izquierdo)
2. Click en la ejecución más reciente
3. Ver cada nodo:
   - Verde ✅ = Ejecutado correctamente
   - Rojo ❌ = Error
   - Gris ⚪ = No ejecutado

4. Click en cada nodo para ver:
   - **Input Data:** Qué datos recibió
   - **Output Data:** Qué datos produjo
   - **Execution Time:** Cuánto tardó

### **6. "n8n se cae en Render (Free Plan)"**

**Problema:** Render pone en "sleep" los servicios gratuitos después de 15 minutos de inactividad.

**Soluciones:**

**Opción A: Ping automático (Recomendado)**

Crear workflow en n8n que se llame a sí mismo cada 10 minutos:

```
┌─────────────┐
│    Cron     │ → Cada 10 minutos
└─────────────┘
      ↓
┌─────────────┐
│  HTTP Req   │ → GET https://tu-app-n8n.onrender.com/health
└─────────────┘
```

**Opción B: Servicio externo de ping**

- https://uptimerobot.com (gratuito)
- Configura un monitor HTTP que haga ping cada 5 minutos

**Opción C: Actualizar a plan pagado**

- Render: $7/mes
- Railway: $5/mes de crédito gratuito

### **7. "Cómo ver logs en tiempo real"**

**En desarrollo (local):**

Tu app ya tiene logging integrado:

```javascript
// En DevTools Console (F12), buscar:
[n8n] Enviando evento creado
[n8n] Response status: 200
✅ [n8n] Evento enviado correctamente
```

**En n8n:**

1. **Ver ejecuciones históricas:**
   - n8n → Executions (panel izquierdo)

2. **Ver logs del servidor:**
   - Si instalaste con npm: Ver terminal donde corrió `n8n start`
   - Si usas Docker: `docker logs n8n`
   - Si usas Render: Dashboard → Logs tab

---

## 🎓 **Recursos Adicionales**

**Documentación Oficial:**
- n8n Docs: https://docs.n8n.io
- n8n Workflows: https://n8n.io/workflows (templates)
- n8n Community: https://community.n8n.io

**Tu Código:**
- `src/services/n8nService.js` - Servicio de integración
- `src/services/firestoreService.js` - Líneas 50, 296 (llamadas a n8n)
- `src/core/utils/logger.js` - Sistema de logging

**Testing:**
- Postman Collection: (puedes crear una con los ejemplos de arriba)
- Thunder Client (extensión de VS Code): Más simple que Postman

---

## ✅ **Resumen de Cambios en tu Implementación**

**Diferencias vs guía genérica:**

| Concepto | Guía Genérica | Tu Implementación |
|----------|--------------|-------------------|
| Variables env | `REACT_APP_*` | `VITE_*` ✅ |
| Servicio | Crear desde cero | `n8nService.js` ya existe ✅ |
| Integración | Manual | Automática en `firestoreService` ✅ |
| Manejo CORS | No incluido | Manejo completo ✅ |
| Logging | Console.log básico | Logger centralizado ✅ |
| Datos QR | URL de imagen | `qrString` + `qrId` ✅ |
| Apellido | No incluido | `alumnoApellido` ✅ |

**Tu implementación está MÁS COMPLETA que la guía genérica** 🎉

---

**¿Siguiente paso?** 

1. **Crear archivo `.env`** con las variables
2. **Instalar n8n** (`npm install n8n -g`)
3. **Iniciar n8n** (`n8n start`)
4. **Crear primer workflow** (Confirmación de Inscripción)
5. **Probar** inscribiéndote a un evento en tu app

¿Por dónde quieres empezar? 🚀
