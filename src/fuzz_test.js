import botLogic from './services/BotLogic.js';
import stateService from './services/StateService.js';
import { db } from './services/SqliteAuthState.js';

// Configuration du test de fuzzing
const TEST_JID = '22941438809@s.whatsapp.net';
const FROM = '22941438809';

// Mock typing delay to speed up tests
const originalTimeout = global.setTimeout;
global.setTimeout = (fn, delay) => {
    if (delay === 1500) return fn(); // Bypass bot typing delay
    return originalTimeout(fn, delay);
};

class MockChat {
    async sendStateTyping() { return Promise.resolve(); }
    async clearState() { return Promise.resolve(); }
}

class MockMessage {
    constructor(body = '', hasMedia = false) {
        this.from = TEST_JID;
        this.body = body;
        this.hasMedia = hasMedia;
    }
    async getChat() { return new MockChat(); }
    async getContact() { return { pushname: 'Fuzzer User', name: 'Fuzzer User' }; }
}

class MockClient {
    constructor() {
        this.sentMessages = [];
    }
    async sendMessage(jid, content, options = {}) {
        const text = typeof content === 'string' ? content : (content.caption || '[Media]');
        this.sentMessages.push({ jid, text });
        process.stdout.write(`  📩 Message sortant vers ${jid}: ${text.substring(0, 40).replace(/\n/g, ' ')}...\n`);
        return Promise.resolve();
    }
}

async function runFuzzTest() {
    process.stdout.write('🚀 DÉMARRAGE DU FUZZING TEST SUR LE NUMÉRO 22941438809...\n');
    const client = new MockClient();

    const testInputs = [
        { label: 'Premier contact', body: 'Bonjour', hasMedia: false },
        { label: 'Menu Section 1', body: '1' },
        { label: 'Menu Section 2', body: '2' },
        { label: 'Retour au menu (0)', body: '0' },
        { label: 'Menu Section 7', body: '7' },
        { label: 'Profil Jeune (Section 7)', body: '1' },
        { label: 'Retour Menu (0)', body: '0' },
        { label: 'Menu Section 8', body: '8' },
        { label: 'Difficulté Argent (Section 8)', body: '1' },
        { label: 'Menu Section 9 (Vote)', body: '9' },
        { label: 'Vote OUI', body: '1' },
        { label: 'Entrée invalide (Lettre)', body: 'abc' },
        { label: 'Entrée invalide (Grand nombre)', body: '99' },
        { label: 'Media entrant', body: '', hasMedia: true },
        { label: 'Retour menu final (0)', body: '0' },
    ];

    let successCount = 0;
    let errorCount = 0;

    // Reset state for the test user
    stateService.clearState(FROM);

    for (const input of testInputs) {
        process.stdout.write(`\n🧪 TEST: ${input.label} (Input: "${input.body}"${input.hasMedia ? ' + Media' : ''})\n`);
        const msg = new MockMessage(input.body, input.hasMedia);
        
        try {
            await botLogic.handleMessage(client, msg);
            successCount++;
        } catch (error) {
            process.stdout.write(`❌ ÉCHEC DU TEST: ${input.label}\n`);
            console.error(error);
            errorCount++;
        }
    }

    process.stdout.write('\n--- 📊 RÉSULTAT DU FUZZING ---\n');
    process.stdout.write(`✅ Succès: ${successCount}\n`);
    process.stdout.write(`❌ Échecs: ${errorCount}\n`);
    process.stdout.write('-----------------------------\n');

    if (errorCount === 0) {
        process.stdout.write('✨ Test terminé avec succès. Le bot est robuste !\n');
    } else {
        process.stdout.write('⚠️ Des problèmes ont été détectés durant le test.\n');
    }

    // Force exit as better-sqlite3 might keep the event loop open
    process.exit(0);
}

runFuzzTest().catch(err => {
    console.error('Fatal error during fuzz test:', err);
    process.exit(1);
});
