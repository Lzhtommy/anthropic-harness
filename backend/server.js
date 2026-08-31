import app from './app.js';
import config from './config.js';

app.listen(config.port, () => {
  console.log(`Server running in demo mode on port ${config.port}`);
});
