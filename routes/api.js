const express = require('express');
const Conversation = require('../models/Conversation');
const router = express.Router();

// Middleware para validar contraseña
const validatePassword = (req, res, next) => {
  const token = req.headers['x-api-password'] || req.body.password;
  
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  
  next();
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/message - 🎯 ENDPOINT PRINCIPAL PARA n8n
// ═══════════════════════════════════════════════════════════════════════
// FLUJO:
// 1. Recibe: phoneNumber, whatsappName (desde webhook de Brevo)
// 2. Si NO EXISTE el número → Crea registro, retorna isSilenced: false
// 3. Si EXISTE el número → Chequea si está silenciado, retorna isSilenced
// 
// RESPUESTA:
// {
//   "exists": boolean,        // ¿El número ya existía?
//   "created": boolean,       // ¿Se creó un nuevo registro?
//   "isSilenced": boolean,    // ⚠️ CRÍTICO: ¿Está silenciado? n8n usa esto
//   "silencedBy": string      // "manual" | "bot" | null
// }
// ═══════════════════════════════════════════════════════════════════════
router.post('/message', async (req, res) => {
  try {
    const { phoneNumber, whatsappName } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber es requerido' });
    }
    
    console.log(`📱 Mensaje recibido: ${phoneNumber} (${whatsappName || 'sin nombre'})`);
    
    let conversation = await Conversation.findOne({ phoneNumber });
    let created = false;
    
    if (!conversation) {
      // ✅ NUEVO: El número NO existía → Crear registro
      console.log(`✨ Creando nuevo contacto: ${phoneNumber}`);
      conversation = new Conversation({
        phoneNumber,
        whatsappName: whatsappName || null
      });
      created = true;
    } else {
      // ✅ EXISTENTE: El número ya estaba registrado
      console.log(`🔍 Contacto existe: ${phoneNumber}`);
      
      // Actualizar nombre si viene en el request y no tenía uno
      if (whatsappName && !conversation.whatsappName) {
        conversation.whatsappName = whatsappName;
      }
    }
    
    // Actualizar timestamp de último mensaje
    conversation.lastMessageAt = new Date();
    await conversation.save();
    
    // ⚠️ IMPORTANTE: Retornar el estado de silenciado
    // n8n checkeará este campo para decidir si continuar o abortar el flujo
    const response = {
      exists: !created,              // true si ya existía
      created,                       // true si fue creado ahora
      isSilenced: conversation.isSilenced,  // ← CRÍTICO PARA n8n
      silencedBy: conversation.silencedBy   // quién lo silenciló
    };
    
    console.log(`📤 Respuesta: ${JSON.stringify(response)}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error en POST /message:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/conversations - Obtiene todas las conversaciones
router.get('/conversations', validatePassword, async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ lastMessageAt: -1 })
      .lean();
    
    res.json(conversations);
  } catch (error) {
    console.error('Error en GET /conversations:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/conversations/:phoneNumber - Silencia/dessilencia conversación
router.put('/conversations/:phoneNumber', validatePassword, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { isSilenced, silencedBy } = req.body;
    
    const conversation = await Conversation.findOneAndUpdate(
      { phoneNumber },
      {
        isSilenced,
        silencedBy: isSilenced ? silencedBy : null,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error en PUT /conversations/:phoneNumber:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/conversations/:phoneNumber - Elimina conversación
router.delete('/conversations/:phoneNumber', validatePassword, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const result = await Conversation.findOneAndDelete({ phoneNumber });
    
    if (!result) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    
    res.json({ message: 'Conversación eliminada' });
  } catch (error) {
    console.error('Error en DELETE /conversations/:phoneNumber:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
