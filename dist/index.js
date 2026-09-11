import "dotenv/config";
import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Laundry Backend is running",
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map