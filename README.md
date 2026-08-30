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

## Projects et membres

La route `/projects` liste les Projects accessibles à l’utilisateur courant (`Tous les Projects` pour un ADMIN global). La sélection utilise une URL explicite `/projects/:projectId`. Seul l’identifiant non sensible du Project courant est conservé dans `sessionStorage`; il est revalidé contre la liste accessible et supprimé au logout ou lorsqu’il n’est plus accessible.

Les capacités actuellement reliées au backend sont :

- création d’un Project et attribution automatique du rôle OWNER au créateur ;
- consultation des informations renvoyées par la liste ;
- désactivation confirmée, sans la présenter comme une suppression ;
- liste des membres ;
- ajout d’un compte OB1 existant ;
- changement de rôle parmi `OWNER`, `DEVELOPER` et `VIEWER` ;
- retrait confirmé d’un membre.

Le frontend utilise le rôle global de `/auth/me` et le rôle Project réellement chargé uniquement pour améliorer l’ergonomie. Le backend reste autoritaire et un 403 local conserve la session tout en affichant l’erreur dans le parcours. La rétrogradation et le retrait du dernier OWNER sont désactivés lorsque l’état chargé permet de les reconnaître ; le backend vérifie toujours cet invariant au moment de la transaction et son éventuel refus concurrent est affiché.

Le backend ne fournit actuellement ni détail Project individuel, ni modification, ni réactivation, ni suppression physique. Il permet seulement d’ajouter un utilisateur déjà enregistré : aucun workflow d’invitation ou envoi d’e-mail n’est simulé. Ces limites restent suivies par les issues [profil](https://github.com/Lovegiver/outbox-service/issues/23), [invitations](https://github.com/Lovegiver/outbox-service/issues/31) et [départ du dernier OWNER](https://github.com/Lovegiver/outbox-service/issues/34).

Les API keys restent entièrement hors de ce parcours et constituent la prochaine étape distincte : [issue #92](https://github.com/Lovegiver/outbox-service/issues/92).

## Dépendances et compatibilité

Le lot Projects n’effectue aucune migration de dépendance. La fondation utilise déjà React 19, React Router 7, Vite 8, TypeScript 6, ESLint 10 et Vitest 4. Les majors disponibles sans besoin fonctionnel direct sont différées afin de ne pas coupler #91 à une migration générale. `npm outdated` et `npm audit` doivent être réévalués dans une intervention dédiée avant toute montée majeure.

## Limites actuelles

La base WebSocket est configurable, mais le runtime existant n’est pas refondu dans ce lot. Aucun token n’est placé dans son URL et cette interface ne prétend pas résoudre l’authentification ou le scope Project du WebSocket, suivis dans [l’issue runtime](https://github.com/Lovegiver/outbox-service/issues/96).
