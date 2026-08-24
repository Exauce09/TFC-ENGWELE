# API AMEN sur Render

## Déploiement

1. Compte [render.com](https://render.com) + connexion GitHub `Exauce09/TFC-ENGWELE`
2. **New → Blueprint** → sélectionner le dépôt (fichier `render.yaml` à la racine)
3. Attendre le premier deploy (MySQL + Web Service `amen-api`)
4. URL publique : `https://amen-api.onrender.com` (ou le nom choisi)
5. Seed démo (Shell Render une fois) :
   ```bash
   php artisan db:seed --force
   ```
6. Flutter APK :
   ```powershell
   cd mobile_flutter
   .\build-apk.ps1 -ApiBaseUrl "https://amen-api.onrender.com/api/v1"
   ```

## Notes

- Plan free : le service s’endort après inactivité (réveil ~30–60 s).
- CORS : le mobile Sanctum (Bearer) n’a pas besoin d’origine navigateur.
- Tunnel local (`start-api-online.ps1`) reste disponible pour le debug.
