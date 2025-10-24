# 🔄 INSTRUCCIONES DE RESTAURACIÓN - DASHBOARD

## 📅 Información del Backup
- **Fecha:** 23 de octubre de 2025
- **Hora:** 7:15 PM
- **Archivos respaldados:** 2

---

## 🚨 ¿CUÁNDO RESTAURAR?

Restaura los archivos si experimentas:
- ❌ Errores en el dashboard
- ❌ Datos incorrectos en las estadísticas
- ❌ Errores 500 en el endpoint `/api/dashboard/estadisticas`
- ❌ Tarjetas que no se muestran correctamente

---

## 🔧 RESTAURACIÓN RÁPIDA

### Opción 1: PowerShell (Windows)

```powershell
# Restaurar backend
Copy-Item backups/dashboard_backup_20251023_191557/index.js.backup backend/index.js -Force

# Restaurar frontend
Copy-Item backups/dashboard_backup_20251023_191557/Dashboard.jsx.backup frontend/src/Dashboard.jsx -Force

# Verificar
Write-Host "✅ Archivos restaurados" -ForegroundColor Green
```

### Opción 2: Git Bash / Linux / Mac

```bash
# Restaurar backend
cp backups/dashboard_backup_20251023_191557/index.js.backup backend/index.js

# Restaurar frontend
cp backups/dashboard_backup_20251023_191557/Dashboard.jsx.backup frontend/src/Dashboard.jsx

# Verificar
echo "✅ Archivos restaurados"
```

---

## 🔍 VERIFICACIÓN POST-RESTAURACIÓN

### 1. Backend
```bash
cd backend
node index.js
# Verificar que no haya errores de sintaxis
```

### 2. Frontend
```bash
cd frontend
npm start
# Verificar que compila sin errores
```

### 3. Endpoint de estadísticas
```bash
# Probar el endpoint
curl http://localhost:5000/api/dashboard/estadisticas
```

---

## 📦 CONTENIDO DEL BACKUP

### Archivo 1: `index.js.backup`
- **Ubicación original:** `backend/index.js`
- **Tamaño:** ~87 KB
- **Líneas:** ~2500
- **Endpoints afectados:**
  - `/api/dashboard/estadisticas`
  - `/api/dashboard/estadisticas/:periodo`

### Archivo 2: `Dashboard.jsx.backup`
- **Ubicación original:** `frontend/src/Dashboard.jsx`
- **Tamaño:** ~29 KB
- **Líneas:** ~850
- **Componentes:** Dashboard principal

---

## 🔄 RESTAURACIÓN SELECTIVA

### Si solo quieres restaurar el backend:
```powershell
Copy-Item backups/dashboard_backup_20251023_191557/index.js.backup backend/index.js -Force
```

### Si solo quieres restaurar el frontend:
```powershell
Copy-Item backups/dashboard_backup_20251023_191557/Dashboard.jsx.backup frontend/src/Dashboard.jsx -Force
```

---

## 📝 CAMBIOS QUE SE REVERTIRÁN

Al restaurar, se revertirán:

1. ❌ Cambio de estado "Finalizado" → "Entregado"
2. ❌ Filtro de mes actual (MONTH vs 30 días)
3. ❌ Mejora en contador de pendientes
4. ❌ Nuevo campo `ordenes_listas_entrega`
5. ❌ 3 nuevas tarjetas en el dashboard

---

## ⚠️ IMPORTANTE

Después de restaurar:

1. **Reinicia el servidor backend**
   ```bash
   # Detener el proceso actual (Ctrl+C)
   # Iniciar nuevamente
   cd backend
   node index.js
   ```

2. **Reinicia el frontend** (si está corriendo localmente)
   ```bash
   # Detener el proceso actual (Ctrl+C)
   # Iniciar nuevamente
   cd frontend
   npm start
   ```

3. **Si está en Railway:**
   ```bash
   git add backend/index.js frontend/src/Dashboard.jsx
   git commit -m "Revert: Restaurar dashboard a versión anterior"
   git push origin main
   ```

---

## 🆘 SOPORTE

Si necesitas ayuda o los archivos de backup están corruptos:

1. Verifica la integridad:
   ```powershell
   Get-ChildItem backups/dashboard_backup_20251023_191557
   ```

2. Compara tamaños:
   - `index.js.backup`: ~87 KB
   - `Dashboard.jsx.backup`: ~29 KB

3. Si los archivos están dañados, contacta al administrador del sistema.

---

## ✅ CHECKLIST DE RESTAURACIÓN

- [ ] Backup verificado y disponible
- [ ] Archivos copiados a su ubicación original
- [ ] Backend reiniciado sin errores
- [ ] Frontend reiniciado sin errores
- [ ] Dashboard carga correctamente
- [ ] Estadísticas se muestran sin errores
- [ ] Logs del servidor revisados

---

**Creado:** 23/10/2025 - 7:15 PM  
**Versión:** 1.0  
**Estado:** ✅ LISTO PARA USO

