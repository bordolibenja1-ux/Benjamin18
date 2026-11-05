// CONFIGURACIÓN DE TU BOT AUTO-RESPONDE EN WHATSAPP (Baileys / Node.js)
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

// Almacenamiento local en memoria de los bots activos de los clientes
const activeBots = new Map();

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
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        const upperText = text.toUpperCase();

        // 1. Activación automática desde la web según el código (BENJABOT, BENJIBOT o BENJUBOT)
        if (upperText.includes('CÓDIGO DE ACTIVACIÓN:') || upperText.includes('BENJABOT') || upperText.includes('BENJIBOT') || upperText.includes('BENJUBOT')) {
            let botType = "BENJABOT";
            if (upperText.includes('BENJIBOT')) botType = "BENJIBOT";
            if (upperText.includes('BENJUBOT')) botType = "BENJUBOT";

            // Guardar la configuración del bot para este cliente
            activeBots.set(from, {
                type: botType,
                configured: true,
                rawText: text
            });

            await sock.sendMessage(from, { 
                text: `🤖 *SERVIDOR BOTENTERPRISE*

¡Activación exitosa con código *${botType}*!

Tu bot ya está conectado y respondiendo automáticamente a los mensajes de tus clientes según tus instrucciones. Si necesitas supervisión escribe *SUPERVISION*.` 
            });
            console.log(`[BOT ACTIVADO] Cliente ${from} activado con el código ${botType}`);
            return;
        }

        // 2. Comando de supervisión humana
        if (upperText.includes('SUPERVISION') || upperText.includes('AYUDA') || upperText.includes('ADMIN')) {
            await sock.sendMessage(from, { 
                text: "🚨 *ALERTA DE SUPERVISIÓN ACTIVADA*

Se ha notificado a Aaron Benjamin para revisar tu caso y asistirte personalmente." 
            });
            console.log(`[ALERTA DE SUPERVISIÓN] Solicitud de ${from}`);
            return;
        }

        // 3. AUTO-RESPUESTA INTELIGENTE DEL BOT ACTIVO DEL CLIENTE
        const clientBot = activeBots.get(from);
        if (clientBot && clientBot.configured) {
            // El bot responde de forma automática imitando la IA del negocio configurado
            await sock.sendMessage(from, { 
                text: `🤖 *(Respondiendo con ${clientBot.type})*

Hola, gracias por contactarnos. Hemos recibido tu consulta y estamos procesando tu pedido automáticamente.` 
            });
            return;
        }

        // 4. Respuesta por defecto si no está registrado
        await sock.sendMessage(from, { 
            text: "Hola, soy el asistente automatizado de BotEnterprise. Adquiere tu bot en la web para activarlo con BENJABOT, BENJIBOT o BENJUBOT." 
        });
    });
}

connectBot();
