# OB1 Admin

Interface d’administration React, TypeScript et Vite pour le service Outbox.

## Configuration

Copier `.env.example` vers `.env.local`, puis adapter les valeurs à l’environnement :

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_BASE_URL=ws://127.0.0.1:8000
```

Les deux valeurs doivent être des URL absolues, sans identifiants, query string ni fragment. En développement Vite, les valeurs ci-dessus servent également de valeurs par défaut. Hors développement, une configuration explicite est obligatoire. Aucune URL de production n’est incluse dans le dépôt.

## Lancement et vérifications

```bash
npm ci
npm run dev
```

Les vérifications locales sont disponibles séparément :

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Session

La connexion appelle `POST /auth/login` avec l’adresse e-mail et le mot de passe, puis confirme l’identité par `GET /auth/me`. Le bearer JWT est centralisé derrière une abstraction et conservé uniquement dans `sessionStorage`. Sa présence seule ne rend jamais l’utilisateur authentifié : le token doit contenir une expiration future et l’API doit confirmer l’utilisateur courant.

Ce stockage limite la persistance à l’onglet et permet une migration future du mécanisme sans modifier chaque service HTTP. Il reste néanmoins accessible à du JavaScript exécuté dans la page et ne protège donc pas le bearer contre une XSS. Le backend ne fournit actuellement ni cookie HttpOnly, ni refresh token, ni endpoint de révocation applicable. À expiration ou après une réponse 401, la session locale est supprimée et une nouvelle connexion est requise. La déconnexion efface uniquement la session frontend ; elle ne révoque pas le JWT stateless côté serveur.

Le client HTTP commun ajoute le bearer aux appels authentifiés, structure les erreurs publiques et centralise les comportements suivants :

- une réponse 401 invalide la session et ramène vers la connexion ;
- une réponse 403 conserve la session et affiche l’état « Accès interdit ».

Les routes applicatives sont protégées pendant la restauration comme pour un utilisateur anonyme. Après une nouvelle connexion, une destination interne demandée auparavant peut être reprise ; les destinations externes et chemins ambigus sont rejetés.

## Limites actuelles

Les permissions par projet ne sont pas inventées par le frontend. Leur consommation dépendra des contrats livrés avec [Projects et membres](https://github.com/Lovegiver/outbox-service/issues/91) et [API keys](https://github.com/Lovegiver/outbox-service/issues/92).

La base WebSocket est configurable, mais le runtime existant n’est pas refondu dans ce lot. Aucun token n’est placé dans son URL et cette interface ne prétend pas résoudre l’authentification ou le scope Project du WebSocket, suivis dans [l’issue runtime](https://github.com/Lovegiver/outbox-service/issues/96).
