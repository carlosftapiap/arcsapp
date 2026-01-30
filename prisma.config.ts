import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  // En Prisma 7, para db pull, se recomienda usar la URL directa si se cuelga.
  // Sin embargo, la propiedad directUrl fue removida del schema.
  // La solución oficial para migraciones/pull es usar la connection string directa como 'url'.
  // O usar la flag --url en el CLI si se desea sobrescribir temporalmente.
});
