# Reparto de equipos

Página local para formar los equipos desde el CSV de invitados de Luma y sacar el `equipos.json` que usa [equipos/](../equipos/README.md). Desde la raíz:

```sh
bun run reparto   # http://127.0.0.1:4312
```

- **Importar el CSV de Luma** vale en cualquier momento: Luma manda sobre las personas; la página, sobre los equipos. Quien aparece aprobado por primera vez con nombre de equipo entra en ese equipo, que se crea si no existe; lo que hayas movido a mano no se toca. Quien sale del CSV o deja de estar aprobado se queda marcado en su equipo, para que se vea el hueco, pero no se exporta: así nunca recibe invitación.
- **Importar equipos.json** sustituye los equipos por los del archivo (por ejemplo, el que reescribe `preparar.ts --apply`) y conserva su id, repo y mesa. Cruza a cada miembro con el CSV ya importado por su usuario de GitHub; avisa de quien no aparece. El formato no guarda capitanes: al importar se aplica la regla siguiente.
- Al importar, un equipo sin capitán toma como capitán a quien vino con equipo y se ofreció a capitanear, si solo hay una persona así; si hay más, decide el comité.
- Cada persona se arrastra a su equipo o se elige en su desplegable; ★ marca al capitán. Cada equipo avisa de lo que pide [docs/equipos.md](../../docs/equipos.md): de 3 a 5 personas, alguien de front y de datos/IA, y capitán. Con el check-in de la noche, marca quién no ha llegado.
- Cada cambio se guarda en `.reparto/estado.json`, fuera de Git como el CSV. Los guardados van de uno en uno: si otra pestaña guardó antes, la página carga esa versión en vez de pisarla.
- **Exportar** valida con las reglas de `preparar.ts` (cupo por track, una persona por equipo, GitHub válido) y escribe `.reparto/equipos.json` solo con personas aprobadas. La primera exportación fija a cada equipo su id (la primera letra libre de su track: `derechos-a`, `derechos-b`… y `libre`) y, si no la tiene, la primera mesa libre. Después no cambian aunque reordenes o borres equipos, y un id borrado no se reutiliza: de él cuelgan el repo, la URL y las invitaciones. Cambiar de track da id y repo nuevos. Después: `bun infra/equipos/preparar.ts --equipos .reparto/equipos.json --dry-run`.

Solo escucha en `127.0.0.1`: los datos de los invitados no salen de tu máquina.
