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

        // 1. Mensaje de compra / licencia desde la web
        if (text.includes('licencia:') || text.includes('realicé el pago exacto')) {
            await sock.sendMessage(from, { 
                text: "🤖 *BOTENTERPRISE SERVER*

¡Comprobante y licencia recibidos correctamente!

Estamos validando el impacto exacto en la cuenta para proceder con la vinculación automática. Si necesitas asistencia humana urgente, responde *SUPERVISION*." 
            });
            return;
        }

        // 2. Comando de supervisión o si el cliente avisa que no le sirve / error
        if (text.includes('supervision') || text.includes('ayuda') || text.includes('no anda') || text.includes('error')) {
            await sock.sendMessage(from, { 
                text: "🚨 *ALERTA DE SUPERVISIÓN ACTIVADA*

Se ha notificado de inmediato a Aaron Benjamin para revisar tu caso y darte soporte personalizado en breve." 
            });
            console.log(`[ALERTA DE SUPERVISIÓN URGENTE] Cliente ${from} requiere asistencia manual.`);
            return;
        }

        // 3. Respuesta automática por defecto del bot de soporte
        await sock.sendMessage(from, { 
            text: "Hola, soy el asistente automatizado de BotEnterprise. Si adquiriste una licencia en la web, envía tu comprobante o escribe *SUPERVISION* para contactar directamente con el administrador." 
        });
    });
}

connectBot();
