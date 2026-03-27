import makeWASocket, { 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { BaileysClientWrapper, BaileysMessageWrapper } from './BaileysAdapter.js';
import { useSqliteAuthState } from './SqliteAuthState.js';
import queueService from './QueueService.js';

class InstanceManager {
    constructor() {
        this.instances = new Map();
        this.maxInstances = 20;
    }

    async initInstance(id) {
        if (this.instances.has(id)) {
            return { success: false, message: `L'instance ${id} est déjà initialisée.` };
        }

        if (this.instances.size >= this.maxInstances) {
            return { success: false, message: `Limite d'instances atteinte (${this.maxInstances}).` };
        }

        console.log(`[Manager] Initialisation de l'instance Baileys SQLite ${id}...`);

        try {
            const { state, saveCreds } = await useSqliteAuthState(id);
            const { version } = await fetchLatestBaileysVersion();

            const makeWASocketFunc = typeof makeWASocket === 'function' ? makeWASocket : makeWASocket.default;
            const sock = makeWASocketFunc({
                version,
                printQRInTerminal: false,
                auth: state,
                logger: pino({ level: 'silent' }),
                browser: ['Wadagni-Talata', 'Chrome', '1.0.0']
            });

            const clientWrapper = new BaileysClientWrapper(sock);

            const instanceData = {
                id,
                sock,
                client: clientWrapper, // Pour compatibilité avec BotLogic
                status: 'initializing',
                qr: null,
                ready: false
            };

            this.instances.set(id, instanceData);

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    console.log(`[Instance ${id}] QR RECEIVED`);
                    instanceData.qr = qr;
                    instanceData.status = 'awaiting_scan';
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect.error instanceof Boom) 
                        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                        : true;
                    
                    console.log(`[Instance ${id}] Connection fermée. Reconnexion: ${shouldReconnect}`);
                    instanceData.ready = false;
                    instanceData.status = 'disconnected';

                    if (shouldReconnect) {
                        this.instances.delete(id);
                        this.initInstance(id);
                    } else {
                        this.instances.delete(id);
                    }
                } else if (connection === 'open') {
                    console.log(`[Instance ${id}] Client prêt !`);
                    instanceData.ready = true;
                    instanceData.status = 'ready';
                    instanceData.qr = null;
                }
            });

            sock.ev.on('messages.upsert', async (upsert) => {
                if (upsert.type === 'notify') {
                    for (const msg of upsert.messages) {
                        if (!msg.key.fromMe && msg.message) {
                            const messageWrapper = new BaileysMessageWrapper(msg, sock);
                            // Passer le wrapper au service de file d'attente
                            queueService.processMessage(id, clientWrapper, messageWrapper);
                        }
                    }
                }
            });

            return { success: true, message: `Initialisation de l'instance ${id} démarrée.` };
        } catch (error) {
            console.error(`[InstanceManager] Erreur lors de l'initialisation de ${id}:`, error);
            return { success: false, message: `Erreur d'initialisation: ${error.message}` };
        }
    }

    getInstance(id) {
        return this.instances.get(id);
    }

    getAllInstances() {
        return Array.from(this.instances.values()).map(inst => ({
            id: inst.id,
            status: inst.status,
            ready: inst.ready,
            hasQr: !!inst.qr
        }));
    }

    async stopInstance(id) {
        const instance = this.instances.get(id);
        if (instance) {
            instance.sock.logout();
            this.instances.delete(id);
            return true;
        }
        return false;
    }
}

export default new InstanceManager();