import app from "./src/app.js";
import { PORT } from "./src/config/config.js";
import { startCronJob } from "./src/services/cronService.js";

import { connectDB } from "./src/config/db.js";

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
    startCronJob();
  });
};

startServer();
