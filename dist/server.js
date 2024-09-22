"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_router_1 = __importDefault(require("koa-router"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const app = new koa_1.default();
const router = new koa_router_1.default();
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";
const loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
app.use((0, koa_bodyparser_1.default)());
// Route to login and generate JWT token
router.post("/login", async (ctx) => {
    try {
        // Parse and validate the request body using the Zod schema
        const validatedBody = loginSchema.parse(ctx.request.body);
        const { username, password } = validatedBody;
        // Authenticate the user (you should replace this with real authentication logic)
        if (username === "admin" && password === "password123") {
            const token = jsonwebtoken_1.default.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
            ctx.body = { token };
        }
        else {
            ctx.status = 401;
            ctx.body = { message: "Invalid credentials" };
        }
    }
    catch (error) {
        // If validation fails, return a 400 error with the validation message
        if (error instanceof zod_1.z.ZodError) {
            ctx.status = 400;
            ctx.body = { message: error.errors };
        }
        else {
            ctx.status = 500;
            ctx.body = { message: "Internal server error" };
        }
    }
});
app.use(router.routes()).use(router.allowedMethods());
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
