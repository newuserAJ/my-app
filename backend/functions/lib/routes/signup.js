"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const auth_1 = require("../middleware/auth");
const isPhone = (value) => /^\+?[0-9]{8,15}$/.test(value);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
exports.signupRouter = (0, express_1.Router)();
exports.signupRouter.post("/", async (req, res) => {
    const { name, phoneNumber, email } = req.body;
    if (!name || !phoneNumber || !email) {
        res.status(400).json({ error: "name, phoneNumber and email are required" });
        return;
    }
    if (!isPhone(phoneNumber)) {
        res.status(400).json({ error: "phoneNumber must be a valid phone number" });
        return;
    }
    if (!isEmail(email)) {
        res.status(400).json({ error: "email must be a valid email address" });
        return;
    }
    const { error } = await supabase_1.supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
            shouldCreateUser: true,
            data: {
                name,
                email
            }
        }
    });
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.status(200).json({
        ok: true,
        message: "OTP sent to phone number. Verify to complete signup."
    });
});
exports.signupRouter.post("/verify", async (req, res) => {
    const { phoneNumber, token } = req.body;
    if (!phoneNumber || !token) {
        res.status(400).json({ error: "phoneNumber and token are required" });
        return;
    }
    const { data, error } = await supabase_1.supabase.auth.verifyOtp({
        phone: phoneNumber,
        token,
        type: "sms"
    });
    if (error) {
        res.status(401).json({ error: error.message });
        return;
    }
    res.status(200).json({
        ok: true,
        message: "Phone number verified.",
        user: data.user,
        session: data.session
    });
});
exports.signupRouter.post("/set-password", auth_1.requireAuth, async (req, res) => {
    if (!supabase_1.supabaseAdmin) {
        res.status(503).json({
            error: "SUPABASE_SERVICE_ROLE_KEY is required for set-password"
        });
        return;
    }
    const { password } = req.body;
    if (!password || password.length < 8) {
        res.status(400).json({ error: "password must be at least 8 characters" });
        return;
    }
    const authenticatedRequest = req;
    const { data, error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(authenticatedRequest.user.id, { password });
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    res.status(200).json({
        ok: true,
        message: "Password set successfully.",
        user: data.user
    });
});
