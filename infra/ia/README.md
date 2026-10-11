# Claves de IA por squad

**Presupuesto propuesto: 20 USD por equipo; hasta 15 equipos, unos 300 USD como máximo.** Quién lo paga sigue pendiente. El script permite bajar el límite; rechaza valores no positivos, más de 20 USD por clave, squads duplicados y más de 15 squads. El tope es de uso, sin reinicio periódico, e incluye BYOK. No compra créditos.

Desde la raíz, con un `equipos.json` ya revisado:

```sh
bun infra/ia/claves.ts --equipos /ruta/al/registro/equipos.json --limite 20 --dry-run
```

Por defecto es simulación: imprime squad, endpoint y límite, **nunca claves**, y no crea archivos ni llama a OpenRouter. El registro base está vacío: hay que preparar los equipos primero.

Para aplicar más adelante, el comité crea una clave de gestión (antes llamada Provisioning API key) en OpenRouter y la carga por su gestor de secretos en `OPENROUTER_PROVISIONING_API_KEY`. No es una clave de inferencia. Después de revisar el plan y el presupuesto, se usa `--apply`.

- `POST https://openrouter.ai/api/v1/keys`, con `name`, `limit`, `limit_reset: null` e `include_byok_in_limit: true`.
- Cada clave y su hash quedan en `.local-secrets/openrouter/<squad>.json`, ignorado por Git, archivo **600** y carpeta **700**. Se rechazan archivos/carpetas inseguros y enlaces simbólicos. La clave maestra nunca se guarda.
- Una clave ya guardada se omite al repetir con el mismo límite. No se crean duplicados. El archivo se reserva antes de llamar; cada éxito se guarda y sincroniza antes del siguiente squad.
- Un timeout o error deja un estado `pending`. **No borres ese archivo ni reintentes a ciegas**: comprueba el nombre de la clave en el panel de OpenRouter; puede haberse creado aunque no llegara la respuesta. Si no se guardó el secreto, revoca la clave huérfana en el panel antes de preparar una sustitución. No hay rollback automático.
- Los errores del proveedor se omiten para que no puedan filtrar secretos. No compartas el archivo completo: entrega a cada squad solo su clave por el canal privado que decida el comité. No pongas claves en repos, chats públicos ni bundles estáticos. La integración de IA de las herramientas necesita un backend/proxy aún por decidir.
- Al terminar el evento, deshabilita o revoca las claves por su hash y revisa el gasto. El límite global de la cuenta, otros créditos y otras claves deben revisarse aparte; el script controla este lote, no toda la cuenta.

Referencia: [API de gestión de OpenRouter](https://openrouter.ai/docs/guides/overview/auth/management-api-keys). Las pruebas usan un proveedor simulado; no se han creado claves reales.
