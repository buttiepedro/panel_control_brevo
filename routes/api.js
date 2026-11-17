const express = require('express');
const Conversation = require('../models/Conversation');
const { applyConversationState } = require('./conversationState');
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
//   "isDesilenced": boolean,  // ✅ true si un agente lo volvió a activar
//   "silencedBy": string      // "manual" | "bot" | null
// }
// ═══════════════════════════════════════════════════════════════════════
router.post('/message', async (req, res) => {
  try {
    const {
      phoneNumber,
      whatsappName,
      hipervinculo_conversacion,
      lastUserMessage,
      derivationReason,
      isSilenced,
      silencedBy
    } = req.body;
    
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
        whatsappName: whatsappName || null,
        hipervinculo_conversacion: hipervinculo_conversacion || null,
        lastUserMessage: lastUserMessage || null,
        derivationReason: derivationReason || null
      });
      created = true;
    } else {
      // ✅ EXISTENTE: El número ya estaba registrado
      console.log(`🔍 Contacto existe: ${phoneNumber}`);
      
      if (whatsappName && !conversation.whatsappName) {
        conversation.whatsappName = whatsappName;
      }

      if (hipervinculo_conversacion) {
        conversation.hipervinculo_conversacion = hipervinculo_conversacion;
      }

      if (lastUserMessage) {
        conversation.lastUserMessage = lastUserMessage;
      }

      if (derivationReason) {
        conversation.derivationReason = derivationReason;
      }
    }

    const now = new Date();
    applyConversationState(conversation, { isSilenced, silencedBy }, now);
    
    // Actualizar timestamp de último mensaje
    conversation.lastMessageAt = now;
    await conversation.save();
    
    const response = {
      exists: !created,              // true si ya existía
      created,                       // true si fue creado ahora
      isSilenced: conversation.isSilenced,  // ← CRÍTICO PARA n8n
      isDesilenced: conversation.isDesilenced, // true si fue reactivada por agente
      silencedBy: conversation.silencedBy,   // quién lo silenció
      contactStatus: conversation.contactStatus
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

// PUT /api/conversations/:phoneNumber - Silencia/dessilencia conversación o actualiza estado
router.put('/conversations/:phoneNumber', validatePassword, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { isSilenced, silencedBy, contactStatus, derivationReason, lastUserMessage } = req.body;

    const conversation = await Conversation.findOne({ phoneNumber });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    if (derivationReason !== undefined) conversation.derivationReason = derivationReason;
    if (lastUserMessage !== undefined) conversation.lastUserMessage = lastUserMessage;
    applyConversationState(conversation, { isSilenced, silencedBy, contactStatus });
    await conversation.save();
    
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
