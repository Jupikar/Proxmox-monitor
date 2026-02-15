# Proxmox Monitor

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)](https://docs.docker.com/compose/)

## Vue d'ensemble

Proxmox Monitor est une application web moderne pour surveiller et gérer vos conteneurs LXC Proxmox et vos conteneurs Docker. L'application offre une interface intuitive pour visualiser les métriques en temps réel, gérer vos conteneurs, et recevoir des alertes.



## Fonctionnalités

### 📊 Dashboard Principal
- Vue d'ensemble de tous les LXC configurés avec leur statut (running/stopped)
- Affichage de l'uptime pour chaque LXC
- Métriques en temps réel : CPU, RAM, disque, réseau
- Liste des conteneurs Docker dans chaque LXC avec leurs statuts
- Statistiques globales (nombre de LXC, conteneurs actifs/arrêtés)
- Rafraîchissement automatique toutes les 10 secondes
- Badge indiquant les mises à jour Docker disponibles par LXC

### 🐳 Gestion des Conteneurs Docker
- Actions disponibles : Start, Stop, Restart
- Indication visuelle claire de l'état (running = vert, stopped = gris)
- Retour d'état en temps réel après chaque action

### 🔄 Détection des Mises à Jour Docker (Phase 4)
- Vérification automatique des mises à jour pour les images Docker
- Comparaison des digests locaux avec Docker Hub
- Bouton de vérification manuelle
- **Planification automatique** : Configuration du cron directement depuis l'interface
  - Préréglages : toutes les heures, tous les jours à 6h, etc.
  - Expression cron personnalisée possible
  - Activation/désactivation facile
- Affichage groupé par LXC des conteneurs ayant des mises à jour

### 📈 Graphiques et Historique des Métriques 
- Collecte automatique des métriques toutes les minutes
- Stockage dans PostgreSQL avec rétention de 30 jours
- Graphiques interactifs avec Recharts
- Filtrage par période : 1h, 6h, 24h, 7 jours, 30 jours
- Filtrage par LXC ou vue globale
- Agrégation automatique des données pour les longues périodes

### 🖥️ Terminal Web et Gestionnaire de Fichiers 
- **Terminal SSH interactif** :
  - Exécution de commandes en temps réel
  - Historique des commandes (flèches haut/bas)
  - Affichage du répertoire courant
- **Gestionnaire de fichiers** :
  - Navigation dans l'arborescence
  - Éditeur de fichiers intégré avec sauvegarde
  - **Upload de fichiers** depuis votre machine locale
  - **Téléchargement de fichiers** depuis le LXC
  - Menu contextuel (clic droit)

### 🚨 Système d'Alertes 
- **Types d'alertes configurables** :
  - CPU élevé (seuil et durée configurables)
  - Mémoire élevée
  - Disque saturé
  - LXC arrêté
  - Conteneur Docker arrêté
  - Mises à jour disponibles
  - Échec de connexion SSH
- **Notifications** :
  - Webhook (Discord, Slack, etc.)
  - Email via SMTP
  - Filtrage par type d'alerte et sévérité
  - Bouton de test
- **Gestion des alertes** :
  - Acquittement
  - Résolution
  - Historique

### ⚙️ Page de Configuration
- Configuration de la connexion Proxmox (URL, utilisateur API, token)
- Test de connexion Proxmox
- **Scan automatique** des LXC disponibles sur Proxmox
- Ajout/modification/suppression de LXC à surveiller
- Configuration SSH pour chaque LXC
- Test de connexion SSH

---

---

## Installation dans un LXC Proxmox (Debian 13 Trixie)

Cette section détaille l'installation complète de Proxmox Monitor dans un conteneur LXC Debian 13 (Trixie).

### Prérequis

- Serveur Proxmox VE 8.x ou supérieur
- Accès administrateur au serveur Proxmox
- Connexion Internet pour télécharger les packages

### Étape 1 : Télécharger le template Debian 13

> **Note** : Debian 13 (Trixie) est actuellement en phase de développement. Si le template n'est pas disponible, utilisez Debian 12 (Bookworm) qui est la version stable recommandée.

#### Via l'interface web Proxmox

1. Connectez-vous à l'interface web Proxmox (`https://votre-proxmox:8006`)
2. Sélectionnez votre nœud dans l'arborescence de gauche
3. Allez dans **local (pve)** > **CT Templates**
4. Cliquez sur **Templates**
5. Recherchez "debian-13" ou "debian-12" dans la liste
6. Cliquez sur **Download** pour télécharger le template

#### Via la ligne de commande (sur le serveur Proxmox)

```bash
# Lister les templates disponibles
pveam available --section system | grep debian

# Télécharger Debian 13 (si disponible)
pveam download local debian-13-standard_13.0-1_amd64.tar.zst

# OU Debian 12 (recommandé pour la stabilité)
pveam download local debian-12-standard_12.7-1_amd64.tar.zst

# Vérifier le téléchargement
pveam list local
```

### Étape 2 : Créer le LXC sur Proxmox

#### Option A : Via l'interface web Proxmox (recommandé pour débutants)

1. Cliquez sur **Create CT** en haut à droite
2. **Onglet General** :
   - **CT ID** : 200 (ou un ID libre)
   - **Hostname** : `proxmox-monitor`
   - **Password** : Définissez un mot de passe root sécurisé
   - ☑️ Cochez **Unprivileged container** (recommandé pour la sécurité)

3. **Onglet Template** :
   - **Storage** : local
   - **Template** : debian-13-standard ou debian-12-standard

4. **Onglet Disks** :
   - **Storage** : local-lvm (ou votre storage préféré)
   - **Disk size** : 20 GiB (minimum 15 GiB)

5. **Onglet CPU** :
   - **Cores** : 2

6. **Onglet Memory** :
   - **Memory** : 2048 MiB
   - **Swap** : 1024 MiB

7. **Onglet Network** :
   - **Bridge** : vmbr0
   - **IPv4** : Static
   - **IPv4/CIDR** : `192.168.1.200/24` (adaptez à votre réseau)
   - **Gateway** : `192.168.1.1`

8. **Onglet DNS** :
   - Laissez par défaut (utilise celui de l'hôte)

9. **Onglet Confirm** :
   - ☑️ Cochez **Start after created**
   - Cliquez sur **Finish**

10. **IMPORTANT - Activer le Nesting** (après création) :
    - Sélectionnez le CT 200 dans l'arborescence
    - Allez dans **Options**
    - Double-cliquez sur **Features**
    - ☑️ Cochez **nesting** (indispensable pour Docker)
    - Cliquez **OK**
    - **Redémarrez le conteneur** pour appliquer

#### Option B : Via la ligne de commande (rapide)

```bash
# Variables (à adapter)
CT_ID=200
CT_NAME="proxmox-monitor"
CT_IP="192.168.1.200"
CT_GW="192.168.1.1"
CT_PASSWORD="VotreMotDePasseSecurise"
TEMPLATE="debian-12-standard_12.7-1_amd64.tar.zst"  # ou debian-13

# Créer le LXC avec toutes les options
pct create $CT_ID local:vztmpl/$TEMPLATE \
  --hostname $CT_NAME \
  --cores 2 \
  --memory 2048 \
  --swap 1024 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr0,ip=${CT_IP}/24,gw=${CT_GW} \
  --features nesting=1 \
  --unprivileged 1 \
  --onboot 1 \
  --password $CT_PASSWORD

# Démarrer le conteneur
pct start $CT_ID

# Vérifier le statut
pct status $CT_ID
```

> ⚠️ **Note importante sur le Nesting** : L'option `--features nesting=1` est **obligatoire** pour faire fonctionner Docker dans le LXC. Sans cette option, Docker ne pourra pas créer de conteneurs.

### Étape 3 : Se connecter au LXC et configurer le système

#### Connexion au LXC

Vous avez plusieurs options pour vous connecter :

```bash
# Option 1 : Via la console Proxmox (depuis le serveur Proxmox)
pct enter 200

# Option 2 : Via SSH (depuis n'importe quelle machine)
ssh root@192.168.1.200

# Option 3 : Via l'interface web Proxmox
# Sélectionnez le CT > Console > Shell
```

#### Mise à jour du système

```bash
# Mettre à jour la liste des paquets et le système
apt update && apt upgrade -y

# Installer les outils de base
apt install -y \
  curl \
  wget \
  git \
  ca-certificates \
  gnupg \
  lsb-release \
  sudo \
  htop \
  nano

# Vérifier la version de Debian
cat /etc/os-release
# Devrait afficher : VERSION_CODENAME=trixie (Debian 13)
# ou VERSION_CODENAME=bookworm (Debian 12)
```

### Étape 4 : Installer Docker

Docker est nécessaire pour exécuter l'application Proxmox Monitor et sa base de données PostgreSQL.

#### Installation de Docker (Debian 13 / Debian 12)

```bash
# Supprimer les anciennes versions de Docker (si présentes)
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  apt remove -y $pkg 2>/dev/null
done

# Ajouter la clé GPG officielle de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Déterminer le codename (trixie, bookworm, etc.)
CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")

# Pour Debian 13 (Trixie), utiliser bookworm car Docker n'a pas encore de repo trixie
if [ "$CODENAME" = "trixie" ]; then
  CODENAME="bookworm"
  echo "⚠️  Debian 13 détecté - utilisation du repository Debian 12 (bookworm) pour Docker"
fi

# Ajouter le repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $CODENAME stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Mettre à jour et installer Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Vérifier l'installation
echo "=== Vérification de Docker ==="
docker --version
docker compose version

# Tester Docker
docker run --rm hello-world
```

#### Vérification du bon fonctionnement

```bash
# Vérifier que le service Docker est actif
systemctl status docker

# Afficher les infos Docker
docker info

# Si tout est OK, vous devriez voir :
# - Server Version: 2x.x.x
# - Storage Driver: overlay2
# - Cgroup Driver: systemd
```

> 💡 **Astuce** : Si `docker run hello-world` échoue avec une erreur de permission, vérifiez que le nesting est bien activé sur le LXC (voir Étape 2).

### Étape 5 : Déployer Proxmox Monitor

#### Créer le répertoire de l'application

```bash
# Créer le répertoire
mkdir -p /opt/proxmox-monitor
cd /opt/proxmox-monitor

# Vérifier qu'on est dans le bon répertoire
pwd
# Doit afficher : /opt/proxmox-monitor
```

#### Créer le fichier de configuration .env

Créez un fichier `.env` avec vos paramètres :

```bash
# Générer un mot de passe aléatoire sécurisé
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
echo "Mot de passe généré : $DB_PASSWORD"

# Créer le fichier .env
cat > .env << EOF
# Base de données PostgreSQL
POSTGRES_USER=proxmox
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=proxmox_monitor

# URL de connexion pour Prisma
DATABASE_URL=postgresql://proxmox:${DB_PASSWORD}@postgres:5432/proxmox_monitor

# Optionnel : URL de l'application (pour les webhooks et cron)
NEXTAUTH_URL=http://192.168.1.200:3000
EOF

# Vérifier le contenu
cat .env
```

> ⚠️ **Sécurité** : Le fichier `.env` contient des informations sensibles. Notez le mot de passe quelque part en sécurité.

#### Télécharger les fichiers de l'application

**Option A : Cloner depuis Git (si disponible)**

```bash
# Cloner le repository
git clone https://github.com/votre-username/proxmox-monitor.git .

# Vérifier les fichiers
ls -la
```

**Option B : Copier depuis votre machine locale**

Depuis votre ordinateur (remplacez l'IP par celle de votre LXC) :

```bash
# Depuis votre machine locale
scp -r /chemin/vers/proxmox_monitor/* root@192.168.1.200:/opt/proxmox-monitor/
```

**Option C : Créer les fichiers manuellement**

Créez le fichier `docker-compose.yml` :

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: proxmox-monitor
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
      - NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - proxmox-network

  postgres:
    image: postgres:15-alpine
    container_name: proxmox-postgres
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-proxmox}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-proxmox}
      - POSTGRES_DB=${POSTGRES_DB:-proxmox_monitor}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - proxmox-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-proxmox} -d ${POSTGRES_DB:-proxmox_monitor}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
    driver: local

networks:
  proxmox-network:
    driver: bridge
EOF
```

#### Builder et démarrer l'application

```bash
# Se positionner dans le répertoire
cd /opt/proxmox-monitor

# Builder et démarrer les conteneurs en arrière-plan
docker compose up -d --build

# Suivre les logs pendant le démarrage (Ctrl+C pour quitter)
docker compose logs -f
```

Le premier build peut prendre **5-10 minutes** selon la vitesse de votre connexion et du processeur.

#### Vérifier que tout fonctionne

```bash
# Vérifier l'état des conteneurs
docker compose ps

# Vous devriez voir :
# NAME                STATUS
# proxmox-monitor     Up X minutes
# proxmox-postgres    Up X minutes (healthy)

# Vérifier les logs de l'application
docker compose logs app

# Tester l'accès local
curl -I http://localhost:3000
# Doit retourner : HTTP/1.1 200 OK
```

### Étape 6 : Initialiser la base de données

```bash
# Attendre que PostgreSQL soit prêt (10-15 secondes)
sleep 15

# Appliquer le schéma de base de données avec Prisma
docker exec -it proxmox-monitor npx prisma db push

# Vérifier que les tables sont créées
docker exec -it proxmox-postgres psql -U proxmox -d proxmox_monitor -c "\dt"

# Vous devriez voir les tables :
# - ProxmoxConfig
# - LXCConfig
# - DockerImageUpdate
# - MetricsHistory
# - AlertConfig
# - Alert
# - NotificationConfig
```

### Étape 7 : Configurer le pare-feu (optionnel mais recommandé)

```bash
# Installer ufw si nécessaire
apt install -y ufw

# Configurer les règles
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 3000/tcp comment 'Proxmox Monitor'

# Activer le pare-feu
ufw --force enable

# Vérifier les règles
ufw status verbose
```

### Étape 8 : Configurer le démarrage automatique

Docker est déjà configuré pour démarrer automatiquement au boot. Vérifions :

```bash
# Activer Docker au démarrage
systemctl enable docker

# Les conteneurs avec `restart: unless-stopped` démarreront automatiquement
```

### Étape 9 : Accéder à l'application

Ouvrez votre navigateur à l'adresse :

```
http://192.168.1.200:3000
```

(Remplacez `192.168.1.200` par l'IP de votre LXC)

> 🎉 **Félicitations !** L'application Proxmox Monitor est maintenant installée !

---

## Configuration de l'application

### 1. Configurer la connexion Proxmox

#### Créer un utilisateur API sur Proxmox

Sur votre serveur Proxmox :

```bash
# Créer un rôle avec les permissions nécessaires (lecture seule)
pveum role add ProxmoxMonitor -privs "VM.Audit,VM.Monitor,Sys.Audit,Datastore.Audit"

# Créer un utilisateur
pveum user add monitor@pve

# Assigner le rôle
pveum acl modify / -user monitor@pve -role ProxmoxMonitor

# Créer un token API
pveum user token add monitor@pve monitoring --privsep 0
```

> Notez bien la valeur du token affichée !

#### Dans l'interface Proxmox Monitor

1. Allez dans **Configuration**
2. Remplissez :
   - **URL** : `https://votre-proxmox:8006`
   - **Utilisateur** : `monitor@pve!monitoring`
   - **Token** : La valeur du token
3. Cliquez sur **Tester la connexion**
4. Cliquez sur **Sauvegarder**

### 2. Ajouter les LXC à surveiller

#### Méthode rapide : Scan automatique

1. Cliquez sur **Scanner les LXC**
2. Sélectionnez les LXC à ajouter
3. Configurez les identifiants SSH pour chaque LXC
4. Cliquez sur **Ajouter la sélection**

#### Méthode manuelle

1. Cliquez sur **Ajouter un LXC**
2. Remplissez :
   - **ID Proxmox** : L'ID numérique (ex: 100)
   - **Nom** : Un nom convivial
   - **Adresse IP** : L'IP du LXC
   - **Port SSH** : 22 par défaut
   - **Utilisateur SSH** : root ou autre
   - **Mot de passe** ou **Clé SSH**
3. Cliquez sur **Tester SSH** puis **Ajouter**

### 3. Configurer les alertes

1. Allez dans **Alertes** (icône cloche)
2. Onglet **Règles** : Configurez vos seuils d'alerte
3. Onglet **Notifications** : Configurez webhook ou email

#### Exemple webhook Discord

```
URL : https://discord.com/api/webhooks/VOTRE_WEBHOOK_ID/VOTRE_WEBHOOK_TOKEN
```

### 4. Configurer la vérification automatique des mises à jour Docker

1. Dans le panneau **Mises à jour Docker**, cliquez sur **Planifier**
2. Sélectionnez le LXC qui exécutera le cron
3. Choisissez la fréquence (ex: tous les jours à 6h)
4. Vérifiez l'URL de l'application
5. Cliquez sur **Activer**

---

## Commandes utiles

### Gestion des conteneurs Docker

```bash
cd /opt/proxmox-monitor

# Voir les logs
docker compose logs -f
docker compose logs -f app
docker compose logs -f postgres

# Redémarrer l'application
docker compose restart app

# Arrêter tout
docker compose down

# Mise à jour
docker compose pull
docker compose up -d

# Rebuild complet
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Sauvegarde de la base de données

```bash
# Créer une sauvegarde
docker exec proxmox-postgres pg_dump -U proxmox proxmox_monitor > backup_$(date +%Y%m%d).sql

# Restaurer une sauvegarde
cat backup_20240101.sql | docker exec -i proxmox-postgres psql -U proxmox proxmox_monitor
```

### Cron pour la collecte des métriques

La collecte est automatique via l'application, mais vous pouvez forcer une collecte :

```bash
curl -X POST http://localhost:3000/api/metrics/history
```

### Cron pour la vérification des alertes

```bash
# Ajouter au crontab
crontab -e

# Vérifier les alertes toutes les 5 minutes
*/5 * * * * curl -s -X POST http://localhost:3000/api/alerts/check > /dev/null 2>&1
```

---

## Spécifications recommandées pour le LXC

| Ressource | Minimum | Recommandé | Notes |
|-----------|---------|------------|-------|
| **CPU** | 1 cœur | 2 cœurs | Requêtes API et SSH régulières |
| **RAM** | 1 Go | 2 Go | Next.js + PostgreSQL + Node.js |
| **Disque** | 8 Go | 15 Go | OS, Docker, app, base de données |
| **Swap** | 512 Mo | 1 Go | Tampon pour pics de mémoire |

---

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker compose logs app

# Vérifier que PostgreSQL est accessible
docker exec proxmox-monitor npx prisma db push
```

### Erreur de connexion Proxmox

- Vérifiez le format : `https://IP:8006`
- Vérifiez le format utilisateur : `user@pve!tokenname`
- Les certificats auto-signés sont acceptés

### Erreur de connexion SSH

- Vérifiez que SSH est actif : `systemctl status sshd`
- Testez manuellement : `ssh user@ip -p port`
- Vérifiez les permissions Docker : `usermod -aG docker user`

### Docker ne fonctionne pas dans le LXC

- Vérifiez que **nesting** est activé dans les features du LXC
- Sur Proxmox : `pct set 200 --features nesting=1`

---

## Architecture technique

```
proxmox_monitor/
├── nextjs_space/           # Application Next.js 14
│   ├── app/
│   │   ├── api/            # Routes API
│   │   │   ├── alerts/     # Gestion des alertes
│   │   │   ├── docker/     # Contrôle Docker & mises à jour
│   │   │   ├── lxc/        # Configuration LXC
│   │   │   ├── metrics/    # Métriques & historique
│   │   │   ├── proxmox/    # API Proxmox
│   │   │   └── ssh/        # Terminal, fichiers, upload/download
│   │   ├── alerts/         # Page alertes
│   │   ├── config/         # Page configuration
│   │   ├── terminal/       # Page terminal & fichiers
│   │   └── page.tsx        # Dashboard
│   ├── components/         # Composants React
│   ├── lib/                # Clients API (Proxmox, SSH)
│   └── prisma/             # Schéma base de données
├── Dockerfile              # Build de production
├── docker-compose.yml      # Orchestration
└── README.md
```

## Technologies

- **Next.js 14** avec App Router
- **TypeScript**
- **Prisma** ORM + PostgreSQL
- **Tailwind CSS** + Framer Motion
- **Recharts** pour les graphiques
- **ssh2** pour les connexions SSH/SFTP
- **axios** pour les requêtes HTTP

---

## Licence

Ce projet est sous licence MIT.
