// CONFIGURACIÓN DE TU BOT AUTO-RESPONDE EN WHATSAPP (Baileys / Node.js)
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

        // 1. Mensaje con número de operación y licencia desde la web
        if (text.includes('nro de operación:') || text.includes('licencia:')) {
            await sock.sendMessage(from, { 
                text: "🤖 *BOTENTERPRISE SERVER*

¡Comprobante y número de operación recibidos con éxito!

Validando el comprobante en la cuenta de cobro... Si necesitas soporte con la supervisión de tu bot, escribe *SUPERVISION*." 
            });
            return;
        }

        // 2. Comando de supervisión o si el cliente avisa que hay un error
        if (text.includes('supervision') || text.includes('ayuda') || text.includes('no anda') || text.includes('error')) {
            await sock.sendMessage(from, { 
                text: "🚨 *ALERTA DE SUPERVISIÓN ACTIVADA*

Se ha notificado a Aaron Benjamin para revisar tu número de operación y solucionarlo de inmediato." 
            });
            console.log(`[ALERTA DE SUPERVISIÓN] Cliente ${from} requiere asistencia manual.`);
            return;
        }

        // 3. Respuesta automática por defecto
        await sock.sendMessage(from, { 
            text: "Hola, soy el asistente automatizado de BotEnterprise. Envía tu número de operación de la web o escribe *SUPERVISION* para hablar con el administrador." 
        });
    });
}

connectBot();
