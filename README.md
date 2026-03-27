# Bot WhatsApp WADAGNI-TALATA 🇧🇯

Ce bot est un outil de présentation interactive pour le programme de société **WADAGNI-TALATA**. 
Il permet aux citoyens de découvrir le programme à travers 9 sections thématiques et d'exprimer leur soutien.

## 🚀 Caractéristiques
- **Léger** : Basé sur `@whiskeysockets/baileys` (pas de Chromium/Puppeteer).
- **Multi-Instance** : Supporte jusqu'à 20 instances WhatsApp simultanées.
- **Interactif** : Menu de navigation simple (1-9) avec sous-menus personnalisés.
- **API Intégrée** : Enregistrement automatique des utilisateurs et des votes via backend Laravel.
- **File d'attente** : Traitement séquentiel des messages par utilisateur pour éviter les chevauchements.

## 🛠️ Installation
1. **Prérequis** : Node.js 18+
2. **Setup** :
   ```bash
   npm install
   ```
3. **Configuration** :
   Copiez `.env.example` vers `.env` et configurez `WADAGNI_API_URL`.
4. **Lancement** :
   ```bash
   npm start
   ```

## 🔌 API de Gestion
- `POST /instances/init/:id` : Initialiser une instance (ex: `bot1`).
- `GET /instances/qr/:id` : Afficher le QR code dans le navigateur (ex: `http://localhost:3000/instances/qr/bot1`).
- `GET /instances/status` : Voir l'état de toutes les instances connectées.
- `POST /instances/stop/:id` : Déconnecter et arrêter une instance.

## 📁 Structure du Projet
- `src/index.js` : Point d'entrée et serveur Express.
- `src/services/InstanceManager.js` : Gestion des connexions Baileys.
- `src/services/BotLogic.js` : Logique métier du programme Wadagni.
- `src/services/BaileysAdapter.js` : Couche de compatibilité Baileys.
- `src/services/ApiService.js` : Communication avec le backend.

## 🐳 Docker
```bash
docker build -t wadagni-bot .
docker run -p 3000:3000 wadagni-bot
```
