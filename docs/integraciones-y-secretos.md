# Zumek: integraciones, llaves y secretos

Guía para el equipo sobre qué servicios externos usamos, dónde vive cada llave y cómo se conectan Supabase, AWS Bedrock (chat con IA), ElevenLabs (voz) y n8n.

---

## 1. La decisión en corto

| Servicio | Para qué lo usamos | Quién paga |
|---|---|---|
| **Supabase** | Base de datos (Postgres), usuarios invitados, seguridad por usuario (RLS), Edge Functions y archivos (Storage) | Plan gratis, alcanza de sobra |
| **AWS Bedrock** | El modelo de IA (Claude) que responde en el chat | Créditos de AWS (hay que confirmar que los cubren) |
| **ElevenLabs** | Leer en voz alta los pasos de receta en el modo cocina (opcional) | Cuenta de ElevenLabs, aparte de AWS |
| **n8n** | Automatizar trabajo del equipo: curar recetas, revisar precios, avisos | Fuera de la app |

**No usamos DynamoDB.** Supabase ya nos da gratis base de datos, login como invitado y seguridad por usuario en una sola herramienta. Cambiar a DynamoDB implicaría armar 4 servicios de AWS (DynamoDB, Cognito, Lambda y API Gateway) y rediseñar las tablas sin ahorrar nada. Los créditos de AWS rinden más pagando lo único que cobra por uso: la IA.

> Supabase gratis **se pausa si pasa 1 semana sin uso**. Un día antes de la demo, abran la app para confirmar que está activa.

---

## 2. Dónde vive cada llave

**Regla de oro: las llaves de API nunca van en la base de datos, en la app, en el repo, en capturas ni en el chat del equipo.**

La base de datos guarda *datos* (recetas, precios, planes). La app lee esas tablas, así que cualquier cosa guardada ahí podría llegar al teléfono de un usuario. Los **secrets de las Edge Functions** solo los puede leer el código que corre en el servidor de Supabase.

| Llave | Dónde va | ¿Puede ir en la app? |
|---|---|---|
| Supabase `anon key` | En la app | **Sí.** Es pública por diseño y RLS protege los datos |
| Supabase `service_role` | En ningún archivo. Supabase la inyecta sola en las Edge Functions | **Nunca** |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Secrets de Edge Functions en Supabase | **Nunca** |
| `ELEVENLABS_API_KEY` | Secrets de Edge Functions en Supabase | **Nunca** |
| Credenciales de n8n (Google Sheets, WhatsApp, etc.) | Gestor de credenciales del propio n8n | **Nunca**, tampoco en el repo |
| Cualquiera de las anteriores para pruebas locales | `supabase/functions/.env` (Git ya lo ignora) | — |

### Cómo guardar un secret en Supabase

- **Dashboard:** Supabase → tu proyecto → Edge Functions → Secrets → Add new secret.
- **Terminal:** `supabase secrets set NOMBRE=valor`

### Variables que existen

La plantilla con los nombres, sin valores, está en `supabase/functions/.env.example`. Para probar en local:

```bash
cp supabase/functions/.env.example supabase/functions/.env
# llena los valores en .env; ese archivo nunca se sube (está en .gitignore)
```

### Si una llave se filtra

1. **Revócala de inmediato** en el servicio (AWS IAM, ElevenLabs, etc.) y genera una nueva.
2. Actualiza el secret en Supabase.
3. Si llegó a GitHub, borrar el commit **no basta**: la llave ya se considera pública. Siempre hay que revocarla.

---

## 3. Chat con IA: AWS Bedrock

La guía completa y detallada está en el documento *Zumek: guía de Supabase + AWS Bedrock*, que comparte quien coordina el proyecto. Aquí va el resumen.

### Cómo viaja un mensaje

```
App → Edge Function "chat" (Supabase) → Bedrock (Claude) → Edge Function → App
```

La app **nunca** llama a AWS directo. Solo la Edge Function conoce las llaves.

### Pasos

1. **Créditos:** en AWS → Billing and Cost Management → Credits, confirmar que cubren Bedrock con modelos de terceros (Claude) y anotar cuándo vencen.
2. **Modelo:** en Amazon Bedrock → Model access (región `us-east-1`), revisar qué modelos de Claude están disponibles:

   | Modelo | Id en Bedrock | Acceso |
   |---|---|---|
   | Claude Opus 5 | `anthropic.claude-opus-5` | Puede requerir aprobación |
   | Claude Sonnet 5 | `anthropic.claude-sonnet-5` | Abierto |
   | Claude Haiku 4.5 | `anthropic.claude-haiku-4-5` | Abierto |

3. **Usuario de AWS con un solo permiso:** crear en IAM la política `zumek-bedrock-invoke`:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "bedrock-mantle:CreateInference", "Resource": "*" }
     ]
   }
   ```

   > Ojo: el permiso correcto para los modelos nuevos de Claude es **`bedrock-mantle:CreateInference`**. El permiso viejo `bedrock:InvokeModel` no sirve para ellos.

   Crear el usuario `zumek-chat` sin acceso a la consola, asignarle solo esa política y generar sus access keys (*Application running outside AWS*).
4. **Secrets en Supabase:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=us-east-1` y `BEDROCK_MODEL_ID`.
5. **Edge Function `chat`:** usa `AnthropicBedrockMantle` de `@anthropic-ai/bedrock-sdk` con las 5 tools del Master Prompt (sección 6).

### Reglas del chat

- **Límite de uso:** antes de cada llamada se revisa `ai_call_log`. Si el usuario lleva 10 o más llamadas en el último minuto, se responde con error sin llamar al modelo.
- **La IA nunca escribe en la base:** las tools que modifican el plan (`update_budget`, `swap_recipe`, `swap_ingredient`) solo **proponen**. La app corre el planner, muestra "¿Aplicar este cambio?" y guarda solo si el usuario confirma.
- **Errores:** si algo falla, el chat muestra "No pude procesar eso, ¿puedes reformular?" y el detalle técnico queda solo en los logs.

### Plan B si los créditos no cubren Bedrock

Se cambia solo el proveedor. Por ejemplo, la API de Claude directa (`@anthropic-ai/sdk`, secret `ANTHROPIC_API_KEY`, modelo `claude-opus-5`). Las tools, el límite de uso, la confirmación y la app se quedan igual.

---

## 4. Voz: ElevenLabs (opcional, después de la Fase 6)

Sirve para que el modo cocina lea cada paso en voz alta. El asistente al que se le habla (voz a texto) queda para después del hackathon (Fase 6.1).

### Cómo viaja

```
App → Edge Function "tts" (Supabase) → ElevenLabs → audio → App
```

### Pasos

1. Crear la cuenta de ElevenLabs, generar una API key y elegir una voz en español; anotar su `voice_id`.
2. Guardar como secrets en Supabase: `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID`.
3. Crear la Edge Function `tts`, que:
   1. valida el JWT del usuario, igual que `chat`;
   2. revisa y registra el uso en `ai_call_log`, con el mismo límite por minuto;
   3. recibe **solo el id del paso** (`recipe_step.id`), nunca texto libre. Así nadie puede usar nuestra llave para generar audio de cualquier cosa;
   4. lee el texto de ese paso en `recipe_step` y lo manda a la API de texto a voz de ElevenLabs (header `xi-api-key`). Verifiquen el endpoint y el modelo multilingüe actual en su documentación;
   5. regresa el audio (`audio/mpeg`) a la app.
4. **Para ahorrar créditos:** guardar cada audio en **Supabase Storage** (un bucket `tts-audio`, archivo `<recipe_step.id>.mp3`). Los pasos no cambian, así que cada uno se genera una sola vez y después se sirve desde Storage.
5. **Si ElevenLabs falla**, el paso se sigue viendo en texto. La voz es un extra, no un requisito para cocinar.

---

## 5. n8n: automatizaciones del equipo

n8n **no forma parte de la app**. Sirve para el trabajo del equipo y para preparar datos.

| Uso | Recomendación |
|---|---|
| Generar recetas con IA → Google Sheets → revisión humana de alérgenos e ingredientes → JSON para `seed.sql` | Sí |
| Revisar el JSON del scraper de precios (precios en cero, duplicados, nombres raros) | Sí |
| Avisos a WhatsApp o Discord de pushes, PRs y tests que fallan | Sí |
| Formulario de feedback de usuarios | Opcional |
| Scraping programado cada semana | Después del hackathon (Fase 5.1) |
| Usar n8n como intermediario del chat de IA | **No.** Lo hace la Edge Function |
| Que n8n escriba o modifique planes en la base | **No.** La IA nunca escribe directo |

Las credenciales viven en el gestor de credenciales de n8n. No se pegan dentro de los nodos ni se exportan en los flujos compartidos.

---

## 6. Checklist

- [ ] Confirmamos que los créditos de AWS cubren Bedrock y sabemos cuándo vencen
- [ ] El usuario IAM `zumek-chat` tiene **solo** `bedrock-mantle:CreateInference`
- [ ] Todas las llaves están como secrets en Supabase y en ningún otro lado
- [ ] Nadie tiene llaves en el repo, en el chat del equipo ni en capturas
- [ ] `supabase/functions/.env` existe solo en las computadoras de quien lo necesita
- [ ] La Edge Function `chat` respeta el límite de uso y la confirmación del usuario
- [ ] (Opcional) La Edge Function `tts` recibe solo ids de paso y guarda los audios en Storage
