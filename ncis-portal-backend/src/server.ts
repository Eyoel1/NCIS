import { buildApp } from './app';
import { config } from './config/env';

async function start() {
  const app = await buildApp({
    logger: {
      level: 'info',
    },
  });

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`NCIS Portal Backend is running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
