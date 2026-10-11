# Alojar web y servidor

**Proveedor pendiente de decidir.** La web de `apps/web/` la sirve el backend Bun de `apps/server/`, con assets embebidos y SQLite. Hoy escucha solo en `127.0.0.1`; no está listo para exponerlo directamente a participantes.

| Opción                              | Qué requiere                                                                    | Consecuencia                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Una máquina/VM con Bun o el binario | Proxy HTTPS, proceso supervisado, disco persistente y copias de SQLite          | Mantiene juntos web, administración y base de datos; operación a cargo del comité.                      |
| Contenedor con volumen persistente  | Runtime compatible, volumen para registro/SQLite, proxy e instancia única       | Requiere comprobar persistencia y restauración; no escalar réplicas con archivos SQLite independientes. |
| Web estática separada + backend Bun | Alojamiento estático, origen API configurable, CORS/cookies y backend con disco | Implica adaptar la web actual; no está implementado.                                                    |

Las funciones efímeras sin disco persistente no sustituyen al servidor actual tal cual. El despliegue Vercel de los **squads** es estático y se documenta en `plantilla/`; no decide dónde vive este backend.

Antes de elegir y ejecutar nada: resolver el [TODO antes de alojarlo](../../apps/web/README.md#todo-antes-de-alojarlo), especialmente identidad real, autorización de squad, HTTPS, acceso entre máquinas, límites, retención y backups. Definir responsable, dominio, coste y ensayo de restauración. Este directorio solo documenta opciones; no provisiona servicios.
