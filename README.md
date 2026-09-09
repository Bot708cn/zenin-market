# Zenin Market — déploiement

## 1. Configurer les clés Supabase en local (pour tester avant de déployer, optionnel)
Copie `.env.local.example` en `.env.local` et remplace les valeurs par les tiennes
(Project URL + Publishable key, trouvables dans Supabase → Project Settings → API).

## 2. Envoyer le code sur GitHub (depuis Termux)

```bash
cd zenin-market-app
git init
git add .
git commit -m "Site Zenin Market"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/zenin-market.git
git push -u origin main
```

(Remplace `TON-PSEUDO` par ton nom d'utilisateur GitHub, et crée d'abord un
repo vide nommé `zenin-market` sur github.com avant de faire le push.)

## 3. Déployer sur Vercel

1. Va sur vercel.com, connecte-toi avec ton compte GitHub
2. "Add New Project" → sélectionne le repo `zenin-market`
3. Dans "Environment Variables", ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = ton Project URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ta Publishable key Supabase
4. Clique "Deploy"

Après 1-2 minutes, ton site sera en ligne sur une URL du type
`zenin-market.vercel.app`.

## Accès admin

Clique 10 fois sur le logo dans les 2 secondes → redirige vers `/admin`.
⚠️ Il n'y a actuellement AUCUN mot de passe sur cette page : n'importe qui
qui devine ou tape `/admin` dans l'URL y a accès. À sécuriser avant de
partager largement le site.
