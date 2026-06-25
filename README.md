# 🚀 Boardify - CRM de Recherche d'Emploi (Version Locale / Production)

Cette branche (`local-prod`) est configurée pour fonctionner de manière **100% locale** et autonome. Elle retire la dépendance à Google OAuth pour s'appuyer uniquement sur l'authentification sécurisée classique (Email / Mot de passe) et utilise la base de données PostgreSQL incluse dans Docker.

---

## 🛠️ Prérequis

Avant de lancer l'application, assurez-vous d'avoir installé sur votre machine :
1. [Node.js](https://nodejs.org/) (Version 18 ou supérieure recommandée)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (pour exécuter la base de données locale)

---

## 📋 Étapes d'Installation & Lancement Local

Suivez ces instructions pour compiler et exécuter l'application sur votre PC.

### 1. Démarrer la base de données locale (Docker)
Ouvrez votre terminal à la racine du projet et lancez le conteneur de base de données PostgreSQL :
```bash
docker compose up -d
```
*Le conteneur PostgreSQL démarrera en arrière-plan sur le port local `5433`.*

### 2. Configurer le fichier d'environnement (.env)
Dupliquez le fichier `.env.example` et renommez-le en `.env` à la racine du projet. Remplissez-le avec les paramètres locaux suivants :
```env
# Connexion à la base de données locale Docker PostgreSQL (Port 5433)
DATABASE_URL="postgresql://postgres:postgres_password@localhost:5433/boardify?schema=public"

# Secret NextAuth.js (Générez une chaîne aléatoire sécurisée)
AUTH_SECRET="votre_cle_secrete_aleatoire_de_minimum_32_caracteres"
NEXTAUTH_URL="http://localhost:3000"

# URL de l'API locale
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Clé API Google Maps (Recommandé pour afficher les cartes interactives)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyACZPOdiJamOGaGW1sf27tpPOQYkaQLnI0"
```

### 3. Synchroniser la base de données (Prisma)
Exécutez la commande suivante pour créer les tables de la base de données locales à partir du schéma Prisma :
```bash
npx prisma db push
```

### 4. Compiler l'application pour la production
Générez le build optimisé de production :
```bash
npm run build
```

### 5. Lancer le serveur local de production
Démarrez l'application localement :
```bash
npm run start
```

---

## 💻 Accès à l'application
Une fois le serveur démarré, ouvrez votre navigateur et accédez à :
👉 **[http://localhost:3000](http://localhost:3000)**

* Créez votre compte directement en cliquant sur **"Créer un compte"** via le formulaire classique (Email / Mot de passe).
* Toutes vos données de candidatures, CV, notes et rappels de tâches seront sauvegardées de manière sécurisée en local dans votre conteneur Docker.
