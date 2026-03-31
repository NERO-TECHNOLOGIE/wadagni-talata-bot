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

    CREATE TABLE IF NOT EXISTS localities (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        day TEXT,
        date TEXT,
        meeting_number INTEGER,
        meeting_size TEXT
    );

    CREATE TABLE IF NOT EXISTS meeting_content (
        locality_id INTEGER PRIMARY KEY,
        content TEXT,
        updated_at TEXT,
        FOREIGN KEY (locality_id) REFERENCES localities(id)
    );
`);

// ─────────────────────────────────────────────────────────────────────────────
// SEED DES 49 LOCALITÉS DE LA TOURNÉE
// ─────────────────────────────────────────────────────────────────────────────
const LOCALITIES_SEED = [
    // J01 — Vendredi 27 Mars 2026
    { id: 1,  name: 'Kandi',                      department: 'Alibori',   day: 'J01', date: '2026-03-27', meeting_number: 1,  meeting_size: 'Grand' },
    { id: 2,  name: 'Banikoara',                   department: 'Alibori',   day: 'J01', date: '2026-03-27', meeting_number: 2,  meeting_size: 'Moyen' },
    { id: 3,  name: 'Ségbana',                     department: 'Alibori',   day: 'J01', date: '2026-03-27', meeting_number: 3,  meeting_size: 'Petit' },
    // J02 — Samedi 28 Mars 2026
    { id: 4,  name: 'Parakou',                     department: 'Borgou',    day: 'J02', date: '2026-03-28', meeting_number: 4,  meeting_size: 'Grand' },
    { id: 5,  name: 'Bembéréké',                   department: 'Borgou',    day: 'J02', date: '2026-03-28', meeting_number: 5,  meeting_size: 'Moyen' },
    { id: 6,  name: 'Nikki',                       department: 'Borgou',    day: 'J02', date: '2026-03-28', meeting_number: 6,  meeting_size: 'Grand' },
    // J03 — Dimanche 29 Mars 2026
    { id: 7,  name: 'Natitingou',                  department: 'Atacora',   day: 'J03', date: '2026-03-29', meeting_number: 7,  meeting_size: 'Moyen' },
    { id: 8,  name: 'Kouandé',                     department: 'Atacora',   day: 'J03', date: '2026-03-29', meeting_number: 8,  meeting_size: 'Moyen' },
    { id: 9,  name: 'Tanguéta',                    department: 'Atacora',   day: 'J03', date: '2026-03-29', meeting_number: 9,  meeting_size: 'Petit' },
    { id: 10, name: 'Djougou',                     department: 'Donga',     day: 'J03', date: '2026-03-29', meeting_number: 10, meeting_size: 'Grand' },
    // J04 — Lundi 30 Mars 2026
    { id: 11, name: 'Tchaourou',                   department: 'Borgou',    day: 'J04', date: '2026-03-30', meeting_number: 11, meeting_size: 'Moyen' },
    { id: 12, name: 'Savè',                        department: 'Collines',  day: 'J04', date: '2026-03-30', meeting_number: 12, meeting_size: 'Moyen' },
    { id: 13, name: 'Dassa',                       department: 'Collines',  day: 'J04', date: '2026-03-30', meeting_number: 13, meeting_size: 'Moyen' },
    { id: 14, name: 'Savalou',                     department: 'Collines',  day: 'J04', date: '2026-03-30', meeting_number: 14, meeting_size: 'Moyen' },
    // J05 — Mardi 31 Mars 2026
    { id: 15, name: 'Bohicon',                     department: 'Zou',       day: 'J05', date: '2026-03-31', meeting_number: 15, meeting_size: 'Grand' },
    { id: 16, name: 'Abomey',                      department: 'Zou',       day: 'J05', date: '2026-03-31', meeting_number: 16, meeting_size: 'Grand' },
    { id: 17, name: 'Covè',                        department: 'Zou',       day: 'J05', date: '2026-03-31', meeting_number: 17, meeting_size: 'Moyen' },
    { id: 18, name: 'Agbangninzoun',               department: 'Zou',       day: 'J05', date: '2026-03-31', meeting_number: 18, meeting_size: 'Moyen' },
    { id: 19, name: 'Kétou',                       department: 'Collines',  day: 'J05', date: '2026-03-31', meeting_number: 19, meeting_size: 'Moyen' },
    // J06 — Jeudi 2 Avril 2026
    { id: 20, name: 'Pobè',                        department: 'Plateau',   day: 'J06', date: '2026-04-02', meeting_number: 20, meeting_size: 'Moyen' },
    { id: 21, name: 'Sakété',                      department: 'Plateau',   day: 'J06', date: '2026-04-02', meeting_number: 21, meeting_size: 'Moyen' },
    { id: 22, name: 'Avrankou',                    department: 'Ouémé',     day: 'J06', date: '2026-04-02', meeting_number: 22, meeting_size: 'Petit' },
    { id: 23, name: 'Dangbo',                      department: 'Ouémé',     day: 'J06', date: '2026-04-02', meeting_number: 23, meeting_size: 'Petit' },
    { id: 24, name: 'Porto-Novo',                  department: 'Ouémé',     day: 'J06', date: '2026-04-02', meeting_number: 24, meeting_size: 'Grand' },
    { id: 25, name: 'Sèmè-Kpodji',                department: 'Ouémé',     day: 'J06', date: '2026-04-02', meeting_number: 25, meeting_size: 'Moyen' },
    // J07 — Vendredi 3 Avril 2026
    { id: 26, name: 'Grand-Popo',                  department: 'Mono',      day: 'J07', date: '2026-04-03', meeting_number: 26, meeting_size: 'Moyen' },
    { id: 27, name: 'Comè',                        department: 'Mono',      day: 'J07', date: '2026-04-03', meeting_number: 27, meeting_size: 'Moyen' },
    { id: 28, name: 'Bopa',                        department: 'Mono',      day: 'J07', date: '2026-04-03', meeting_number: 28, meeting_size: 'Moyen' },
    { id: 29, name: 'Houéyogbé',                   department: 'Mono',      day: 'J07', date: '2026-04-03', meeting_number: 29, meeting_size: 'Moyen' },
    { id: 30, name: 'Athiémé',                     department: 'Mono',      day: 'J07', date: '2026-04-03', meeting_number: 30, meeting_size: 'Moyen' },
    { id: 31, name: 'Lokossa',                     department: 'Mono',      day: 'J07', date: '2026-04-03', meeting_number: 31, meeting_size: 'Grand' },
    // J08 — Samedi 4 Avril 2026
    { id: 32, name: 'Dogbo',                       department: 'Couffo',    day: 'J08', date: '2026-04-04', meeting_number: 32, meeting_size: 'Moyen' },
    { id: 33, name: 'Toviklin',                    department: 'Couffo',    day: 'J08', date: '2026-04-04', meeting_number: 33, meeting_size: 'Moyen' },
    { id: 34, name: 'Lalo',                        department: 'Couffo',    day: 'J08', date: '2026-04-04', meeting_number: 34, meeting_size: 'Moyen' },
    { id: 35, name: 'Klouékanmè',                  department: 'Couffo',    day: 'J08', date: '2026-04-04', meeting_number: 35, meeting_size: 'Moyen' },
    { id: 36, name: 'Djakotomey',                  department: 'Couffo',    day: 'J08', date: '2026-04-04', meeting_number: 36, meeting_size: 'Moyen' },
    { id: 37, name: 'Aplahoué',                    department: 'Couffo',    day: 'J08', date: '2026-04-04', meeting_number: 37, meeting_size: 'Moyen' },
    // J09 — Lundi 6 Avril 2026
    { id: 38, name: 'Pahou',                       department: 'Atlantique',day: 'J09', date: '2026-04-06', meeting_number: 38, meeting_size: 'Moyen' },
    { id: 39, name: 'Toffo',                       department: 'Atlantique',day: 'J09', date: '2026-04-06', meeting_number: 39, meeting_size: 'Moyen' },
    { id: 40, name: 'Allada',                      department: 'Atlantique',day: 'J09', date: '2026-04-06', meeting_number: 40, meeting_size: 'Moyen' },
    // J10 — Mardi 7 Avril 2026
    { id: 41, name: 'Zè',                          department: 'Atlantique',day: 'J10', date: '2026-04-07', meeting_number: 41, meeting_size: 'Moyen' },
    { id: 42, name: 'Calavi',                      department: 'Atlantique',day: 'J10', date: '2026-04-07', meeting_number: 42, meeting_size: 'Grand' },
    { id: 43, name: 'Hèvié',                       department: 'Atlantique',day: 'J10', date: '2026-04-07', meeting_number: 43, meeting_size: 'Moyen' },
    { id: 44, name: 'Godomey',                     department: 'Atlantique',day: 'J10', date: '2026-04-07', meeting_number: 44, meeting_size: 'Moyen' },
    // J12 — Vendredi 10 Avril 2026 — CLÔTURE
    { id: 45, name: 'Cotonou 12e Arrondissement',  department: 'Littoral',  day: 'J12', date: '2026-04-10', meeting_number: 45, meeting_size: 'Moyen' },
    { id: 46, name: 'Cotonou 8e Arrondissement',   department: 'Littoral',  day: 'J12', date: '2026-04-10', meeting_number: 46, meeting_size: 'Moyen' },
    { id: 47, name: 'Cotonou 3e Arrondissement',   department: 'Littoral',  day: 'J12', date: '2026-04-10', meeting_number: 47, meeting_size: 'Moyen' },
    { id: 48, name: 'Cotonou 6e Arrondissement',   department: 'Littoral',  day: 'J12', date: '2026-04-10', meeting_number: 48, meeting_size: 'Moyen' },
    { id: 49, name: 'Marché Dantokpa',             department: 'Littoral',  day: 'J12', date: '2026-04-10', meeting_number: 49, meeting_size: 'Grand' },
];

// Seed des localités (INSERT OR IGNORE pour ne pas écraser)
const insertLocality = db.prepare(`
    INSERT OR IGNORE INTO localities (id, name, department, day, date, meeting_number, meeting_size)
    VALUES (@id, @name, @department, @day, @date, @meeting_number, @meeting_size)
`);
const seedLocalities = db.transaction((localities) => {
    for (const loc of localities) insertLocality.run(loc);
});
seedLocalities(LOCALITIES_SEED);


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
 * Objet utilitaire pour gérer les utilisateurs, les votes et les meetings localement.
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
    },

    // ── Localités ──────────────────────────────────────────────────────────

    getAllLocalities() {
        return db.prepare('SELECT * FROM localities ORDER BY id ASC').all();
    },

    getLocality(id) {
        return db.prepare('SELECT * FROM localities WHERE id = ?').get(id);
    },

    // ── Contenu des meetings ────────────────────────────────────────────────

    getMeetingContent(localityId) {
        return db.prepare('SELECT * FROM meeting_content WHERE locality_id = ?').get(localityId);
    },

    saveMeetingContent(localityId, content) {
        db.prepare(`
            INSERT INTO meeting_content (locality_id, content, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(locality_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
        `).run(localityId, content, new Date().toISOString());
    },

    deleteMeetingContent(localityId) {
        db.prepare('DELETE FROM meeting_content WHERE locality_id = ?').run(localityId);
    },

    getAllLocalitiesWithStatus() {
        return db.prepare(`
            SELECT l.*, 
                   CASE WHEN mc.content IS NOT NULL THEN 1 ELSE 0 END AS has_content,
                   mc.updated_at
            FROM localities l
            LEFT JOIN meeting_content mc ON mc.locality_id = l.id
            ORDER BY l.id ASC
        `).all();
    },
};
