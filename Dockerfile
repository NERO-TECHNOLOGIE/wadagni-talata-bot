FROM node:18-bullseye-slim

# Baileys peut avoir besoin de certaines bibliothèques pour libsignal-node
RUN apt-get update && apt-get install -y \
  ca-certificates \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# On copie les fichiers de configuration
COPY package*.json ./
RUN npm install --no-audit --no-fund

# On copie le reste du code
COPY . .

EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
