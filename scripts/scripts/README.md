# Scripts de Utilidades - Intellego Platform

Scripts de mantenimiento y verificación para la plataforma Intellego.

## 📋 Scripts Disponibles

### `check_feedback_json.py`

Script para detectar y corregir problemas de JSON malformado en la tabla `Feedback`.

#### 🎯 Funcionalidades

1. **Detección de problemas**:
   - JSON con doble escape (`\\\"`)
   - JSON inválido o corrupto
   - Keys faltantes en skillsMetrics
   - Valores no numéricos en las métricas

2. **Reporte detallado**:
   - Estadísticas generales
   - Lista de feedbacks problemáticos
   - Tipo de problema y si es corregible

3. **Corrección automática**:
   - Puede corregir automáticamente problemas de doble escape
   - Actualiza la base de datos de forma segura

#### 🚀 Instalación

```bash
# 1. Navegar a la carpeta de scripts
cd scripts

# 2. Instalar dependencias
pip install -r requirements.txt
```

#### 📖 Uso

**Modo verificación (sin corregir):**
```bash
python check_feedback_json.py
```

**Modo corrección automática:**
```bash
python check_feedback_json.py --fix
```

#### 📊 Ejemplo de Salida

```
🚀 Script de Verificación de Feedbacks
======================================================================
🔍 Iniciando verificación de feedbacks...
📊 Total de feedbacks con skillsMetrics: 1547

======================================================================
📋 REPORTE DE VERIFICACIÓN DE FEEDBACKS
======================================================================

📊 Estadísticas Generales:
   Total de feedbacks:        1547
   ✅ Feedbacks válidos:      1545 (99.9%)
   ❌ Feedbacks con problemas: 2 (0.1%)

🔍 Problemas por Tipo:
   🔸 Doble escape:           2
   🔸 JSON inválido:          0
   🔸 Keys faltantes:         0

📝 Detalles de Problemas Encontrados:
----------------------------------------------------------------------

1. ID: fb_002_1_xme36sglh_2025-09-22_001
   Estudiante: u_5slmhhh0xme36sglh
   Materia: Química
   Semana: 2025-09-22
   Tipo: double_escaped
   Descripción: JSON con doble escape (\\\")
   Corregible: ✅ Sí
```

#### 🔧 Requisitos

- Python 3.8+
- Variables de entorno configuradas:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`

Estas variables se cargan automáticamente desde el archivo `.env` en la raíz del proyecto.

#### ⚠️ Advertencias

- El modo `--fix` modificará la base de datos
- Siempre haz un backup antes de ejecutar correcciones automáticas
- Los problemas que no sean de doble escape requieren corrección manual

#### 🐛 Problemas Comunes

**Error: "libsql_client no está instalado"**
```bash
pip install libsql-client
```

**Error: "Variables de entorno no configuradas"**
- Asegúrate de tener el archivo `.env` en la raíz del proyecto
- Verifica que contenga `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`

#### 📝 Notas

- El script usa la misma conexión a Turso que la aplicación Next.js
- Todos los cambios se registran con `updatedAt = datetime('now')`
- La verificación es no destructiva (solo lectura)
- La corrección solo actúa sobre problemas específicos y verificados

---

## 🔄 Mantenimiento Regular

Se recomienda ejecutar este script:
- Después de migraciones de datos
- Cuando se detecten problemas de visualización en dashboards
- Mensualmente como parte del mantenimiento preventivo

## 📞 Soporte

Para reportar problemas o sugerencias sobre estos scripts, contacta al equipo de desarrollo.
