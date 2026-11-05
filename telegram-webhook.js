const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ekbgsobjbyezmntoyghw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_YvHojFGiTHT2n1Z3JRvodw_JV-X3ZI3";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(200).send('BotEnterprise Telegram Webhook Endpoint Active.');
    }

    const body = req.body;
    if (!body || !body.callback_query) {
        return res.status(200).send('OK');
    }

    const callbackQuery = body.callback_query;
    const data = callbackQuery.data; // Formato: "approve:OP_ID:PRICE" o "reject:OP_ID:PRICE"
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;

    if (!data) return res.status(200).send('OK');

    const parts = data.split(':');
    const action = parts[0];
    const opId = parts[1];
    const price = parseFloat(parts[2]);

    try {
        // Obtener la configuración actual de Supabase
        const { data: configData, error: fetchError } = await supabase
            .from('config')
            .select('*')
            .eq('id', 1)
            .single();

        let appData = configData?.content || { approvedOps: {} };
        if (!appData.approvedOps) appData.approvedOps = {};

        let newText = "";

        if (action === 'approve') {
            appData.approvedOps[opId] = price;

            // Guardar datos actualizados en Supabase
            await supabase
                .from('config')
                .upsert({ id: 1, content: appData });

            newText = `✅ *N° DE OPERACIÓN APROBADO*\n\n*Operación:* \`${opId}\`\n*Monto:* $${price.toLocaleString('es-AR')} ARS\n\nEl cliente ya puede ingresar su comprobante en la web y recibir su código de activación al instante.`;
        } else if (action === 'reject') {
            delete appData.approvedOps[opId];

            await supabase
                .from('config')
                .upsert({ id: 1, content: appData });

            newText = `❌ *PAGO RECHAZADO*\n\n*Operación:* \`${opId}\`\n*Monto:* $${price.toLocaleString('es-AR')} ARS\n\nLa operación ha sido denegada por el administrador.`;
        }

        // Responder al usuario en Telegram editando el mensaje original
        if (TELEGRAM_BOT_TOKEN) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: newText,
                    parse_mode: 'Markdown'
                })
            });

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callback_query_id: callbackQuery.id,
                    text: action === 'approve' ? '¡Operación aprobada!' : 'Operación rechazada.'
                })
            });
        }
    } catch (err) {
        console.error('Error en Webhook Telegram:', err);
    }

    return res.status(200).send('OK');
};
