import app from "./app";

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, () => {
  console.log(`IndustrialFlow ERP server running on port ${PORT}`);
});