import express from "express";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/src", express.static(path.join(__dirname, "src")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// PORT
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
