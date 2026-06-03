import dotenv from 'dotenv';
dotenv.config();

import pool from './db/pool';
import { createApp } from './app';

const port = parseInt(process.env.PORT || '3000', 10);
const app = createApp(pool);

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
