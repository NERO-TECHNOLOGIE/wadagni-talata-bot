import stateService from './StateService.js';
import { persistence } from './SqliteAuthState.js';
import { BaileysMedia } from './BaileysAdapter.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Chemin vers l'image de présentation WADAGNI-TALATA
const IMAGE_PATH = path.join(__dirname, '..', 'jeu. 26 mars 2026 15:44:17.png');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
// TODO: Modifier ce numéro par le bon numéro de réception (format: 229XXXXXXXX)
const NOTIFICATION_NUMBER = '22997724561@s.whatsapp.net';

// ─────────────────────────────────────────────────────────────────────────────
// CONTENU DU PROGRAMME WADAGNI-TALATA
// ─────────────────────────────────────────────────────────────────────────────

const MENU_PRINCIPAL = `🇧🇯 *BIENVENUE !*

Voici le programme *WADAGNI-TALATA* expliqué simplement :

1- *Bien vivre au Bénin* (Santé, social)
2- *Éducation & formation*
3- *Travail & argent*
4- *Agriculture & transformation*
5- *Infrastructures & cadre de vie*
6- *Technologie & innovation*
7- *Après le 12 avril 2026* (Ce qui change pour moi)
8- *Mes difficultés aujourd'hui*
9- *Résumé du programme de société*

👉 *Choisis un numéro entre 1 et 9* pour continuer`;

const MENU_RETOUR = `\n\n─────────────────\n👉 Tape *0* pour revenir au menu principal`;

const SECTIONS = {
    '1': `1- *BIEN VIVRE AU BÉNIN (SOCIAL + SANTÉ)*

*Ce qui a déjà été fait :*
• Construction et modernisation d'hôpitaux
• Programme ARCH pour aider les plus vulnérables
• Plus de personnel de santé

---

*Maintenant, le programme veut aller plus loin :*

🏥 *Urgences vitales prises en charge pour tous*
→ personne ne doit mourir faute d'argent

📱 *Carnet de santé digital*
→ ton historique médical disponible partout

💻 *Télémédecine*
→ consulter un médecin même à distance

🏗️ *Nouveaux centres hospitaliers modernes*
(ex : Le CHIP de Parakou)

---

*En clair :*
Tu peux te soigner plus facilement, plus rapidement et partout.`,

    '2': `2- *ÉDUCATION & FORMATION*

*Ce qui a été fait :*
• Plus d'écoles construites
• Cantines scolaires généralisées
• Accès élargi à l'éducation

---

*Mais maintenant il faut changer la suite :*

🆔 *Suivi de chaque élève*
→ identifiant unique pour ne perdre personne

💻 *Classes numériques*
→ apprendre avec les outils modernes

🔧 *Centres de formation aux métiers*
→ numérique, industrie, technique

🏙️ *Développement de Sèmè City*
→ hub d'innovation et de formation

👨‍🏫 *Formation des enseignants renforcée*

---

*En clair :*
L'école ne doit pas seulement former, elle doit préparer directement au travail.`,

    '3': `3- *TRAVAIL & ARGENT (ÉCONOMIE)*

*Ce qui a été fait :*
• Économie plus structurée
• Climat des affaires amélioré

---

*Maintenant :*

🗺️ *6 pôles de développement dans le pays*
→ chaque région a son activité principale

🏭 *Développement des industries locales*
💼 *Soutien aux PME et entrepreneurs*
👷 *Création d'emplois proches des populations*
🌍 *Développement du tourisme*

---

*En clair :*
Tu n'es plus obligé d'aller loin pour trouver du travail. Les opportunités viennent vers toi.`,

    '4': `4- *AGRICULTURE & TRANSFORMATION*

*Ce qui a été fait :*
• Augmentation massive de la production agricole

*Le problème :*
Le Bénin vend encore ses produits bruts → on gagne donc peu.

---

*Ce que le programme change :*

🏭 *Transformation locale* (usines et unités)
🔗 *Chaînes de valeur agricoles*
→ produire → transformer → vendre
👥 *Organisation des producteurs*
🛒 *Accès facilité aux marchés*

---

*En clair :*
Le pays ne vend plus seulement des matières premières. Il gagne plus avec ce qu'il produit.`,

    '5': `5- *INFRASTRUCTURES & CADRE DE VIE*

*Ce qui a été fait :*
• Routes construites et améliorées (Asphaltage)
• Accès à l'eau potable amélioré
• Villes modernisées

---

*Maintenant :*

🛣️ *Continuer les routes utiles*
→ pas juste construire, mais connecter les zones de production.

💧 *Eau potable pour tous*
⚡ *Énergie plus disponible et stable*
🏘️ *Amélioration constante des villes et villages*

---

*En clair :*
Se déplacer, vivre et travailler devient beaucoup plus simple.`,

    '6': `6- *TECHNOLOGIE & INNOVATION*

*Ce qui a commencé :*
• Digitalisation de plusieurs services publics
• Développement de Sèmè City

---

*Maintenant :*

🖥️ *Services publics 100% en ligne*
→ moins de déplacements et de pertes de temps.

🏥 *Le numérique dans la santé et l'éducation*
🤖 *Développement de l'Intelligence Artificielle*
📡 *Inclusion numérique* (tout le monde connecté)

---

*En clair :*
Le numérique doit simplifier ta vie, pas la compliquer.`,
};

const SECTION_7_MENU = `7- *CE QUI VA CHANGER POUR MOI APRÈS LE 12 AVRIL 2026*

Quelle est ta situation actuelle ?

1- Jeune
2- Je me débrouille
3- Je fais du commerce
4- Je travaille (salarié, fonctionnaire)
5- Agriculteur
6- En difficultés

👉 *Choisis un numéro entre 1 et 6* pour continuer !`;

const SECTION_7_CONTENT = {
    '1': `🌟 *SI TU ES JEUNE*

Aujourd'hui :
Tu cherches ta voie, et souvent, ce n'est pas clair.

*Ce qui a déjà changé :*
• Plus d'accès à l'école.
• Développement du numérique (Sèmè City).

---

*Maintenant, concrètement pour toi :*

📚 *Tu peux apprendre un vrai métier*
→ centres de formation (numérique, technique).

📍 *Tu peux trouver une opportunité près de chez toi*
→ grâce aux pôles économiques régionaux.

🚀 *Tu peux lancer une activité*
→ avec un accompagnement dédié.

💻 *Tu peux travailler dans le digital*
→ nouvelles opportunités sans quitter le pays.

---

*Imagine :*
Tu ne passes plus des années à chercher. Tu avances étape par étape.
Le programme transforme : *"je me cherche"* → *"je construis ma vie"*`,

    '2': `📈 *SI TU "TE DÉBROUILLES"*

Aujourd'hui :
Tu travailles tous les jours, mais c'est souvent instable.

*Ce qui a déjà changé :*
• Plus de routes pour circuler.
• Plus de dynamisme dans les villes.

---

*Maintenant, concrètement pour toi :*

📈 *Plus d'activités autour de toi*
→ donc plus de clients potentiels.

📚 *Tu peux apprendre autre chose*
→ sans arrêter de travailler (formations courtes).

🪜 *Tu peux évoluer petit à petit*
→ vers un métier plus stable et reconnu.

🛡️ *Tu entres dans le système*
→ accès aux aides et à la protection sociale.

---

*Imagine :*
Aujourd'hui tu te débrouilles, demain tu progresses réellement.
Le programme transforme : *"je survis"* → *"je progresse"*`,

    '3': `💰 *SI TU FAIS DU COMMERCE*

Aujourd'hui :
Tu te bats chaque jour pour vendre et garder ton capital.

*Ce qui a déjà changé :*
• Le commerce est plus dynamique.
• Certains marchés ont été modernisés.

---

*Maintenant, pour toi :*

💰 *Tu perds moins d'argent*
→ meilleure organisation des circuits de produits.

🏷️ *Tu peux vendre plus cher*
→ grâce à la transformation locale.

🏦 *Tu peux accéder à du financement*
→ pour faire grandir ton stock.

📲 *Tu sécurises ton argent*
→ généralisation du mobile money.

---

*Imagine :*
Ton activité devient stable et tu peux enfin faire grandir ton commerce.
Le programme transforme : *"je vends pour vivre"* → *"je développe mon activité"*`,

    '4': `🌟 *SI TU TRAVAILLES (SALARIÉ / FONCTIONNAIRE)*

Aujourd'hui :
Tu gères tout : famille, dépenses, stress du travail.

*Ce qui a déjà changé :*
• Le pays est mieux organisé.
• Les infrastructures facilitent tes déplacements.

---

*Maintenant, pour toi :*

⏱️ *Tu perds moins de temps*
→ tous les services sont digitalisés.

🏥 *Tu te soignes plus sereinement*
→ système de santé modernisé et accessible.

🌟 *Tu as plus d'opportunités de carrière*
🏘️ *Ton cadre de vie s'améliore au quotidien*

---

*Imagine :*
Moins de stress et plus de stabilité pour l'avenir de ta famille.
Le programme transforme : *"je subis"* → *"je maîtrise mieux ma vie"*`,

    '5': `🚜 *SI TU FAIS DE L'AGRICULTURE*

Aujourd'hui :
Tu travailles dur, mais le gain reste limité.

*Ce qui a déjà changé :*
• La production nationale est en forte hausse.

---

*Maintenant, pour toi :*

🏭 *Tu ne vends plus que du brut*
→ le programme mise sur la transformation locale.

💵 *Tu gagnes plus sur le même produit*
🛒 *Tu trouves plus facilement des acheteurs*
🤝 *Tu es mieux organisé* avec d'autres producteurs (coopératives).

---

*Imagine :*
Ton dur labeur te rapporte enfin ce que tu mérites vraiment.
Le programme transforme : *"je produis"* → *"je gagne"*`,

    '6': `🤝 *SI TU ES EN DIFFICULTÉS*

Aujourd'hui :
Parfois, la vie est très dure et on se sent seul.

*Ce qui existe déjà :*
• Le programme social ARCH.

---

*Maintenant, pour toi :*

🆔 *Tu es identifié clairement*
→ tu ne passes plus à côté des aides.

⚡ *Tu reçois l'aide plus rapidement*
🤝 *Tu es accompagné* pour t'en sortir durablement.

---

*Imagine :*
Tu n'es plus seul face aux aléas de la vie.
Le programme transforme : *"je suis oublié"* → *"je suis accompagné"*`,
};

const SECTION_8_MENU = `8- *QUELLES SONT TES DIFFICULTÉS AUJOURD'HUI ?*

1- Trouver de l'argent
2- Trouver du travail
3- Développer mon activité
4- M'occuper de ma famille

👉 Choisis un numéro entre *1 et 4* pour continuer !`;

const SECTION_8_CONTENT = {
    '1': `💸 *TROUVER DE L'ARGENT*

Aujourd'hui au Bénin :
Le vrai problème n'est pas que les gens ne travaillent pas.

*Le problème :*
• Revenus trop faibles.
• Activités instables.
• Peu d'opportunités régulières.

---

*Ce qui a déjà été fait :*
• L'économie est plus structurée.
• Plus d'activités qu'avant.

---

*Ce que le programme change :*

🗺️ *Créer des activités dans chaque région*
→ grâce aux pôles de développement.

🛒 *Développer les petites activités*
→ commerce, artisanat, services de proximité.

🏭 *Transformer localement*
→ pour gagner plus sur chaque produit vendu.

🏦 *Accès à des financements simples*

---

*En clair :*
Tu ne vas plus juste "chercher l'argent". Tu vas avoir de vrais moyens d'en gagner durablement.`,

    '2': `👷‍♂️ *TROUVER DU TRAVAIL*

Aujourd'hui :
Beaucoup cherchent, mais les opportunités manquent souvent là où ils vivent.

*Ce qui a déjà changé :*
• Le pays attire enfin de gros investissements.
• Des secteurs entiers se développent.

---

*Maintenant, il faut aller plus loin :*

📍 *Créer des emplois dans chaque zone*
→ plus besoin de tout quitter pour Cotonou.

🏭 *Développer l'industrie locale*
📚 *Former aux métiers utiles* (pas juste des diplômes).
💻 *Développer le numérique* partout.

---

*En clair :*
Le travail doit être partout au Bénin.
Le programme transforme : *"je cherche du travail"* → *"le travail vient vers moi"*`,

    '3': `🚀 *DÉVELOPPER MON ACTIVITÉ*

Aujourd'hui :
Beaucoup ont une activité, mais stagnent à un petit niveau par manque de moyens.

*Les difficultés :*
• Manque de financement adapté.
• Marché instable.
• Peu d'accompagnement.

---

*Ce que le programme apporte :*

🏦 *Accès au financement adapté*
→ petits crédits et accompagnement réel.

🛒 *Nouveaux marchés*
→ via les pôles économiques.

🏭 *Plus de valeur ajoutée*
→ grâce à la transformation locale.

💻 *Digitalisation*
→ pour mieux gérer et vendre.

---

*En clair :*
Ton activité peut passer de *"petit commerce"* à *"vraie source de revenus stable"*`,

    '4': `👨‍👩‍👧‍👦 *M'OCCUPER DE MA FAMILLE*

Aujourd'hui :
C'est la priorité et la plus grosse pression au quotidien.

*Les défis :*
• Nourrir convenablement.
• Soigner les siens.
• L'avenir des enfants.

---

*Le programme renforce tes capacités :*

🏥 *Santé accessible à tous*
→ urgences gratuites, télémédecine.

🎓 *Éducation plus utile*
→ formations tournées vers l'emploi.

💰 *Plus de revenus*
→ via le dynamisme de l'économie locale.

🛡️ *Aides sociales ciblées* (ARCH).

---

*En clair :*
Tu peux enfin protéger et prévoir l'avenir de ta famille sereinement.`,
};

const SECTION_9 = `9- *RÉSUMÉ DU PROGRAMME DE SOCIÉTÉ*

*On a déjà fait :*
• Construit des routes stratégiques
• Amélioré les services publics
• Stabilisé la paix et l'économie du pays

---

*Maintenant on veut :*
✅ Créer des emplois partout
✅ Améliorer les revenus des foyers
✅ Mieux soigner chaque Béninois
✅ Former pour les vrais métiers de demain
✅ Utiliser le numérique pour simplifier la vie

---

*Objectif :*
Que chaque Béninois ressente concrètement le changement dans sa vie quotidienne.

─────────────────

*Ce programme de société répond-il à tes attentes ?*

*Envoie 1 ou 2 :*
1- *Oui* — Rendez-vous le 12 Avril 2026 ✅
2- *Je souhaite relire le programme* 📖`;

const MSG_OUI = `✅ *Merci pour ton soutien !*

Tu as dit *OUI* au programme WADAGNI-TALATA.
Rendez-vous le *12 Avril 2026* 🗳️

Partage ce bot à tes proches pour les informer aussi !`;

const MSG_RELIRE = `📖 *D'accord, prends le temps de tout relire.*

Rendez-vous le *12 Avril 2026* 🗳️

Tape *0* pour revenir au menu et relire le programme.`;

// ─────────────────────────────────────────────────────────────────────────────
// CLASSE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

class BotLogic {
    async handleMessage(client, msg) {
        const fullId = msg.from;
        const from = this.normalizeId(fullId);
        const text = msg.body ? msg.body.trim() : '';

        // Typing indicator
        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await chat.clearState();
        } catch (e) {
            console.warn(`[BotLogic] Typing state error for ${from}:`, e.message);
        }

        try {
            // Ignorer les médias entrants
            if (msg.hasMedia) {
                return client.sendMessage(fullId, '📸 Je ne traite pas les médias. Envoie un numéro pour naviguer dans le programme.\n\nTape *0* pour revenir au menu principal.');
            }

            const currentFlow = stateService.getCurrentFlow(from);
            const currentStep = stateService.getCurrentStep(from);

            // ── Retour Menu Principal ─────────────────────────────────────────
            if (text === '0') {
                stateService.clearState(from);
                return this.showMainMenu(client, fullId);
            }

            // ── Premier message / Menu Principal ─────────────────────────────
            if (!currentFlow || currentFlow === 'main_menu') {
                // Enregistrer l'utilisateur si nouveau (et envoyer image si 1er contact)
                const isFirstContact = !stateService.getData(from, 'user_checked');
                await this.ensureUserRegistered(from, msg);

                // Envoyer l'image de présentation au 1er contact
                if (isFirstContact) {
                    await this.sendWelcomeImage(client, fullId);
                }

                if (text === '1') return this.sendSection(client, fullId, '1');
                if (text === '2') return this.sendSection(client, fullId, '2');
                if (text === '3') return this.sendSection(client, fullId, '3');
                if (text === '4') return this.sendSection(client, fullId, '4');
                if (text === '5') return this.sendSection(client, fullId, '5');
                if (text === '6') return this.sendSection(client, fullId, '6');
                if (text === '7') return this.showSection7Menu(client, fullId);
                if (text === '8') return this.showSection8Menu(client, fullId);
                if (text === '9') return this.showSection9(client, fullId);

                // Aucune option valide → afficher menu
                return this.showMainMenu(client, fullId);
            }

            // ── Navigation dans les sous-menus ───────────────────────────────
            switch (currentFlow) {
                case 'section_7':
                    return this.handleSection7(client, fullId, text);
                case 'section_8':
                    return this.handleSection8(client, fullId, text);
                case 'section_9':
                    return this.handleSection9Vote(client, fullId, text);
                default:
                    stateService.clearState(from);
                    return this.showMainMenu(client, fullId);
            }

        } catch (error) {
            console.error(`[BotLogic] Error for ${from}:`, error);
            try {
                await client.sendMessage(fullId, '❌ Une erreur est survenue. Tape *0* pour revenir au menu.');
            } catch (e) {
                console.error(`[BotLogic] Failed to send error message:`, e);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENVOI DE L'IMAGE DE PRÉSENTATION
    // ─────────────────────────────────────────────────────────────────────────

    async sendWelcomeImage(client, fullId) {
        try {
            const media = BaileysMedia.fromFilePath(IMAGE_PATH);
            await client.sendMessage(fullId, media, {
                caption: '🇧🇯 *Programme WADAGNI-TALATA*'
            });
            console.log(`[BotLogic] Image de présentation envoyée à ${fullId}`);
        } catch (error) {
            console.warn(`[BotLogic] Impossible d'envoyer l'image:`, error.message);
            // On continue sans l'image si elle est introuvable
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GESTION UTILISATEURS
    // ─────────────────────────────────────────────────────────────────────────

    async ensureUserRegistered(from, msg) {
        const alreadyChecked = stateService.getData(from, 'user_checked');
        if (alreadyChecked) return;

        try {
            // Récupérer le nom du contact WhatsApp si possible
            let displayName = null;
            try {
                const contact = await msg.getContact();
                displayName = contact.pushname || contact.name || null;
            } catch (e) {
                console.warn(`[BotLogic] Could not get contact name for ${from}`);
            }

            const user = persistence.getUser(from);

            if (!user) {
                // Nouveau utilisateur → enregistrement
                persistence.saveUser(from, displayName);
                console.log(`[BotLogic] New user registered locally: ${from} (${displayName || 'no name'})`);
                stateService.addData(from, 'is_new_user', true);
                stateService.addData(from, 'display_name', displayName);
            } else {
                stateService.addData(from, 'is_new_user', false);
                stateService.addData(from, 'display_name', user.name || displayName);
                console.log(`[BotLogic] Known user (local): ${from} (${user.name || displayName})`);
            }

            stateService.addData(from, 'user_checked', true);
        } catch (error) {
            console.error(`[BotLogic] User registration error for ${from}:`, error.message);
            stateService.addData(from, 'user_checked', true);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MENU PRINCIPAL
    // ─────────────────────────────────────────────────────────────────────────

    async showMainMenu(client, fullId) {
        const from = this.normalizeId(fullId);
        const displayName = stateService.getData(from, 'display_name');
        const isNewUser = stateService.getData(from, 'is_new_user');

        let greeting = '';
        if (displayName && !isNewUser) {
            greeting = `👋 *Bonjour ${displayName} !* Content de te revoir.\n\n`;
        } else if (isNewUser) {
            greeting = `👋 *Bienvenue !* Heureux de te compter parmi nous.\n\n`;
        }

        stateService.setState(from, 'main_menu', 'selection');
        return client.sendMessage(fullId, greeting + MENU_PRINCIPAL);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTIONS 1-6 (CONTENU DIRECT)
    // ─────────────────────────────────────────────────────────────────────────

    async sendSection(client, fullId, num) {
        const from = this.normalizeId(fullId);
        const content = SECTIONS[num];
        stateService.setState(from, 'main_menu', 'selection');
        return client.sendMessage(fullId, content + MENU_RETOUR);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 7 — CE QUI VA CHANGER POUR MOI
    // ─────────────────────────────────────────────────────────────────────────

    async showSection7Menu(client, fullId) {
        const from = this.normalizeId(fullId);
        stateService.setState(from, 'section_7', 'choose_profile');
        return client.sendMessage(fullId, SECTION_7_MENU);
    }

    async handleSection7(client, fullId, text) {
        const from = this.normalizeId(fullId);
        const content = SECTION_7_CONTENT[text];
        if (!content) {
            return client.sendMessage(fullId, '❌ Option invalide. Choisis un numéro entre *1 et 6* :\n\n' + SECTION_7_MENU);
        }
        stateService.setState(from, 'main_menu', 'selection');
        return client.sendMessage(fullId, content + MENU_RETOUR);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 8 — QUELLES SONT TES DIFFICULTÉS
    // ─────────────────────────────────────────────────────────────────────────

    async showSection8Menu(client, fullId) {
        const from = this.normalizeId(fullId);
        stateService.setState(from, 'section_8', 'choose_difficulty');
        return client.sendMessage(fullId, SECTION_8_MENU);
    }

    async handleSection8(client, fullId, text) {
        const from = this.normalizeId(fullId);
        const content = SECTION_8_CONTENT[text];
        if (!content) {
            return client.sendMessage(fullId, '❌ Option invalide. Choisis un numéro entre *1 et 4* :\n\n' + SECTION_8_MENU);
        }
        stateService.setState(from, 'main_menu', 'selection');
        return client.sendMessage(fullId, content + MENU_RETOUR);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 9 — RÉSUMÉ + VOTE FINAL
    // ─────────────────────────────────────────────────────────────────────────

    async showSection9(client, fullId) {
        const from = this.normalizeId(fullId);
        stateService.setState(from, 'section_9', 'awaiting_vote');
        return client.sendMessage(fullId, SECTION_9);
    }

    async handleSection9Vote(client, fullId, text) {
        const from = this.normalizeId(fullId);

        if (text === '1') {
            // Vote OUI → enregistrer en base
            try {
                persistence.saveVote(from);
                console.log(`[BotLogic] Vote OUI enregistré localement pour: ${from}`);

                // Notification WhatsApp vers le numéro configuré
                const user = persistence.getUser(from);
                const userName = user ? (user.name || 'Inconnu') : 'Inconnu';

                const notificationText = `🔔 *NOTIFICATION DE VOTE*\n\n` +
                    `👤 *Nom:* ${userName}\n` +
                    `📱 *Numéro:* ${from}\n` +
                    `🗳️ *Vote:* A voté *OUI* au programme WADAGNI-TALATA.`;

                await client.sendMessage(NOTIFICATION_NUMBER, notificationText);
                console.log(`[BotLogic] Notification de vote envoyée pour ${from}`);

            } catch (error) {
                console.error(`[BotLogic] Erreur lors du vote/notification pour ${from}:`, error.message);
            }
            stateService.setState(from, 'main_menu', 'selection');
            return client.sendMessage(fullId, MSG_OUI);

        } else if (text === '2') {
            stateService.setState(from, 'main_menu', 'selection');
            return client.sendMessage(fullId, MSG_RELIRE);

        } else {
            return client.sendMessage(fullId, '❌ Envoie *1* (Oui) ou *2* (Relire) pour continuer.');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITAIRES
    // ─────────────────────────────────────────────────────────────────────────

    normalizeId(id) {
        return id.split('@')[0].split(':')[0];
    }
}

export default new BotLogic();