// CONFIGURACIÓN DE TU BOT AUTO-RESPONDE EN WHATSAPP (Baileys / Node.js)
// Este script corre en tu servidor o dispositivo para auto-responder los mensajes de WhatsApp

const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

async function connectBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();

        // 1. Mensaje de compra desde la web
        if (text.includes('licencia:') || text.includes('realicé el pago exacto')) {
            await sock.sendMessage(from, { 
                text: "🤖 *BOTENTERPRISE SERVER*

¡Hemos recibido tu comprobante y datos de configuración!

Procesando tu solicitud... Un operador te confirmará la vinculación activa. Si deseas supervisión humana inmediata escribe *SUPERVISION*." 
            });
            return;
        }

        // 2. Comando de supervisión o si el bot no resuelve
        if (text.includes('supervision') || text.includes('ayuda') || text.includes('no anda')) {
            await sock.sendMessage(from, { 
                text: "🚨 *NOTIFICACIÓN DE SUPERVISIÓN ENVIADA*

Se ha alertado a Benja sobre tu consulta. Te contactaremos a la brevedad." 
            });
            // Notificar al dueño
            console.log(`[ALERTA SUPERVISIÓN] Cliente ${from} solicita ayuda directa.`);
            return;
        }

        // 3. Respuesta automática por defecto
        await sock.sendMessage(from, { 
            text: "Hola, soy el asistente automatizado de BotEnterprise. Si compraste un bot en la web o requieres supervisión directa, responde *SUPERVISION* para derivarte con Aaron Benjamin." 
        });
    });
}

connectBot();
