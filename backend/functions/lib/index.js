"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_1 = require("./lib/supabase");
const auth_1 = require("./middleware/auth");
const login_1 = require("./routes/login");
const signup_1 = require("./routes/signup");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/auth/login", login_1.loginRouter);
app.use("/auth/signup", signup_1.signupRouter);
app.get("/", (_req, res) => {
    res.status(200).json({ ok: true, message: "API running" });
});
app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});
app.get("/supabase-health", async (_req, res) => {
    if (!supabase_1.supabaseAdmin) {
        res.status(503).json({
            ok: false,
            error: "SUPABASE_SERVICE_ROLE_KEY is not configured."
        });
        return;
    }
    const { error } = await supabase_1.supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
        res.status(500).json({ ok: false, error: error.message });
        return;
    }
    res.status(200).json({ ok: true });
});
app.get("/auth/me", auth_1.requireAuth, (req, res) => {
    const authenticatedRequest = req;
    res.status(200).json({ user: authenticatedRequest.user });
});
app.get("/protected/ping", auth_1.requireAuth, (req, res) => {
    const authenticatedRequest = req;
    res.status(200).json({
        ok: true,
        userId: authenticatedRequest.user.id,
        email: authenticatedRequest.user.email ?? null
    });
});
app.listen(supabase_1.appPort, () => {
    console.log(`API listening on port ${supabase_1.appPort}`);
});
