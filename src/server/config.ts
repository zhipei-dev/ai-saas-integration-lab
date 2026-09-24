export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DATABASE_PATH ?? 'data/app.sqlite',
};
