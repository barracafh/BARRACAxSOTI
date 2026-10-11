import {z} from 'zod';
import {fichaSchema} from '../src/lib/modelo';
await Bun.write(new URL('../esquemas/ficha.schema.json',import.meta.url),JSON.stringify(z.toJSONSchema(fichaSchema,{unrepresentable:'any'}),null,2)+'\n');
