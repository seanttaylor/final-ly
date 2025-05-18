import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.json({ timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`backend: listening on port ${port}`);
});