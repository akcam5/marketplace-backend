# Backend Application Marketplace - Documentation Projet

## Résumé Exécutif

Ce document fournit un aperçu complet du backend de Kadeel qui a été développé pour votre projet. Le backend est une application Node.js/Express.js robuste et évolutive avec intégration de base de données MongoDB, comprenant l'authentification des utilisateurs, la gestion des annonces, la messagerie en temps réel, les capacités de téléchargement d'images et les notifications par email.

## 🏗️ Aperçu de l'Architecture

### Stack Technologique
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de données**: MongoDB avec Mongoose ODM
- **Authentification**: JWT (JSON Web Tokens)
- **Stockage de fichiers**: AWS S3
- **Service email**: Resend
- **Traitement d'images**: Multer avec intégration S3
- **Sécurité**: bcryptjs pour le hachage des mots de passe

### Structure du Projet
```
marketplace-app-backend/
├── server.js                 # Point d'entrée de l'application
├── package.json              # Dépendances et scripts
├── models/                   # Schémas de base de données
├── controllers/              # Logique métier
├── routes/                   # Points de terminaison API
├── middleware/               # Authentification et téléchargement de fichiers
├── config/                   # Configuration AWS et email
└── documentation/            # Fichiers de documentation API
```

## 🔐 Système d'Authentification

### Fonctionnalités Implémentées
- **Inscription Utilisateur**: Création de compte sécurisée avec hachage de mot de passe et email de bienvenue automatique
- **Connexion Utilisateur**: Authentification basée sur JWT avec expiration de token de 3 heures
- **Réinitialisation de Mot de Passe**: Récupération de mot de passe par email avec expiration de token de 10 minutes
- **Gestion de Profil**: Mise à jour des informations utilisateur et photos de profil
- **Middleware Sécurisé**: Vérification JWT pour les routes protégées
- **Email de Bienvenue**: Envoi automatique d'un email de bienvenue lors de l'inscription

### Modèle de Données Utilisateur
```javascript
{
  name: String (requis),
  email: String (requis, unique),
  password: String (haché),
  town: String (requis),
  neighborhood: String (requis),
  phoneNumber: String (optionnel),
  profilePicture: String (URL S3),
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date
}
```

### Points de Terminaison API
- `POST /api/auth/register` - Inscription utilisateur (inclut l'email de bienvenue)
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/user` - Obtenir le profil utilisateur actuel
- `PUT /api/auth/profile` - Mettre à jour le profil utilisateur
- `POST /api/auth/forgot-password` - Demander la réinitialisation du mot de passe
- `POST /api/auth/reset-password` - Réinitialiser le mot de passe avec token
- `PUT /api/auth/profile/picture` - Télécharger la photo de profil

## 📝 Système de Gestion des Annonces

### Fonctionnalités Principales
- **Opérations CRUD**: Créer, lire, mettre à jour, supprimer les annonces
- **Recherche Avancée**: Filtrage par mot-clé, catégorie et gamme de prix
- **Pagination et Tri**: Récupération efficace des données avec plusieurs options de tri
- **Gestion d'Images**: Téléchargement multiple d'images avec stockage S3
- **Gestion d'État**: États actif, en attente et vendu
- **Profils Vendeur**: Voir toutes les annonces par vendeurs spécifiques

### Modèle de Données Annonce
```javascript
{
  title: String (requis),
  description: String (requis),
  price: Number (requis, permet 0),
  state: String (enum: 'active', 'onhold', 'sold'),
  mainCategory: String (requis),
  subCategory: String (requis),
  subSubCategory: String,
  images: [String] (URLs S3, max 10),
  createdBy: ObjectId (référence Utilisateur),
  created: Date,
  updated: Date
}
```

### Recherche Avancée et Filtrage
- **Recherche par Mot-clé**: Recherche textuelle complète dans le titre et la description
- **Filtrage par Catégorie**: Hiérarchie de catégories à trois niveaux
- **Gamme de Prix**: Filtres de prix minimum et maximum
- **Options de Tri**:
  - Récent (plus récent en premier)
  - Ancien (plus ancien en premier)
  - Prix croissant (du plus bas au plus élevé)
  - Prix décroissant (du plus élevé au plus bas)
- **Pagination**: Taille de page configurable avec métadonnées

### Points de Terminaison API
- `POST /api/listings` - Créer une nouvelle annonce
- `GET /api/listings` - Obtenir toutes les annonces (avec pagination/tri)
- `GET /api/listings/search` - Recherche avancée avec filtres
- `GET /api/listings/recent` - Obtenir les 6 annonces les plus récentes
- `GET /api/listings/:id` - Obtenir les détails d'une annonce spécifique
- `GET /api/listings/seller/:sellerId` - Obtenir les annonces d'un vendeur
- `PUT /api/listings/:id` - Mettre à jour une annonce
- `DELETE /api/listings/:id` - Supprimer une annonce
- `POST /api/listings/upload-images` - Télécharger des images d'annonce
- `PUT /api/listings/:id/images` - Mettre à jour les images d'annonce

## 💬 Système de Messagerie

### Fonctionnalités
- **Conversations en Temps Réel**: Messagerie directe entre utilisateurs
- **Chats Basés sur les Annonces**: Conversations liées à des annonces spécifiques
- **Statut des Messages**: Suivi lu/non lu
- **Notifications Intelligentes**: Notifications email intelligentes pour éviter le spam
- **Gestion des Conversations**: Lister toutes les conversations utilisateur avec compteurs de non lus

### Modèles de Données de Messagerie

**Modèle Conversation**:
```javascript
{
  participants: [ObjectId] (références Utilisateur),
  listing: ObjectId (référence Annonce),
  lastMessage: Date,
  createdAt: Date
}
```

**Modèle Message**:
```javascript
{
  conversation: ObjectId (référence Conversation),
  sender: ObjectId (référence Utilisateur),
  content: String (requis),
  read: Boolean (défaut: false),
  createdAt: Date
}
```

### Système de Notification Intelligent
Le système de messagerie inclut une fonctionnalité de notification email intelligente :

- **Premier Message**: Envoie toujours une notification pour le contact initial
- **Messages Suivants**: Envoie des notifications seulement si :
  - Le message précédent de l'expéditeur n'est pas lu ET
  - Plus de 30 minutes se sont écoulées (configurable)
- **Prévention du Spam**: Empêche les notifications multiples pour les messages rapides
- **Seuil Configurable**: Timing de notification personnalisable

### Points de Terminaison API
- `POST /api/chat/conversations` - Créer une nouvelle conversation
- `GET /api/chat/conversations` - Obtenir les conversations de l'utilisateur
- `POST /api/chat/messages` - Envoyer un message
- `GET /api/chat/conversations/:id/messages` - Obtenir les messages de conversation
- `GET /api/chat/messages/unread` - Obtenir le nombre de messages non lus

## 📧 Système de Notification Email

### Services Email
- **Réinitialisation de Mot de Passe**: Emails de récupération de mot de passe sécurisés
- **Notifications de Messages**: Alertes de nouveaux messages
- **Emails de Bienvenue**: Emails de bienvenue automatiques pour les nouvelles inscriptions
- **Templates Professionnels**: Emails formatés HTML avec branding

### Fonctionnalités Email
- **Fournisseur de Service**: Intégration Resend
- **Branding Professionnel**: Templates email de marque
- **Design Responsive**: Layouts email adaptés mobile
- **Livraison Fiable**: Service email à haute délivrabilité
- **Bienvenue Automatique**: Emails de bienvenue envoyés automatiquement lors de l'inscription
- **Gestion d'Erreurs**: Envoi d'email non bloquant (l'inscription continue même si l'email échoue)

### Détails Email de Bienvenue
- **Déclencheur**: Envoyé automatiquement quand un nouvel utilisateur crée un compte
- **Contenu**: Message de bienvenue personnalisé avec le nom de l'utilisateur
- **Fonctionnalités**: 
  - Message de bienvenue et félicitations
  - Guide de démarrage rapide avec éléments actionnables
  - Lien direct pour commencer à explorer la marketplace
  - Branding professionnel cohérent avec Kadeel
- **Fiabilité**: Les échecs d'email ne bloquent pas le processus d'inscription

### Templates Email
- **Email de Bienvenue**: Envoyé aux nouveaux utilisateurs lors de l'inscription
- **Réinitialisation de Mot de Passe**: Récupération sécurisée avec tokens à durée limitée
- **Notifications de Messages**: Alertes de messages de chat en temps réel

### Points de Terminaison API
- `POST /api/email` - Envoyer un email personnalisé (fonction admin)

## 🖼️ Système de Gestion d'Images

### Fonctionnalités
- **Intégration AWS S3**: Stockage cloud évolutif
- **Téléchargement Multiple**: Support jusqu'à 10 images par annonce
- **Validation de Fichiers**: Restrictions de format et taille d'image
- **Nettoyage Automatique**: Suppression S3 quand les images sont retirées
- **Photos de Profil**: Téléchargement et gestion d'avatar utilisateur

### Spécifications de Téléchargement
- **Formats Supportés**: JPG, JPEG, PNG, GIF
- **Limite de Taille**: 5MB par image
- **Images Maximum**: 10 par annonce
- **Stockage**: AWS S3 avec nommage de fichier unique

### Points de Terminaison API
- `POST /api/listings/upload-images` - Télécharger des images d'annonce
- `PUT /api/listings/:id/images` - Mettre à jour les images d'annonce
- `PUT /api/auth/profile/picture` - Télécharger la photo de profil

## 🚀 Déploiement et Configuration

### Étapes d'Installation
1. Cloner le dépôt
2. Installer les dépendances : `npm install`
3. Configurer les variables d'environnement
4. Démarrer le serveur de développement : `npm run dev`
5. Démarrer le serveur de production : `npm start`

### Dépendances
- **Core**: express, mongoose, cors, dotenv
- **Authentification**: jsonwebtoken, bcryptjs
- **Téléchargement de Fichiers**: multer, multer-s3
- **AWS**: @aws-sdk/client-s3, @aws-sdk/lib-storage
- **Email**: resend
- **Développement**: nodemon

## 📊 Fonctionnalités de Performance API

### Système de Pagination
- **Rétrocompatible**: Les appels API existants fonctionnent sans changement
- **Taille de Page Configurable**: Le client peut spécifier les éléments par page
- **Métadonnées**: Nombre total, info de page, drapeaux de navigation
- **Requêtes Efficaces**: Optimisation MongoDB skip/limit

### Capacités de Tri
- **Options Multiples**: Tri basé sur la date et le prix
- **Insensible à la Casse**: Gestion flexible des paramètres
- **Tri Secondaire**: Ordre cohérent avec départageurs
- **Comportement par Défaut**: Défauts sensés pour tous les points de terminaison

### Optimisation de Recherche
- **Support d'Index**: Optimisé pour la recherche textuelle MongoDB
- **Combinaison de Filtres**: Support de critères de recherche multiples
- **Filtrage d'État**: Exclusion automatique des articles vendus
- **Performance**: Construction et exécution de requêtes efficaces

## 🛡️ Fonctionnalités de Sécurité

### Sécurité d'Authentification
- **Hachage de Mot de Passe**: bcryptjs avec rounds de salt
- **Tokens JWT**: Authentification sécurisée basée sur token
- **Expiration de Token**: Timeout de session de 3 heures
- **Réinitialisation de Mot de Passe**: Récupération sécurisée basée sur token

### Protection des Données
- **Validation d'Entrée**: Validation complète des requêtes
- **Vérifications d'Autorisation**: Vérification de propriété utilisateur
- **Configuration CORS**: Gestion des requêtes cross-origin
- **Gestion d'Erreur Sécurisée**: Messages d'erreur protégés

### Sécurité de Téléchargement de Fichiers
- **Validation de Type de Fichier**: Restrictions de format d'image
- **Limites de Taille**: Protection de 5MB par fichier
- **Stockage Sécurisé**: AWS S3 avec permissions appropriées
- **Nettoyage**: Suppression automatique des fichiers inutilisés

## 📈 Considérations d'Évolutivité

### Conception de Base de Données
- **Schémas Efficaces**: Collections MongoDB optimisées
- **Relations de Référence**: Normalisation appropriée des données
- **Stratégie d'Indexation**: Requêtes optimisées pour la performance
- **Pagination**: Récupération de données efficace en mémoire

### Intégration Cloud
- **AWS S3**: Stockage de fichiers évolutif
- **Service Email Externe**: Livraison email fiable
- **Conception Sans État**: Prêt pour la mise à l'échelle horizontale
- **Configuration d'Environnement**: Flexibilité de déploiement

## 🔍 Surveillance et Journalisation

### Journalisation des Requêtes
- **Journalisation Automatique**: Toutes les requêtes API journalisées avec horodatage
- **Surveillance de Performance**: Timing des requêtes et codes de statut
- **Support de Développement**: Débogage basé console

### Surveillance Système
- **Suivi d'Erreurs**: Journalisation d'erreurs complète
- **Livraison Email**: Suivi du statut de notification
- **Information de Débogage**: Sortie conviviale pour le développement

## 📋 Tests et Assurance Qualité

### Tests API
- **Cas de Test Complets**: Scénarios de test détaillés fournis
- **Validation de Tri**: Tests extensifs de fonctionnalité de tri
- **Tests de Pagination**: Tests complets de workflow de pagination
- **Gestion d'Erreurs**: Tests d'erreurs de validation

### Documentation
- **Documentation API**: Documentation détaillée des points de terminaison
- **Exemples d'Usage**: Scénarios d'usage du monde réel
- **Guide de Migration**: Information de rétrocompatibilité

## 🎯 Valeur Métier Livrée

### Fonctionnalités Marketplace Principales
1. **Gestion Utilisateur Complète**: Inscription, authentification, profils
2. **Système d'Annonces Robuste**: CRUD complet avec recherche avancée
3. **Communication Temps Réel**: Messagerie entre acheteurs/vendeurs
4. **Gestion d'Images Professionnelle**: Stockage et gestion basés cloud
5. **Notifications Intelligentes**: Système email intelligent

### Capacités Avancées
1. **Architecture Évolutive**: Prête pour la croissance et le trafic élevé
2. **Conception API Moderne**: RESTful avec pagination et tri
3. **Meilleures Pratiques de Sécurité**: Mesures de sécurité standard de l'industrie
4. **Intégration Cloud**: AWS et intégration de services tiers
5. **Convivial pour Développeurs**: Documentation et tests complets

### Conception Prête pour l'Avenir
- **Structure Extensible**: Facile d'ajouter de nouvelles fonctionnalités
- **Prêt pour le Versioning API**: Rétrocompatibilité maintenue
- **Compatible Microservice**: Conception modulaire pour la mise à l'échelle
- **Prêt pour App Mobile**: API RESTful parfaite pour l'intégration mobile

## 📞 Support et Maintenance

### Qualité du Code
- **Architecture Propre**: Code bien organisé et maintenable
- **Documentation Complète**: Documentation extensive en ligne et externe
- **Meilleures Pratiques**: Pratiques de développement standard de l'industrie
- **Conception Modulaire**: Facile à étendre et modifier

### Support de Déploiement
- **Configuration Flexible**: Configuration basée environnement
- **Configuration Base de Données**: Guidance de configuration MongoDB
- **Services Cloud**: Intégration AWS et service email
- **Surveillance**: Journalisation et suivi intégrés

## 🌟 Réalisations Clés

### Excellence Technique
- **Prêt pour la Production**: Qualité de code niveau entreprise
- **Optimisé pour la Performance**: Requêtes de base de données efficaces et mise en cache
- **Axé sur la Sécurité**: Implémentation de sécurité complète
- **Conception Évolutive**: Conçu pour la croissance et l'expansion

### Impact Métier
- **Solution Marketplace Complète**: Toutes les fonctionnalités essentielles implémentées
- **Expérience Utilisateur**: Conception API fluide et responsive
- **Fiabilité**: Gestion d'erreurs et validation robustes
- **Maintenabilité**: Code propre, documenté et testable

---

Ce backend marketplace fournit une base solide pour votre application avec des fonctionnalités de niveau entreprise, sécurité et évolutivité. Le système est prêt pour la production et inclut tous les composants nécessaires pour une plateforme marketplace réussie. 