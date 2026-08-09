import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Mini ERP + CRM Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check available at: http://localhost:${PORT}/api/health`);
});
