// BOT AUTO-RESPONDE EN WHATSAPP (Baileys / Node.js)
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

// Mapa de configuraciones activas por número: JID -> { botType, bizName, bizPrompt, configured }
const activeBots = new Map();

async function connectBot() {
    console.log("Iniciando Bot Enterprise WhatsApp Autoresponder...");
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Conexión cerrada. Reconectando...', shouldReconnect);
            if (shouldReconnect) {
                connectBot();
            }
        } else if (connection === 'open') {
            console.log('¡Conexión establecida exitosamente con WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        const upperText = text.toUpperCase();

        // 1. PROCESAR CÓDIGO DE ACTIVACIÓN Y CONFIGURACIÓN INICIAL
        if (upperText.includes('CÓDIGO DE ACTIVACIÓN:') || upperText.includes('LICENCIA:') || upperText.includes('BENJABOT') || upperText.includes('BENJIBOT') || upperText.includes('BENJUBOT')) {
            let botType = "BENJABOT";
            if (upperText.includes('BENJIBOT')) botType = "BENJIBOT";
            if (upperText.includes('BENJUBOT')) botType = "BENJUBOT";

            // Extraer nombre de negocio si fue enviado
            let bizName = "Mi Negocio";
            const nameMatch = text.match(/Negocio:\s*([^\n]+)/i);
            if (nameMatch && nameMatch[1]) bizName = nameMatch[1].trim();

            // Extraer instrucciones de respuesta si fue enviado
            let bizPrompt = "Atención al cliente y consultas generales";
            const promptMatch = text.match(/Instrucciones del bot:\s*([^\n]+)/i);
            if (promptMatch && promptMatch[1]) bizPrompt = promptMatch[1].trim();

            activeBots.set(from, {
                type: botType,
                name: bizName,
                prompt: bizPrompt,
                configured: true
            });

            await sock.sendMessage(from, { 
                text: `🤖 *SERVIDOR BOTENTERPRISE ACTIVADO*

¡Felicidades! Tu bot de WhatsApp con código *${botType}* se ha configurado correctamente.

📌 *Detalles del servicio:*
• *Negocio:* ${bizName}
• *Instrucciones activas:* "${bizPrompt}"

A partir de este momento, cuando un cliente escriba a tu línea, tu bot responderá automáticamente según tus indicaciones.

*Nota de administración:* Puedes actualizar la información o comportamiento en cualquier momento reenviando el comando de activación.` 
            });
            console.log(`[BOT ACTIVADO] Cliente: ${from} | Bot: ${botType} | Negocio: ${bizName}`);
            return;
        }

        // 2. COMANDO DE SUPERVISIÓN / SOPORTE HUMANO
        if (upperText.includes('SUPERVISION') || upperText.includes('AYUDA') || upperText.includes('HUMANO')) {
            await sock.sendMessage(from, { 
                text: "🚨 *ALERTA DE SUPERVISIÓN ACTIVADA*

Se ha notificado al equipo de soporte de BotEnterprise para revisar tu caso y asistirte de forma personal." 
            });
            return;
        }

        // 3. RESPUESTA AUTOMÁTICA SEGÚN CONFIGURACIÓN DEL NEGOCIO
        const clientBot = activeBots.get(from);
        if (clientBot && clientBot.configured) {
            await sock.sendMessage(from, { 
                text: `🤖 *${clientBot.name}* (Asistente IA)

¡Hola! Gracias por comunicarte con *${clientBot.name}*.
${clientBot.prompt}

_¿En qué más te podemos ayudar hoy?_` 
            });
            return;
        }

        // 4. RESPUESTA POR DEFECTO A USUARIOS SIN BOT VINCULADO
        await sock.sendMessage(from, { 
            text: "🤖 *BotEnterprise SaaS*

Hola, soy el asistente automatizado de BotEnterprise. Para activar tu propio bot de WhatsApp y vincular tu número, adquiere una licencia en nuestra plataforma e ingresa tu código de activación." 
        });
    });
}

connectBot();
