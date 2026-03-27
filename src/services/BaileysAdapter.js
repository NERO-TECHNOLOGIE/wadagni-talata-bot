/**
 * BaileysAdapter.js
 * 
 * Adaptateur léger qui expose une interface compatible avec le BotLogic
 * (initialement écrit pour whatsapp-web.js) en utilisant Baileys.
 * 
 * Baileys n'utilise pas Puppeteer/Chromium → très léger en ressources.
 */

import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// WRAPPER CLIENT — imite "client" de whatsapp-web.js
// ─────────────────────────────────────────────────────────────────────────────

export class BaileysClientWrapper {
    constructor(sock) {
        this.sock = sock;
    }

    /**
     * Envoie un message texte ou image.
     * Remplace : client.sendMessage(jid, text) et client.sendMessage(jid, media, { caption })
     */
    async sendMessage(jid, content, options = {}) {
        try {
            if (content && content._isBaileysMedia) {
                // Envoi d'une image/média
                await this.sock.sendMessage(jid, {
                    image: content.buffer,
                    caption: options.caption || content.caption || ''
                });
            } else if (typeof content === 'string') {
                // Envoi d'un message texte
                await this.sock.sendMessage(jid, { text: content });
            }
        } catch (error) {
            console.error(`[BaileysClient] sendMessage error to ${jid}:`, error.message);
            throw error;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// WRAPPER MÉDIA — imite "MessageMedia" de whatsapp-web.js
// ─────────────────────────────────────────────────────────────────────────────

export class BaileysMedia {
    constructor(buffer, mimetype = 'image/jpeg') {
        this.buffer = buffer;
        this.mimetype = mimetype;
        this.caption = '';
        this._isBaileysMedia = true;
    }

    /**
     * Crée un BaileysMedia depuis un fichier local.
     * Remplace : MessageMedia.fromFilePath(path)
     */
    static fromFilePath(filePath) {
        const buffer = fs.readFileSync(filePath);
        const ext = filePath.split('.').pop().toLowerCase();
        const mimetypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
        return new BaileysMedia(buffer, mimetypes[ext] || 'image/jpeg');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// WRAPPER MESSAGE — imite "msg" de whatsapp-web.js
// ─────────────────────────────────────────────────────────────────────────────

export class BaileysMessageWrapper {
    constructor(rawMsg, sock) {
        this.sock = sock;
        this.rawMsg = rawMsg;

        // JID complet (ex: 22997123456@s.whatsapp.net)
        this.from = rawMsg.key.remoteJid;

        // Texte du message
        this.body = rawMsg.message?.conversation
            || rawMsg.message?.extendedTextMessage?.text
            || rawMsg.message?.buttonsResponseMessage?.selectedDisplayText
            || rawMsg.message?.listResponseMessage?.title
            || '';

        // Détection média entrant
        this.hasMedia = !!(
            rawMsg.message?.imageMessage
            || rawMsg.message?.videoMessage
            || rawMsg.message?.audioMessage
            || rawMsg.message?.documentMessage
        );

        // Nom affiché du contact
        this._pushName = rawMsg.pushName || null;
    }

    /**
     * Simule msg.getChat() → retourne typing controls
     */
    async getChat() {
        const jid = this.from;
        const sock = this.sock;
        return {
            sendStateTyping: async () => {
                try {
                    await sock.sendPresenceUpdate('composing', jid);
                } catch (e) {
                    // silencieux
                }
            },
            clearState: async () => {
                try {
                    await sock.sendPresenceUpdate('paused', jid);
                } catch (e) {
                    // silencieux
                }
            }
        };
    }

    /**
     * Simule msg.getContact() → retourne infos contact
     */
    async getContact() {
        return {
            pushname: this._pushName,
            name: this._pushName
        };
    }
}
