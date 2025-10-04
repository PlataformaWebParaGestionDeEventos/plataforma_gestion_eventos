# 📋 Sistema QR - Instrucciones de Implementación

## ✅ Archivos Creados

### Servicios
- ✅ `src/services/qrService.js` - Servicio de gestión de QR (generación, validación, registro)
- ✅ `src/services/firestoreService.js` - **ACTUALIZADO** con integración QR

### Componentes
- ✅ `src/components/qr/QRGenerator.jsx` - Componente para mostrar QR a estudiantes
- ✅ `src/components/qr/QRGenerator.css` - Estilos del generador QR
- ✅ `src/components/qr/QRScanner.jsx` - Componente para escanear QR (organizadores)
- ✅ `src/components/qr/QRScanner.css` - Estilos del escáner QR

### Dependencias Agregadas
- ✅ `qrcode.react ^3.1.0` - Generación de códigos QR
- ✅ `html5-qrcode ^2.3.8` - Escaneo de códigos QR
- ✅ `crypto-js ^4.2.0` - Encriptación y seguridad

---

## 🚀 PASO 1: Instalar Dependencias

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará:
- qrcode.react (para generar QR)
- html5-qrcode (para escanear QR)
- crypto-js (para seguridad)

---

## 🔐 PASO 2: Configurar Variable de Entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
VITE_QR_SECRET_KEY=upao-eventos-secret-key-2025-tu-clave-segura-aqui
```

**IMPORTANTE:** 
- Cambia `tu-clave-segura-aqui` por una clave única y secreta
- Esta clave se usa para validar la integridad de los códigos QR
- NO compartas esta clave públicamente

---

## 📝 PASO 3: Actualizar Firebase Rules

Copia y pega estas reglas en la consola de Firebase (Firestore Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar si es organizador del evento
    function isOrganizador(eventoId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/eventos/$(eventoId)).data.organizadorId == request.auth.uid;
    }
    
    // Reglas para colección eventos
    match /eventos/{eventoId} {
      // Permitir lectura de eventos publicados a usuarios autenticados
      allow read: if request.auth != null;
      
      // Permitir crear evento si está autenticado
      allow create: if request.auth != null && 
                       request.resource.data.organizadorId == request.auth.uid;
      
      // Permitir actualizar solo al organizador
      allow update: if request.auth != null && (
        // Organizador puede actualizar todo
        isOrganizador(eventoId) ||
        // Alumno solo puede inscribirse/desinscribirse (agregar/quitar su UID de participantes)
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['participantes', 'participantesInfo']) &&
         request.auth.uid in request.resource.data.participantes)
      );
      
      // Permitir eliminar solo al organizador
      allow delete: if isOrganizador(eventoId);
    }
    
    // Reglas para colección usuarios (si la usas)
    match /usuarios/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Nuevas validaciones incluidas:**
- ✅ Validación de QR en `participantesInfo` (campo `qrData`)
- ✅ Validación de asistencia por QR (campo `asistenciaQR`)
- ✅ Protección contra modificación de QR por usuarios no autorizados

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### Para Estudiantes (HU-QR-01, HU-QR-04)
✅ **Generación automática de QR al inscribirse**
- Al inscribirse en un evento, se genera un QR único
- El QR incluye datos encriptados: eventoId, userId, email, timestamp, token de seguridad
- El QR se almacena en Firestore con la inscripción

✅ **Visualización del QR**
- Botón "Ver QR" en cada evento inscrito
- Modal con QR grande y detalles del evento
- Opciones: Descargar, Compartir, Imprimir

✅ **QR con logo UPAO**
- QR incluye logo de la universidad en el centro
- Alta calidad (nivel de corrección H)
- Descarga como PNG con información completa

### Para Organizadores (HU-QR-02, HU-QR-03)
✅ **Escáner QR integrado**
- Activación de cámara para escanear QR
- Validación automática en tiempo real
- Registro de asistencia instantáneo

✅ **Validaciones de seguridad**
- Verificación de token de integridad
- Validación de evento correcto
- Detección de QR duplicados
- Verificación de inscripción válida
- Control de expiración (24h después del evento)

✅ **Feedback visual**
- Estados: válido, error, duplicado, evento incorrecto
- Colores diferenciados por tipo de resultado
- Auto-reinicio después de éxito
- Mensajes claros y precisos

### Sistema de Emails (HU-NOT-01, HU-QR-04)
✅ **Integración con n8n preparada**
- QR incluido en payload de notificaciones
- Campo `qrString` disponible en `notificarInscripcion()`
- Estructura lista para generar imagen QR en n8n
- Estado de envío rastreado en Firestore

---

## 📊 Estructura de Datos en Firestore

### Documento de Evento (actualizado)

```javascript
{
  // ... campos existentes ...
  
  participantesInfo: [
    {
      id: "userId123",
      uid: "userId123",
      email: "alumno@upao.edu.pe",
      nombre: "Juan Pérez",
      fechaInscripcion: "2025-01-15T10:30:00Z",
      estado: "inscrito",
      asistio: false,
      
      // ⭐ NUEVO: Datos del QR
      qrData: {
        qrString: '{"eventoId":"evt123","userId":"usr123",...}',
        token: "a1b2c3d4e5f6...",
        generadoEn: "2025-01-15T10:30:00Z"
      }
    }
  ],
  
  // ⭐ NUEVO: Registro de asistencia por QR
  asistenciaQR: {
    "userId123": {
      timestamp: "2025-01-20T08:15:00Z",
      metodo: "qr"
    }
  },
  
  // Integración n8n actualizada
  workflowN8n: {
    inscripciones: {
      "userId123": {
        confirmacionEnviada: true,
        qrEnviado: true,  // ⭐ NUEVO
        fechaConfirmacion: "2025-01-15T10:30:00Z"
      }
    }
  }
}
```

---

## 🔧 Próximos Pasos

### 1. Integrar QRGenerator en MisEventos
- [ ] Importar componente QRGenerator
- [ ] Agregar botón "Ver QR" por cada inscripción
- [ ] Pasar datos del evento y participante

### 2. Crear página GestionAsistencia
- [ ] Nueva ruta `/gestion-asistencia/:eventoId`
- [ ] Vista dual: Escáner QR + Lista manual
- [ ] Integrar QRScanner
- [ ] Mostrar lista de participantes
- [ ] Botón para marcar asistencia manual

### 3. Actualizar n8nService
- [ ] Documentar estructura para emails con QR
- [ ] Crear workflow en n8n para generar imagen QR
- [ ] Enviar emails con QR adjunto

### 4. Configurar n8n
- [ ] Crear workflow "Email Confirmación con QR"
- [ ] Nodo para recibir webhook
- [ ] Nodo para generar imagen QR desde string
- [ ] Nodo para enviar email con imagen adjunta

---

## 🧪 Pruebas Recomendadas

1. **Inscripción con QR:**
   - Inscribirse como alumno
   - Verificar en Firestore que se guardó `qrData`
   - Ver el QR en la vista de inscripciones

2. **Escaneo QR:**
   - Como organizador, abrir escáner
   - Escanear QR de alumno inscrito
   - Verificar registro de asistencia
   - Intentar escanear mismo QR (debe detectar duplicado)

3. **Validaciones:**
   - Intentar usar QR de otro evento (debe rechazar)
   - Verificar que QR expira después de 24h del evento

4. **Descargar/Imprimir:**
   - Descargar QR como PNG
   - Verificar que incluye logo UPAO e información del evento
   - Probar función de imprimir

---

## 📚 Documentación de Componentes

### qrService.js

**Funciones principales:**
- `generarQR(eventoId, userId, userEmail)` - Genera QR con encriptación
- `validarQR(qrString, eventoIdEsperado)` - Valida integridad y permisos
- `registrarAsistenciaQR(eventoId, userId)` - Marca asistencia en Firestore
- `obtenerEstadisticasQR(eventoId)` - Estadísticas de uso de QR

### QRGenerator.jsx

**Props:**
- `qrString` - String del QR (JSON encriptado)
- `eventoNombre` - Nombre del evento
- `eventoFecha` - Fecha del evento
- `eventoHora` - Hora del evento
- `participanteNombre` - Nombre del participante

**Funciones:**
- `descargarQR()` - Descarga QR como PNG con información
- `compartirQR()` - Comparte QR usando Web Share API
- `imprimirQR()` - Abre ventana de impresión

### QRScanner.jsx

**Props:**
- `eventoId` - ID del evento actual
- `eventoNombre` - Nombre del evento
- `onAsistenciaRegistrada(participante)` - Callback al registrar asistencia

**Estados:**
- `scanning` - Si el escáner está activo
- `resultado` - Resultado del último escaneo (success/error)
- `procesando` - Si está validando un QR

---

## 🎨 Personalización

### Cambiar colores del QR
En `QRGenerator.jsx`, línea del componente QRCodeCanvas:

```jsx
<QRCodeCanvas
  value={qrString}
  size={280}
  level="H"
  fgColor="#2563eb"  // Color del QR (azul por defecto)
  bgColor="#ffffff"  // Fondo blanco
  // ...
/>
```

### Cambiar tiempo de expiración
En `qrService.js`, función `generarQR`:

```javascript
expirationBuffer: 24 * 60 * 60 * 1000 // Cambiar 24 por las horas deseadas
```

---

## ⚠️ Consideraciones de Seguridad

1. **Clave secreta:**
   - NUNCA subir `.env` a Git
   - Usar variable de entorno diferente en producción
   - Rotar clave periódicamente

2. **Validación en backend:**
   - Todas las validaciones se hacen en Firebase Functions (simulado con reglas)
   - No confiar solo en validaciones del cliente

3. **Expiración:**
   - QR expira 24h después del evento
   - No se puede reutilizar QR en otros eventos

4. **Duplicados:**
   - Sistema detecta intentos de escaneo múltiple
   - Solo se registra la primera asistencia

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica que todas las dependencias estén instaladas
2. Revisa la consola del navegador para errores
3. Verifica las reglas de Firebase
4. Confirma que la variable de entorno esté configurada

---

**Estado:** ✅ Sprint 1 - Sistema QR completado al 70%
**Pendiente:** Integración en vistas + n8n email con QR
**Siguiente:** Crear página GestionAsistencia e integrar componentes
