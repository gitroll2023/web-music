import { initializeConfig } from '../src/utils/configManager.js';

async function main() {
  try {
    await initializeConfig();
    console.log('Configuration initialized successfully');
  } catch (error) {
    console.error('Error initializing configuration:', error);
    process.exit(1);
  }
}

main();
