import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import jwt from "jsonwebtoken";
import type { Context } from "koa";
import dotenv from "dotenv";
import { z } from "zod";
import cors from "@koa/cors";
import Groq from "groq-sdk";

dotenv.config();

const app = new Koa();
app.use(cors({ origin: "*" }));
const router = new Router();
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";
const groq = new Groq({
	apiKey: process.env.GROQ,
});

const loginSchema = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(1, "Password is required"),
});

app.use(bodyParser());

// Route to login and generate JWT token
router.post("/login", async (ctx: Context) => {
	try {
		const validatedBody = loginSchema.parse(ctx.request.body);
		const { username, password } = validatedBody;
		console.log(username, password);
		if (username === "admin" && password === "password123") {
			const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
			ctx.body = { token };
		} else {
			ctx.status = 401;
			ctx.body = { message: "Invalid credentials" };
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			ctx.status = 400;
			ctx.body = { message: error.errors };
		} else {
			ctx.status = 500;
			ctx.body = { message: "Internal server error" };
		}
	}
});
const chatSchema = z.object({
	message: z.string().min(1, "Message is required"),
});

//personal assistant

router.post("/chat", async (ctx) => {
	const validatedBody = chatSchema.parse(ctx.request.body);
	const { message } = validatedBody;

	try {
		const chatCompletion = await groq.chat.completions.create({
			messages: [
				{
					role: "user",
					content: message,
				},
			],
			model: "llama3-8b-8192",
		});

		// Set response body with the reply from LLM
		ctx.body = {
			reply: chatCompletion.choices[0]?.message?.content || "No response",
		};
	} catch (error) {
		console.error("Error fetching chat completion:", error);
		ctx.status = 500;
		ctx.body = { error: "Failed to process the request" };
	}
});


//image generation
const imageSchema = z.object({
	input: z.string().min(1, "Input is required"),
});
router.post("/generate-image", async (ctx) => {
	const validatedBody = imageSchema.parse(ctx.request.body);
	const { input } = validatedBody;

	try {
		const response = await fetch(
			"https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
			{
				headers: {
					Authorization: `Bearer ${process.env.TOKEN}`,
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify({ inputs: input }),
			},
		);

		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			const jsonResponse = await response.json();
			ctx.status = 200;
			ctx.body = { error: jsonResponse };
		} else {
			const image = await response.blob();
			ctx.status = 200;
			ctx.body = image;
		}
	} catch (error) {
		console.error("Error calling Hugging Face API:", error);
		ctx.status = 500;
		ctx.body = { error: "Failed to generate image" };
	}
});

router;

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
	console.log("Server running on http://localhost:3000");
});
