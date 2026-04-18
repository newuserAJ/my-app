"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const supabase_1 = require("../lib/supabase");
const getBearerToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.slice("Bearer ".length).trim();
};
const requireAuth = async (req, res, next) => {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
        res.status(401).json({ error: "Missing Bearer token" });
        return;
    }
    const { data, error } = await supabase_1.supabase.auth.getUser(accessToken);
    if (error || !data.user) {
        res.status(401).json({ error: error?.message ?? "Invalid access token" });
        return;
    }
    req.user = data.user;
    req.accessToken = accessToken;
    next();
};
exports.requireAuth = requireAuth;
