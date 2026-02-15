# Proxmox Monitor

## Vue d'ensemble

Proxmox Monitor est une application web moderne pour surveiller et gérer vos conteneurs LXC Proxmox et vos conteneurs Docker. L'application offre une interface intuitive pour visualiser les métriques en temps réel et contrôler vos conteneurs.

## Fonctionnalités

### Dashboard Principal
- Vue d'ensemble de tous les LXC configurés avec leur statut (running/stopped)
- Affichage de l'uptime pour chaque LXC
- Métriques en temps réel : CPU, RAM, disque, réseau
- Liste des conteneurs Docker dans chaque LXC avec leurs statuts
- Statistiques globales (nombre de LXC, conteneurs actifs/arrêtés)
- Rafraîchissement automatique toutes les 10 secondes

### Gestion des Conteneurs Docker
- Actions disponibles : Start, Stop, Restart
- Indication visuelle claire de l'état (running = vert, stopped = gris)
- Retour d'état en temps réel après chaque action

### Page de Configuration
- Configuration de la connexion Proxmox (URL, utilisateur API, token)
- Test de connexion Proxmox
- Ajout/modification/suppression de LXC à surveiller
- Configuration SSH pour chaque LXC (IP, port, utilisateur, mot de passe ou clé)
- Test de connexion SSH

## Prérequis

### Côté Proxmox

1. **Créer un utilisateur API avec les droits nécessaires**

   Connectez-vous à votre interface Proxmox et créez un utilisateur API avec les permissions suivantes :

   ```bash
   # Créer un utilisateur (si nécessaire)
   pveum user add monitor@pve
   
   # Créer un rôle personnalisé avec les droits nécessaires
   pveum role add MonitorRole -privs "VM.Audit VM.Monitor Sys.Audit Datastore.Audit"
   
   # Assigner le rôle à l'utilisateur sur le chemin root
   pveum acl modify / -user monitor@pve -role MonitorRole
   
   # Créer un token API
   pveum user token add monitor@pve monitoring --privsep 0
   ```

   **Droits nécessaires :**
   - `VM.Audit` : Lecture des informations sur les VMs/LXC
   - `VM.Monitor` : Accès aux métriques des VMs/LXC
   - `Sys.Audit` : Lecture des informations système
   - `Datastore.Audit` : Lecture des informations de stockage

   Note : Ces permissions sont en **lecture seule** et ne permettent pas de modifier ou supprimer des ressources.

2. **Notez les informations suivantes :**
   - URL de votre serveur Proxmox (ex: `https://proxmox.example.com:8006`)
   - Nom d'utilisateur avec token (ex: `monitor@pve!monitoring`)
   - Valeur du token API

### Côté LXC

1. **Configurer l'accès SSH**

   Sur chaque LXC que vous souhaitez surveiller :

   ```bash
   # Installer Docker si ce n'est pas déjà fait
   curl -fsSL https://get.docker.com | sh
   
   # Activer le service SSH
   systemctl enable --now sshd
   
   # Créer un utilisateur pour le monitoring (optionnel mais recommandé)
   useradd -m -s /bin/bash monitor
   usermod -aG docker monitor
   
   # Définir un mot de passe OU configurer une clé SSH
   passwd monitor
   # OU
   mkdir -p /home/monitor/.ssh
   echo "votre_cle_publique" >> /home/monitor/.ssh/authorized_keys
   chmod 700 /home/monitor/.ssh
   chmod 600 /home/monitor/.ssh/authorized_keys
   chown -R monitor:monitor /home/monitor/.ssh
   ```

2. **Notez les informations suivantes pour chaque LXC :**
   - ID Proxmox du LXC (visible dans l'interface Proxmox)
   - Adresse IP du LXC
   - Port SSH (22 par défaut)
   - Nom d'utilisateur SSH
   - Mot de passe ou clé privée SSH

## Installation

### Option 1 : Utilisation avec Docker (Recommandé)

1. **Cloner le repository**

   ```bash
   git clone <repository-url>
   cd proxmox_monitor
   ```

2. **Configurer les variables d'environnement**

   ```bash
   cp .env.example .env
   # Éditer le fichier .env avec vos valeurs
   nano .env
   ```

3. **Démarrer l'application**

   ```bash
   docker-compose up -d
   ```

4. **Appliquer les migrations de base de données**

   ```bash
   docker exec -it proxmox-monitor npx prisma db push
   ```

5. **Accéder à l'application**

   Ouvrez votre navigateur à l'adresse : `http://localhost:3000`

### Option 2 : Installation manuelle (Développement)

1. **Prérequis**
   - Node.js 18+
   - Yarn
   - PostgreSQL 15+

2. **Installation**

   ```bash
   cd nextjs_space
   yarn install
   ```

3. **Configurer la base de données**

   Créez une base de données PostgreSQL et configurez l'URL dans `.env` :

   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/proxmox_monitor"
   ```

4. **Appliquer le schéma Prisma**

   ```bash
   yarn prisma generate
   yarn prisma db push
   ```

5. **Démarrer le serveur de développement**

   ```bash
   yarn dev
   ```

6. **Accéder à l'application**

   Ouvrez votre navigateur à l'adresse : `http://localhost:3000`

## Configuration de l'application

1. **Configurer Proxmox**
   - Accédez à la page "Configuration"
   - Entrez l'URL de votre serveur Proxmox
   - Entrez le nom d'utilisateur API (format : `user@pam!token`)
   - Entrez le token API
   - Cliquez sur "Tester la connexion" pour vérifier
   - Cliquez sur "Sauvegarder"

2. **Ajouter des LXC**
   - Cliquez sur "Ajouter un LXC"
   - Remplissez les informations :
     - ID Proxmox : L'ID numérique du LXC dans Proxmox
     - Nom personnalisé : Un nom convivial pour identifier le LXC
     - Adresse IP : L'adresse IP du LXC
     - Port SSH : Le port SSH (22 par défaut)
     - Utilisateur SSH : Le nom d'utilisateur pour la connexion SSH
     - Mot de passe SSH : Le mot de passe (si vous n'utilisez pas de clé)
     - Clé SSH : La clé privée SSH (si vous n'utilisez pas de mot de passe)
   - Cliquez sur "Tester SSH" pour vérifier la connexion
   - Cliquez sur "Ajouter" pour sauvegarder

3. **Utiliser le Dashboard**
   - Retournez sur la page "Dashboard"
   - Vous verrez tous vos LXC avec leurs métriques
   - Les données se rafraîchissent automatiquement toutes les 10 secondes
   - Utilisez les boutons pour contrôler les conteneurs Docker

## Architecture

```
proxmox_monitor/
├── nextjs_space/           # Application Next.js
│   ├── app/                # Pages et routes API
│   │   ├── api/            # API routes
│   │   ├── config/         # Page de configuration
│   │   ├── layout.tsx      # Layout principal
│   │   └── page.tsx        # Dashboard
│   ├── components/        # Composants React
│   ├── lib/               # Utilitaires
│   │   ├── proxmox-api.ts  # Client API Proxmox
│   │   └── ssh-client.ts   # Client SSH
│   └── prisma/            # Schéma de base de données
├── Dockerfile             # Image Docker de l'app
├── docker-compose.yml     # Orchestration Docker
└── README.md              # Cette documentation
```

## Technologies utilisées

- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Prisma** : ORM pour la base de données
- **PostgreSQL** : Base de données
- **Tailwind CSS** : Framework CSS
- **Framer Motion** : Animations
- **ssh2** : Connexions SSH
- **axios** : Requêtes HTTP
- **lucide-react** : Icônes

## Dépannage

### Problèmes de connexion Proxmox

- Vérifiez que l'URL est correcte (incluant le protocole https:// et le port :8006)
- Vérifiez que le format du nom d'utilisateur est correct : `user@pam!tokenname`
- Vérifiez que les droits API sont correctement assignés
- Si vous utilisez un certificat auto-signé, c'est normal qu'il soit accepté (l'application ignore la vérification SSL)

### Problèmes de connexion SSH

- Vérifiez que le service SSH est actif sur le LXC : `systemctl status sshd`
- Vérifiez que l'adresse IP est correcte
- Vérifiez que le port SSH est ouvert : `nc -zv <ip> <port>`
- Si vous utilisez une clé SSH, assurez-vous qu'elle est au format correct (PEM)
- Vérifiez les permissions des fichiers SSH sur le LXC

### Conteneurs Docker non détectés

- Vérifiez que Docker est installé sur le LXC : `docker --version`
- Vérifiez que l'utilisateur SSH a accès à Docker : `docker ps`
- Ajoutez l'utilisateur au groupe docker si nécessaire : `usermod -aG docker <user>`

### Erreurs de base de données

- Vérifiez que PostgreSQL est démarré
- Vérifiez la chaîne de connexion dans `.env`
- Réappliquez le schéma : `yarn prisma db push`

## Phases futures

Les fonctionnalités suivantes sont prévues pour les prochaines versions :

- **Terminal web** : Exécuter des commandes directement depuis l'interface
- **Graphiques avancés** : Historique des métriques avec graphiques temporels
- **Gestion des mises à jour** : Mettre à jour les conteneurs Docker
- **Système d'alertes** : Notifications par email/webhook pour les événements importants
- **Gestion des sauvegardes** : Sauvegarder et restaurer des conteneurs
- **Multi-utilisateurs** : Authentification et gestion des permissions

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est sous licence MIT.

## Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur le repository.
