import express from 'express';
import instanceManager from './services/InstanceManager.js';
import qrcode from 'qrcode';
import dotenv from 'dotenv';
import path from 'path';
import { persistence } from './services/SqliteAuthState.js';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || '';

app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE — Authentification API Key (pour routes /meetings write)
// ─────────────────────────────────────────────────────────────────────────────
function requireApiKey(req, res, next) {
    if (!API_KEY) {
        return res.status(500).json({ error: 'API_KEY non configurée sur le serveur.' });
    }
    const key = req.headers['x-api-key'];
    if (!key || key !== API_KEY) {
        return res.status(401).json({ error: 'Clé API invalide ou manquante.' });
    }
    next();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES — Instances WhatsApp
// ─────────────────────────────────────────────────────────────────────────────

// Initialize a new instance
app.post('/instances/init/:id', async (req, res) => {
    const { id } = req.params;
    const result = await instanceManager.initInstance(id);
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// Get status of all instances
app.get('/instances/status', (req, res) => {
    const statuses = instanceManager.getAllInstances();
    res.json(statuses);
});

// Get QR code for a specific instance
app.get('/instances/qr/:id', async (req, res) => {
    const { id } = req.params;
    const instance = instanceManager.getInstance(id);
    
    if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
    }
    
    if (instance.status === 'ready') {
        return res.json({ message: 'Instance is already connected' });
    }
    
    if (!instance.qr) {
        return res.status(202).json({ message: 'QR code not yet generated, please wait or check status' });
    }

    try {
        const qrImage = await qrcode.toDataURL(instance.qr);
        res.send(`<img src="${qrImage}" />`);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate QR image' });
    }
});

// Stop an instance
app.post('/instances/stop/:id', async (req, res) => {
    const { id } = req.params;
    const success = await instanceManager.stopInstance(id);
    if (success) {
        res.json({ message: `Instance ${id} stopped` });
    } else {
        res.status(404).json({ error: 'Instance not found' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES — Tournée & Meetings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /meetings
 * Liste toutes les localités avec leur statut (contenu disponible ou non)
 */
app.get('/meetings', (req, res) => {
    const localities = persistence.getAllLocalitiesWithStatus();
    res.json({
        total: localities.length,
        localities: localities.map(loc => ({
            id: loc.id,
            name: loc.name,
            department: loc.department,
            day: loc.day,
            date: loc.date,
            meeting_number: loc.meeting_number,
            meeting_size: loc.meeting_size,
            has_content: loc.has_content === 1,
            updated_at: loc.updated_at || null,
        }))
    });
});

/**
 * GET /meetings/:id
 * Détail d'une localité + son contenu de meeting
 */
app.get('/meetings/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide.' });

    const locality = persistence.getLocality(id);
    if (!locality) return res.status(404).json({ error: 'Localité introuvable.' });

    const content = persistence.getMeetingContent(id);
    res.json({
        ...locality,
        content: content ? content.content : null,
        updated_at: content ? content.updated_at : null,
    });
});

/**
 * POST /meetings/:id/content
 * Ajouter ou mettre à jour le discours d'une localité
 * Header requis : X-API-Key
 * Body : { "content": "Texte du discours..." }
 */
app.post('/meetings/:id/content', requireApiKey, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide.' });

    const locality = persistence.getLocality(id);
    if (!locality) return res.status(404).json({ error: 'Localité introuvable.' });

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: 'Le champ "content" est requis et ne peut pas être vide.' });
    }

    persistence.saveMeetingContent(id, content.trim());
    console.log(`[API] Contenu meeting mis à jour pour localité #${id} (${locality.name})`);

    res.json({
        success: true,
        message: `Contenu du meeting de ${locality.name} enregistré.`,
        locality_id: id,
        name: locality.name,
        updated_at: new Date().toISOString(),
    });
});

/**
 * DELETE /meetings/:id/content
 * Supprimer le contenu d'une localité
 * Header requis : X-API-Key
 */
app.delete('/meetings/:id/content', requireApiKey, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide.' });

    const locality = persistence.getLocality(id);
    if (!locality) return res.status(404).json({ error: 'Localité introuvable.' });

    persistence.deleteMeetingContent(id);
    console.log(`[API] Contenu meeting supprimé pour localité #${id} (${locality.name})`);

    res.json({
        success: true,
        message: `Contenu du meeting de ${locality.name} supprimé.`,
    });
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(port, () => {
    console.log(`Management API listening at http://localhost:${port}`);
    console.log(`Meetings API disponible sur :`);
    console.log(`  GET    http://localhost:${port}/meetings`);
    console.log(`  GET    http://localhost:${port}/meetings/:id`);
    console.log(`  POST   http://localhost:${port}/meetings/:id/content  [X-API-Key requis]`);
    console.log(`  DELETE http://localhost:${port}/meetings/:id/content  [X-API-Key requis]`);
});