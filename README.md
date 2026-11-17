# Panel de Control - Brevo WhatsApp

Panel web para gestionar conversaciones de Brevo/WhatsApp con API REST para integración con n8n.

## 🚀 Inicio Rápido

### Con Docker (recomendado)

```bash
cp .env.example .env
docker-compose up -d
```

Acceder en: **http://localhost:3000**

### Sin Docker (desarrollo local)

```bash
# Backend
npm install
npm run dev

# Frontend (en otra terminal)
npm run dev:frontend
```

## 📋 Requisitos

- **Docker + Docker Compose** (para deploy), O
- **Node.js 18+** + **MongoDB** (para desarrollo local)

## 🔐 Configuración

Editar `.env`:

```env
ADMIN_PASSWORD=tu_contraseña_aqui_123
MONGODB_URI=mongodb://localhost:27017/panel-brevo  # Local
# O con Docker:
MONGODB_URI=mongodb://admin:mongoadmin123@mongodb:27017/panel-brevo?authSource=admin
```

## 📁 Estructura

```
├── frontend/              # React + Vite
│   ├── src/
│   ├── dist/             # Build (generado en Docker)
│   └── package.json
├── routes/               # API endpoints
├── models/               # Mongoose schemas
├── server.js             # Express server
├── Dockerfile            # Multi-stage build (React + Node)
├── docker-compose.yml    # MongoDB + App
└── .env.example          # Configuración
```

## 🔌 API

### POST `/api/message`

Desde n8n/Brevo. Valida y crea/actualiza conversaciones.

```bash
curl -X POST http://localhost:3000/api/message \
  -H "x-api-password: tu_contraseña_aqui_123" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "5491234567890", "whatsappName": "Juan"}'
```

**Response:**
```json
{
  "exists": true,
  "created": false,
  "isSilenced": false,
  "silencedBy": null
}
```

### Otros endpoints

- `GET /api/conversations` - Listar todas
- `PUT /api/conversations/:phone` - Silenciar/activar
- `DELETE /api/conversations/:phone` - Eliminar

Todos requieren header `x-api-password`.

### Derivaciones y contexto desde n8n

Cuando el bot decide pasar una consulta a un asesor, enviar una sola vez por
derivación a `POST /api/message` (o a `PUT /api/conversations/:phone` si el
contacto ya existe):

```json
{
  "phoneNumber": "5491100000000",
  "whatsappName": "Contacto",
  "isSilenced": true,
  "silencedBy": "bot",
  "derivationReason": "Resumen de la consulta y motivo de atención humana.",
  "lastUserMessage": "Último mensaje del contacto",
  "hipervinculo_conversacion": "https://app.brevo.com/..."
}
```

El enlace y el nombre se reciben por `POST /api/message`; el `PUT` permite
actualizar el estado, el motivo y el último mensaje. No enviar el evento de
derivación en cada mensaje entrante: para mensajes comunes alcanza con el número,
el nombre y `lastUserMessage`. El panel no genera resúmenes ni consulta Brevo
automáticamente; n8n debe proporcionar esos datos.

Se conservan `botSilencedAt` y `derivationDates` aunque el asesor marque
contactado o reactive el bot. Mientras siga pendiente, repetir el evento no
reinicia la espera ni agrega fechas. “Derivadas hoy” cuenta números distintos
derivados ese día, incluso si ya fueron atendidos. “Consultas de hoy” cuenta
números con último mensaje de hoy, no cantidad de mensajes.

Silenciar manualmente solo pausa el bot: **no confirma que hubo contacto**.
Para eso se usa “Marcar Contactado” o `contactStatus: "contacted"`.
Reactivar el bot devuelve la consulta al estado `in_bot`.

El panel abierto consulta novedades cada 25 segundos. Después de la carga
inicial, las nuevas derivaciones muestran un aviso persistente abajo a la derecha,
agrupado y con acceso a pendientes. No son notificaciones del sistema y no
funcionan con el panel cerrado. Los fallos de actualización muestran un aviso con
reintento; los datos anteriores se conservan y se indican como desactualizados.

Las fechas históricas que la versión anterior ya borró no se pueden reconstruir
desde este panel. Se conservan las fechas existentes, pero no se infieren
derivaciones a partir de `updatedAt`. Validar el flujo real enviando una
derivación de prueba desde n8n, comprobar su contexto en el panel y marcarla como
contactada: debe salir de pendientes sin bajar “Derivadas hoy”.

## 🛠️ Desarrollo

### Frontend (React/Vite)

```bash
npm run dev:frontend
```

Build:
```bash
npm run build:frontend
```

Pruebas de seguimiento y contadores (sin MongoDB):

```bash
npm test
```

### Backend

```bash
npm run dev
```

## 📦 Build para Producción

```bash
# Docker hace todo automáticamente
docker-compose build
docker-compose up -d
```

## 🐛 Troubleshooting

**Puerto 3000 en uso:**
```bash
# Cambiar en docker-compose.yml:
ports:
  - "3001:3000"
```

**MongoDB no conecta:**
```bash
# Ver logs
docker-compose logs mongodb

# Reiniciar
docker-compose restart mongodb
```

**Frontend no se actualiza:**
```bash
# Reconstruir con caché limpio
docker-compose build --no-cache
docker-compose up -d
```

## 📚 Más Info

- Variables de entorno: `.env.example`
- Base de datos: MongoDB en puerto 27017
- Panel: http://localhost:3000
- API: http://localhost:3000/api

---

**Creado para Brevo + n8n integration**
2. **`FLUJO_BREVO_N8N.md`** ← Visual completo paso a paso
3. **`N8N_INTEGRATION.md`** ← Configuración detallada
4. **`API_EXAMPLES.md`** ← Ejemplos en código

### El Flujo Crítico

```
Brevo → n8n Webhook
        ↓
        POST a http://localhost:3000/api/message
        {
          "phoneNumber": "541234567890",
          "whatsappName": "Juan"
        }
        ↓
        ¿isSilenced == true?
        ├─ SÍ → 🛑 DETENER (No ejecutar bot)
        └─ NO → ✅ CONTINUAR (Ejecutar bot)
```

### Endpoint Principal: POST /api/message

**Este es el endpoint MÁS IMPORTANTE**

```bash
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "541234567890",
    "whatsappName": "Juan Pérez"
  }'
```

**Respuesta si primer mensaje (no existe):**
```json
{
  "exists": false,
  "created": true,
  "isSilenced": false
}
→ n8n continúa, ejecuta el bot ✅
```

**Respuesta si está silenciado:**
```json
{
  "exists": true,
  "created": false,
  "isSilenced": true,
  "silencedBy": "manual"
}
→ n8n DETIENE el flujo 🛑
```

### Endpoint Opcional: PUT /api/conversations

Solo si el bot se va a silenciar a sí mismo:

```bash
curl -X PUT http://localhost:3000/api/conversations/541234567890 \
  -H "x-api-password: tu_contraseña_aqui_123" \
  -H "Content-Type: application/json" \
  -d '{
    "isSilenced": true,
    "silencedBy": "bot"
  }'
```

Después de esto, próximos mensajes retornarán `isSilenced: true`.

## 📊 Panel Web

Acceder con la contraseña configurada en `.env`:

- **Ver todas las conversaciones**: Lista ordenada por último mensaje
- **Silenciar/Activar**: Desde el panel (marca como `silencedBy: "manual"`)
- **Eliminar**: Remover conversación
- **Estadísticas**: Total, activas y silenciadas
- **Ver detalle**: Abre el motivo de derivación/resumen y el último mensaje completos,
  conservando saltos de línea, en un modal con scroll para textos largos.

Las eliminaciones requieren confirmación en un modal integrado. Se puede cancelar
con el botón o con Escape antes del envío; durante la eliminación se bloquean
los botones para evitar duplicados. Si falla, el modal conserva el error y permite
reintentar. Las notificaciones aparecen abajo a la derecha con fondos opacos
en los temas claro y oscuro.

## 🗂️ Estructura del Proyecto

```
Panel_basico_GM/
├── server.js                 # Servidor Express principal
├── package.json             # Dependencias
├── .env                      # Variables de entorno
├── frontend/                 # Frontend React (Vite)
│   ├── src/
│   └── package.json
├── models/
│   └── Conversation.js      # Schema de MongoDB
├── routes/
│   └── api.js               # Endpoints REST
├── public/
│   └── index.html           # Fallback legado
└── README.md                # Este archivo
```

## 🔐 Seguridad

- La contraseña se pasa en header `x-api-password` (en producción usar HTTPS)
- No hay almacenamiento de sesiones (stateless)
- Validar siempre la contraseña antes de retornar datos

## ❌ Troubleshooting

### "Conectado a MongoDB" pero no carga conversaciones
- Verificar que MongoDB está corriendo: `mongod`
- Verificar que el puerto es el correcto: `mongodb://localhost:27017/panel-brevo`

### Puerto 3000 ya está en uso
Cambiar en `.env`:
```env
PORT=5000
```

### Contraseña no funciona
- Verificar el valor en `.env` sin espacios
- Asegurarse de reiniciar el servidor después de cambiar `.env`

## 📝 Ejemplo con curl

```bash
# Recibir mensaje
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"541123456789","whatsappName":"Juan"}'

# Obtener conversaciones
curl -X GET http://localhost:3000/api/conversations \
  -H "x-api-password:tu_contraseña_aqui_123"

# Silenciar conversación
curl -X PUT http://localhost:3000/api/conversations/541123456789 \
  -H "x-api-password:tu_contraseña_aqui_123" \
  -H "Content-Type: application/json" \
  -d '{"isSilenced":true,"silencedBy":"manual"}'
```

## 📄 Licencia

ISC
