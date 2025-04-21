# Marketplace App Backend

Welcome to the backend documentation for the Marketplace App. This README will guide you through the setup and usage of the backend server.

## Installation

To get started, follow these steps:

1. Clone the repository: `git clone https://github.com/dankrecoum/marketplace-app-backend.git`
2. Navigate to the project directory: `cd marketplace-app-backend`
3. Install the dependencies: `npm install`

## Configuration

Before running the server, you need to configure the environment variables. Create a `.env` file in the root directory and add the following variables:

TODO: Update this section with project specific data
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketplace
DB_USER=your-username
DB_PASSWORD=your-password
MESSAGE_NOTIFICATION_THRESHOLD=30
```

Make sure to replace `your-username` and `your-password` with your own database credentials.

## Usage

To start the server, run the following command:

```
npm run dev
```

The server will start running on `http://localhost:5000`.

## API Documentation

For detailed information about the API endpoints and how to use them, please refer to the [API documentation](api-docs.md).

## Notifications de messages

Le système intègre une fonctionnalité de notification par email pour les conversations. Voici comment elle fonctionne :

- Lorsqu'un utilisateur envoie un message à un autre utilisateur, une vérification est effectuée.
- **Cas 1 : Premier message** - Si c'est le premier message de la conversation ou le premier message de cet expéditeur, une notification est automatiquement envoyée au destinataire.
- **Cas 2 : Messages suivants** - Pour les messages suivants, une notification est envoyée uniquement si le dernier message de cet expéditeur est non lu ET date de plus de X minutes.
- Ce mécanisme évite d'envoyer plusieurs notifications pour des messages successifs dans un court laps de temps, tout en garantissant que le premier contact génère toujours une notification.

### Configuration

Le délai entre les notifications peut être configuré via la variable d'environnement `MESSAGE_NOTIFICATION_THRESHOLD` (en minutes). Par défaut, cette valeur est de 30 minutes.

Exemple dans le fichier `.env` :
```
MESSAGE_NOTIFICATION_THRESHOLD=30
```

Pour désactiver complètement les notifications (sauf pour le premier message), vous pouvez définir une valeur très élevée.
