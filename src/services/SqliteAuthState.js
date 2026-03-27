import Database from 'better-sqlite3';
import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import { existsSync, mkdirSync } from 'fs';
import logger from '../config/logger.js';

const SESSIONS_DIR = './sessions';
if (!existsSync(SESSIONS_DIR)) {
    mkdirSync(SESSIONS_DIR);
}

// Initialisation de la base de données unique
export const db = new Database('sessions/database.sqlite');

// Création des tables
db.exec(`
    CREATE TABLE IF NOT EXISTS auth_state (
        session_id TEXT,
        type TEXT,
        id TEXT,
        value TEXT,
        PRIMARY KEY (session_id, type, id)
    );
    
    CREATE TABLE IF NOT EXISTS users (
        whatsapp_id TEXT PRIMARY KEY,
        name TEXT,
        registered_at TEXT
    );
    
    CREATE TABLE IF NOT EXISTS votes (
        whatsapp_id TEXT PRIMARY KEY,
        vote TEXT,
        voted_at TEXT
    );
`);

/**
 * useSqliteAuthState
 * Adaptateur Baileys pour stocker les sessions dans la table auth_state de SQLite.
 */
export async function useSqliteAuthState(sessionId) {
    const table = 'auth_state';

    const writeData = (type, id, value) => {
        const str = JSON.stringify(value, BufferJSON.replacer);
        db.prepare(`INSERT OR REPLACE INTO ${table} (session_id, type, id, value) VALUES (?, ?, ?, ?)`).run(sessionId, type, id, str);
    };

    const readData = (type, id) => {
        const row = db.prepare(`SELECT value FROM ${table} WHERE session_id = ? AND type = ? AND id = ?`).get(sessionId, type, id);
        return row ? JSON.parse(row.value, BufferJSON.reviver) : null;
    };

    const removeData = (type, id) => {
        db.prepare(`DELETE FROM ${table} WHERE session_id = ? AND type = ? AND id = ?`).run(sessionId, type, id);
    };

    const creds = readData('creds', 'main') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        let value = readData(type, id);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            if (value) {
                                writeData(category, id, value);
                            } else {
                                removeData(category, id);
                            }
                        }
                    }
                }
            }
        },
        saveCreds: () => {
            writeData('creds', 'main', creds);
        }
    };
}

/**
 * persistence
 * Objet utilitaire pour gérer les utilisateurs et les votes localement.
 */
export const persistence = {
    getUser(whatsappId) {
        return db.prepare('SELECT * FROM users WHERE whatsapp_id = ?').get(whatsappId);
    },

    saveUser(whatsappId, name = null) {
        db.prepare('INSERT OR REPLACE INTO users (whatsapp_id, name, registered_at) VALUES (?, ?, ?)')
            .run(whatsappId, name, new Date().toISOString());
    },

    saveVote(whatsappId) {
        db.prepare('INSERT OR REPLACE INTO votes (whatsapp_id, vote, voted_at) VALUES (?, ?, ?)')
            .run(whatsappId, 'oui', new Date().toISOString());
    }
};
