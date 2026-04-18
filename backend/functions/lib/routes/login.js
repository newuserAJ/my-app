"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const isPhone = (value) => /^\+?[0-9]{8,15}$/.test(value);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
exports.loginRouter = (0, express_1.Router)();
exports.loginRouter.post("/check-username", async (req, res) => {
    if (!supabase_1.supabaseAdmin) {
        res.status(503).json({
            error: "SUPABASE_SERVICE_ROLE_KEY is required for username check"
        });
        return;
    }
    const { username } = req.body;
    if (!username) {
        res.status(400).json({ error: "username is required" });
        return;
    }
    if (!isEmail(username) && !isPhone(username)) {
        res.status(400).json({
            error: "username must be a valid email or phone number"
        });
        return;
    }
    const normalizedUsername = username.toLowerCase();
    let exists = false;
    const pageSize = 200;
    const maxPages = 10;
    for (let page = 1; page <= maxPages; page += 1) {
        const { data, error } = await supabase_1.supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: pageSize
        });
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        if (!data?.users?.length) {
            break;
        }
        exists = data.users.some((user) => {
            const emailMatches = user.email?.toLowerCase() === normalizedUsername;
            const phoneMatches = user.phone === username;
            return emailMatches || phoneMatches;
        });
        if (exists || data.users.length < pageSize) {
            break;
        }
    }
    res.status(200).json({ exists });
});
exports.loginRouter.post("/", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "username and password are required" });
        return;
    }
    if (!username.includes("@") && !isPhone(username)) {
        res.status(400).json({
            error: "username must be a valid email or phone number"
        });
        return;
    }
    const signInResponse = username.includes("@")
        ? await supabase_1.supabase.auth.signInWithPassword({ email: username, password })
        : await supabase_1.supabase.auth.signInWithPassword({ phone: username, password });
    const { data, error } = signInResponse;
    if (error) {
        res.status(401).json({ error: error.message });
        return;
    }
    res.status(200).json({ user: data.user, session: data.session });
});
