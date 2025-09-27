import jsonServer from 'json-server';
import fs from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {fileURLToPath} from 'url';
import path, {dirname, join} from 'path';
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid';
import axios from "axios";

import pdf from "pdf-parse";
import {fromBuffer} from "pdf2pic";
import PDFDocument from "pdfkit";

dotenv.config();

const app = express(); // top-level app
const server = express.Router(); // API router

const rawRecipeSchema = await fs.promises.readFile(new URL('./recipe.schema.json', import.meta.url));
const recipeSchema = JSON.parse(rawRecipeSchema);
const rawTagSchema = await fs.promises.readFile(new URL('./tag.schema.json', import.meta.url));
const tagSchema = JSON.parse(rawTagSchema);
const rawFavoritesSchema = await fs.promises.readFile(new URL('./favorites.schema.json', import.meta.url));
const favoritesSchema = JSON.parse(rawFavoritesSchema);
const rawBooksSchema = await fs.promises.readFile(new URL('./book.schema.json', import.meta.url));
const booksSchema = JSON.parse(rawBooksSchema);
const rawShoppingListsSchema = await fs.promises.readFile(new URL('./shoppingLists.schema.json', import.meta.url));
const shoppingListsSchema = JSON.parse(rawShoppingListsSchema);

const router = jsonServer.router(process.env.DATABASE_FILE);
const middlewares = jsonServer.defaults();

const ajv = new Ajv();
addFormats(ajv);

ajv.addSchema(recipeSchema, 'https://example.com/recipe.schema.json');
ajv.addSchema(tagSchema, 'https://example.com/tag.schema.json');
ajv.addSchema(favoritesSchema, 'https://example.com/favorites.schema.json');
ajv.addSchema(booksSchema, 'https://example.com/book.schema.json');
ajv.addSchema(shoppingListsSchema, 'https://example.com/shoppingLists.schema.json');

const validateRecipe = ajv.compile(recipeSchema);
const validateTag = ajv.compile(tagSchema);
const validateFavorites = ajv.compile(favoritesSchema);
const validateBooks = ajv.compile(booksSchema);
const validateShoppingLists = ajv.compile(shoppingListsSchema);

// Middleware
server.use(middlewares);

server.use(jsonServer.bodyParser);

// Health check
server.get('/health', (req, res) => {
    res.send('OK');
});

// Auth middleware
const authMiddleware = (req, res, next) => {
    const openPaths = ['/health', '/login'];
    if (openPaths.includes(req.path)) return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error: 'Missing or invalid Authorization header'});
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.userId;
        req.roles = decoded.roles;
        next();
    } catch (err) {
        return res.status(401).json({error: 'Invalid or expired token'});
    }
};

function requireRole(role) {
    return (req, res, next) => {
        const userId = req.user;
        if (!userId) {
            console.warn("No userId given.");
            return res.status(401).json({message: "Unauthorized."});
        }
        const roles = req.roles;

        if (roles.includes("admin")) {
            console.log("Admin can pass.");
            return next();
        }

        if (!roles?.includes(role)) {
            console.log(`User ${userId} does not have required role ${role}.`);
            return res.status(403).json({error: "Forbidden: Insufficient roles."});
        }
        console.log(`User ${userId}: found required role ${role}.`);
        next();
    };
}

server.use(authMiddleware);

// File handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadFolder = join(__dirname, 'public', 'uploads');
const shoppingListFolder = join(__dirname, 'public', 'shopping-lists');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, {recursive: true});
if (!fs.existsSync(shoppingListFolder)) fs.mkdirSync(shoppingListFolder, {recursive: true});

const storage = multer.memoryStorage();
const upload = multer({storage});

function sanitizeFilename(filename) {
    const replacements = {
        "ä": "ae",
        "ö": "oe",
        "ü": "ue",
        "Ä": "Ae",
        "Ö": "Oe",
        "Ü": "Ue",
        "ß": "ss",
    };

    // Replace umlauts
    filename = filename.replace(/[äöüÄÖÜß]/g, (char) => replacements[char] ?? char);

    // Replace spaces with underscores
    filename = filename.replace(/\s+/g, "_");

    // Remove all other non-safe characters
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "");

    return filename;
}

async function extractIngredients(recipeName, fulltext) {
    const ingredientPrompt = process.env.INGREDIENT_PROMPT;
    const ingredientPromptFull = `${ingredientPrompt}\nRecipe name: ${recipeName}\nText:${fulltext}`;
    const googlePalmKey = process.env.GOOGLE_PALM_API_KEY;
    const ingRes = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": googlePalmKey
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{text: ingredientPromptFull}]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 10000,
                    topP: 0.8,
                    topK: 40,
                }
            })
        });
    const result = await ingRes.json();

    const ingText =
        result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let ingredients = [];
    try {
        const start = ingText.indexOf("[");
        const end = ingText.lastIndexOf("]");
        const ingredientsJson = ingText.slice(start, end + 1);
        ingredients = JSON.parse(ingredientsJson);
        // console.log(`parsed ingredients: ${ingredients}`);
    } catch (err) {
        console.error("Failed to parse ingredients JSON:", err);
    }
    return ingredients;
}

async function extractSteps(recipeName, fulltext) {
    const stepsPrompt = process.env.STEPS_PROMPT;
    const stepsPromptFull = `${stepsPrompt}\nRecipe name: ${recipeName}\nText:${fulltext}`;
    const googlePalmKey = process.env.GOOGLE_PALM_API_KEY;
    const stepsRes = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": googlePalmKey
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{text: stepsPromptFull}]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 10000,
                    topP: 0.8,
                    topK: 40,
                }
            })
        });
    const stepsResult = await stepsRes.json();

    const stepsText =
        stepsResult.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let steps = [];
    try {
        const start = stepsText.indexOf("[");
        const end = stepsText.lastIndexOf("]");
        steps = JSON.parse(stepsText.slice(start, end + 1));
        // console.log(`parsed steps: ${steps}`);
    } catch (err) {
        console.error("Failed to parse steps JSON:", err);
    }
    return steps;
}

async function extractTextFromBase64(base64) {
    const googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY;
    const visionRes = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
        {
            requests: [
                {
                    image: {content: base64},
                    features: [{type: "TEXT_DETECTION"}],
                },
            ],
        },
        {
            headers: {
                Authorization: '',
            }
        }
    );
    // console.log('Vision API response:', JSON.stringify(visionRes.data, null, 2));

    return visionRes.data.responses?.[0]?.fullTextAnnotation?.text ?? "";
}

async function combineIngredients(ingredientList) {
    const cleanupPrompt = process.env.CLEANUP_INGREDIENTS_PROMPT;
    const cleanupPromptFull = `${cleanupPrompt}\nIngredient list: ${JSON.stringify(ingredientList)}`;
    const googlePalmKey = process.env.GOOGLE_PALM_API_KEY;
    const ingredientsRes = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": googlePalmKey
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{text: cleanupPromptFull}]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 15000,
                    topP: 0.8,
                    topK: 40,
                }
            })
        });
    const ingredientsResult = await ingredientsRes.json();
    // console.log(`google res ${ingredientsRes}`, ingredientsRes);

    const ingredientsText =
        ingredientsResult.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log(`got improved ingredients from ai: ${ingredientsText}`);

    let ingredients = [];
    try {
        const start = ingredientsText.indexOf("[");
        const end = ingredientsText.lastIndexOf("]");
        ingredients = JSON.parse(ingredientsText.slice(start, end + 1));
        // console.log(`parsed ingredients: ${ingredients}`);
    } catch (err) {
        console.error("Failed to parse improved ingredients JSON:", err);
    }
    return ingredients;
}

async function extractImageText(fileUrl) {
    const filePath = path.join(uploadFolder, path.basename(fileUrl));
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");

    // Google Vision OCR
    return await extractTextFromBase64(base64);
}

async function updateRecipe(recipeId, fulltext) {

    const recipe = router.db.get("recipes").find({id: recipeId}).value();
    if (!recipe) {
        return res.status(404).json({error: "Recipe not found"});
    }
    const ingredients = await extractIngredients(recipe.name, fulltext);

    const steps = await extractSteps(recipe.name, fulltext);

    const recipeIngredients = [{group: "extracted", items: ingredients}];

    // Update recipe in db.json
    router.db.get("recipes").find({id: recipeId}).assign({
        ingredients: recipeIngredients,
        steps: steps
    }).write();

    // Return updated recipe
    return {...recipe, ingredients: recipeIngredients, steps: steps};
}

async function addShoppingList(id, username, createdAt, recipeIds, listFileUrl){

    const lists = router.db.get("shoppingLists").value();

    router.db.get("shoppingLists").assign([...lists, {
        id: id,
        username: username,
        createdAt: createdAt,
        recipeIds: recipeIds,
        listFileUrl: listFileUrl,
        notes: ''
    }]).write();
}

async function pdfToImagesBase64(pdfBuffer) {
    const converter = fromBuffer(pdfBuffer, {
        density: 300,       // DPI
        format: "png",      // output format
        width: 1200,
        height: 1600
    });

    const images = [];

    // pdf2pic uses .bulk() or .convert()
    const converted = await converter.bulk(-1, {responseType: "base64"});
    // -1 means all pages

    for (const page of converted) {
        images.push(page.base64); // each page has a base64 string
    }

    return images;
}

server.post("/extract-recipe-from-pdf", async (req, res) => {
    const {recipeId, fileUrl} = req.body;

    try {
        const filePath = path.join(uploadFolder, path.basename(fileUrl));
        if (!filePath.toLowerCase().endsWith(".pdf")) {
            return res.status(400).json({error: "Not a pdf."});
        }
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({error: "PDF file not found on server."});
        }
        const fileBuffer = fs.readFileSync(filePath);

        if (!fileBuffer || fileBuffer.length === 0) {
            return res.status(400).json({error: "PDF file is empty."});
        }

        const data = await pdf(fileBuffer);
        const pdfText = data.text.trim() || "";

        console.log("pdf text: ", pdfText);
        if (pdfText !== '') {
            const newRecipe = await updateRecipe(recipeId, pdfText);
            res.json(newRecipe);
        } else {
            const images = await pdfToImagesBase64(fileBuffer);
            let texts = [];
            for (const i of images) {
                texts.push(await extractTextFromBase64(i));
            }
            const fulltext = texts.join(' ');
            console.log("pdf image text: ", fulltext);
            const newRecipe = await updateRecipe(recipeId, fulltext);
            res.json(newRecipe);
        }
    } catch (err) {
        console.error("Processing recipe failed:", err);
        res.status(500).json({error: "Processing recipe failed"});
    }

});

server.post("/extract-recipe-from-image", async (req, res) => {
    const {recipeId, fileUrl} = req.body;

    try {
        const fulltext = await extractImageText(fileUrl);
        const newRecipe = await updateRecipe(recipeId, fulltext);
        res.json(newRecipe);
    } catch (err) {
        console.error("Processing recipe failed:", err);
        res.status(500).json({error: "Processing recipe failed"});
    }
});


server.post('/uploadImage', upload.single('image'), async (req, res) => {
    try {
        console.log('Received image upload request');
        if (!req.file) return res.status(400).json({error: 'No file uploaded'});

        const timestamp = Date.now();
        const outputFilename = `${timestamp}-${sanitizeFilename(req.file.originalname)}`;
        const outputPath = join(uploadFolder, outputFilename);

        console.log('Processing image...');
        await fs.promises.writeFile(outputPath, req.file.buffer);

        res.json({url: `/uploads/${outputFilename}`});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to process image'});
    }
});

server.post('/uploadFile', upload.single('file'), async (req, res) => {
    try {
        console.log('Received file upload request');
        if (!req.file) return res.status(400).json({error: 'No file uploaded'});

        const timestamp = Date.now();
        const outputFilename = `${timestamp}-${sanitizeFilename(req.file.originalname)}`;
        const outputPath = join(uploadFolder, outputFilename);

        await fs.promises.writeFile(outputPath, req.file.buffer);

        res.json({url: `/uploads/${outputFilename}`});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to upload file'});
    }
});

// Helper: capitalize ingredient name
const capitalizeIngredientName = (name) => {
    return name
        .split(" ")
        .map(w => w[0] ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "")
        .join(" ");
};

// Helper: normalize amounts spacing ("100g" -> "100 g")
const normalizeAmountSpacing = (amount) => {
    return (amount || "").replace(/([\d.,]+)\s*(\D+)/, "$1 $2").trim();
};

async function processIngredients(ingredientRows) {
    console.log("processing ingredients")
    for (let row of ingredientRows) {
        row.name = capitalizeIngredientName(row.name);
        row.amount = normalizeAmountSpacing(row.amount);
        // console.log(`changed name to ${row.name} and amount to ${row.amount}`);
    }

    return await combineIngredients(ingredientRows);
}

function getCETTimestamp() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).formatToParts(now);

    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return {date: now, dateString: `${map.year}-${map.month}-${map.day}-${map.hour}-${map.minute}-${map.second}`};
}

server.post('/shopping-list', async (req, res) => {
    try {
        const recipeIds = req.body.recipeIds;
        if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
            console.log(`error! request is ${req}`, req);
            return res.status(400).json({error: "recipes array is required"});
        }

        // Load recipes from DB
        const recipes = router.db.get("recipes");
        const selectedRecipes = recipeIds
            .map(id => {
                return recipes.find({id}).value();
            })
            .filter(r => r && Array.isArray(r.ingredients) && r.ingredients.length > 0);

        if (selectedRecipes.length === 0) {
            return res.status(400).json({error: "No valid recipes with ingredients found"});
        }
        console.log(`found ${selectedRecipes.length} recipes.`, selectedRecipes);

        // Flatten ingredients
        const ingredientRows = [];
        selectedRecipes.forEach((recipe, i) => {
            recipe.ingredients.forEach(group => {
                group.items.forEach(ing => {
                    ingredientRows.push({
                        amount: ing.amount || "",
                        name: ing.name,
                        recipes: [i+1]
                    });
                });
            });
        });

        const improvedIngredients = await processIngredients(ingredientRows);
        // console.log(`improved ingredients: ${improvedIngredients}`, improvedIngredients);

        // Create PDF
        const doc = new PDFDocument({
            size: "A4",
            margin: 40
        });
        const timestamp = getCETTimestamp();
        const username = req.user || "guest";
        const fileName = `shopping_${username}_${timestamp.dateString}.pdf`;
        const folderPath = join(__dirname, "public", "shopping-lists");
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, {recursive: true});
        const filePath = join(folderPath, fileName);

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Header
        doc.fontSize(12).text(`Shopping List for ${username}`, {align: "left"});
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Generated from recipes`, {align: "left"});
        selectedRecipes.forEach((recipe, i) => {
            doc.fontSize(10).text(`   ${i+1}. ${recipe.name}`, {align: "left"});
        });
        doc.moveDown(1.5);

        // Layout constants
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const checkboxSize = 12;
        const spacing = 10;
        const paddingY = 5;
        const amountWidth = pageWidth * 0.25;
        const ingredientWidth = pageWidth - checkboxSize - spacing - amountWidth - spacing * 2;

        let cursorY = doc.y;
        doc.font("Helvetica");
        doc.fontSize(8);

        const startX = doc.page.margins.left;

        for (const row of improvedIngredients) {
            const amount = row.amount || "";
            const ingredient = row.ingredient || "";
            const recipes = row.recipes || [];

            const startY = cursorY;

            // Measure text heights without changing cursor
            const amountHeight = doc.heightOfString(amount, {width: amountWidth, align: "right"});
            const ingredientHeight = doc.heightOfString(ingredient, {width: ingredientWidth, align: "left"});
            const rowHeight = Math.max(checkboxSize, amountHeight, ingredientHeight) + paddingY;

            doc.strokeColor("#888888");
            // Checkbox (vertically centered)
            doc.rect(
                startX,
                startY + (rowHeight - checkboxSize) / 2,
                checkboxSize,
                checkboxSize
            ).stroke();

            // Amount text
            const amountX = startX + checkboxSize + spacing;
            doc.text(amount, amountX, startY + paddingY, {
                width: amountWidth,
                align: "right"
            });

// Ingredient text (main part)
            const ingredientX = amountX + amountWidth + spacing;
            let textY = startY + paddingY;

            doc.fontSize(8).fillColor("black");
            doc.text(ingredient, ingredientX, textY, {
                continued: true,   // keep cursor on same line
                width: ingredientWidth,
                align: "left"
            });

// Secondary part in smaller font + gray
            const secondary = recipes.map(n => n.toString()).join(", ");
            if (secondary) {
                doc.fontSize(6).fillColor("#404040");
                doc.text(" " + `Recipes ${secondary}`, {
                    continued: false // release line
                });
            }

// Reset back to normal for next row
            doc.fontSize(8).fillColor("black");

            // Separator line (a bit below text)
            const lineY = startY + rowHeight;
            doc.moveTo(startX, lineY)
                .lineTo(startX + pageWidth, lineY)
                .stroke();

            // Update cursor
            cursorY = lineY;
            if (cursorY > doc.page.height - doc.page.margins.bottom - 40) {
                doc.addPage();
                cursorY = doc.page.margins.top;
            }
            doc.y = cursorY;
        }

        doc.x = startX;
        doc.moveDown(1.5);
        doc.fontSize(10).text(`Generated ${timestamp.dateString}`, {align: "left"});

        doc.end();

        writeStream.on("finish", async () => {
            await addShoppingList(timestamp.dateString, username, timestamp.date, recipeIds, `/shopping-lists/${fileName}`);
            res.json({url: `/shopping-lists/${fileName}`});
        });

        writeStream.on("error", (err) => {
            console.error("Error writing PDF:", err);
            res.status(500).json({error: "Failed to generate PDF"});
        });

    } catch (err) {
        console.error("Shopping list generation failed:", err);
        res.status(500).json({error: "Internal server error"});
    }
});

// Auto-generate ID for recipes if not provided
server.use((req, res, next) => {
    if (req.method === 'POST' && req.path.startsWith('/recipes')) {
        if (!req.body.id) {
            req.body.id = uuidv4();
        }
    }
    next();
});

// Schema validation middleware
server.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (req.path.startsWith('/recipes')) {
            const valid = validateRecipe(req.body);
            if (!valid) return res.status(400).json({errors: validateRecipe.errors});
        } else if (req.path.startsWith('/tags')) {
            const valid = validateTag(req.body);
            if (!valid) return res.status(400).json({errors: validateTag.errors});
        } else if (req.path.startsWith('/favorites')) {
            const valid = validateFavorites(req.body);
            if (!valid) return res.status(400).json({errors: validateFavorites.errors});
        } else if (req.path.startsWith('/books')) {
            const valid = validateBooks(req.body);
            if (!valid) return res.status(400).json({errors: validateBooks.errors});
        } else if (req.path.startsWith('/shoppingLists')) {
            const valid = validateShoppingLists(req.body);
            if (!valid) return res.status(400).json({errors: validateShoppingLists.errors});
        }
    }
    next();
});

// User management
const usersFilePath = join(__dirname, 'users', 'user.json');

const ensureDefaultAdminUser = async () => {
    const userDir = join(__dirname, 'users');
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);

    let users = [];
    if (fs.existsSync(usersFilePath)) {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        users = JSON.parse(data);
    }

    if (users.length === 0) {
        const passwordHash = await bcrypt.hash('password', 10);
        const defaultUser = {username: 'admin', passwordHash, roles: ["admin"]};
        await fs.promises.writeFile(usersFilePath, JSON.stringify([defaultUser], null, 2), 'utf-8');
        console.log('🔐 Default admin user created: username=admin, password=password');
    }
};

await ensureDefaultAdminUser();

server.post('/createUser', requireRole("usermanager"), async (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) return res.status(400).json({error: 'Username and password required'});

    try {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        let users = JSON.parse(data);

        if (users.find(u => u.username === username)) {
            return res.status(409).json({error: 'User already exists'});
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Remove default admin if other user is added
        if (username !== 'admin' && users.some(u => u.username === 'admin')) {
            users.push({username, passwordHash, roles: ["admin"]});
            users = users.filter(u => u.username !== 'admin');
            console.log('🗑️ Default admin user removed after real user creation');
        } else {
            users.push({username, passwordHash, roles: []});
        }

        await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');

        res.status(201).json({message: 'User created successfully'});
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({error: 'Internal server error'});
    }
});

server.get('/users', (req, res) => {
    fs.promises.readFile(usersFilePath, 'utf-8')
        .then(data => {
            const users = JSON.parse(data).map(u => ({username: u.username, roles: u.roles}));
            res.json(users);
        })
        .catch(err => {
            console.error('Failed to read users:', err);
            res.status(500).json({error: 'Failed to fetch users'});
        });
});

server.delete('/users/:username', requireRole("admin"), async (req, res) => {
    const {username} = req.params;

    try {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        let users = JSON.parse(data);

        if (!users.find(u => u.username === username)) {
            return res.status(404).json({error: 'User not found'});
        }

        users = users.filter(u => u.username !== username);

        // If last user deleted, re-create default admin
        if (users.length === 0) {
            const passwordHash = await bcrypt.hash('password', 10);
            users.push({username: 'admin', passwordHash, roles: ["admin"]});
            console.log('All users deleted, re-created default admin (admin/password)');
        }

        await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
        res.json({message: `User '${username}' deleted`});
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({error: 'Internal server error'});
    }
});

server.get('/me', (req, res) => {
    if (!req.user) return res.status(401).json({error: 'Unauthorized'});
    res.json({username: req.user, roles: req.roles});
});

server.post('/changePassword', async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    const username = req.user?.username;

    if (!username || !oldPassword || !newPassword) {
        return res.status(400).json({error: 'Missing required fields'});
    }

    try {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username);

        if (!user) return res.status(404).json({error: 'User not found'});

        const valid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!valid) return res.status(403).json({error: 'Old password incorrect'});

        user.passwordHash = await bcrypt.hash(newPassword, 10);

        await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
        res.json({message: 'Password changed successfully'});
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({error: 'Internal server error'});
    }
});

server.patch('/users/:username/roles', async (req, res) => {
    const {username} = req.params;
    const {roles} = req.body; // expecting an array of strings
    const requesterRoles = req.roles || [];

    if (!Array.isArray(roles)) {
        console.log(`patch roles user ${username} roles ${roles}`);
        return res.status(400).json({error: "Roles must be an array"});
    }

    try {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        const users = JSON.parse(data);

        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        // 🔒 Permission checks
        if (requesterRoles.includes("admin")) {
            // admins can assign any roles
            user.roles = roles;
        } else if (requesterRoles.includes("usermanager")) {
            if (roles.includes("admin")) {
                return res.status(403).json({error: "Only admin can assign admin role."});
            }
            user.roles = roles;
        } else {
            console.log(`User ${req.user} does not have required role usermanager.`);
            return res.status(403).json({error: "Forbidden: insufficient permissions."});
        }

        await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
        res.json({message: `Roles updated for ${username}`, roles: user.roles});
    } catch (err) {
        console.error("Error updating roles:", err);
        res.status(500).json({error: "Internal server error"});
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';

server.post('/login', async (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) return res.status(400).json({error: 'Username and password required'});

    try {
        if (!fs.existsSync(usersFilePath)) {
            return res.status(500).json({error: 'User database not found'});
        }

        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username);

        if (!user) return res.status(401).json({error: 'Invalid username or password'});

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return res.status(401).json({error: 'Invalid username or password'});

        const token = jwt.sign(
            {userId: username, roles: user.roles},
            JWT_SECRET,
            {expiresIn: '7d'});

        res.json({token});
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({error: 'Internal server error'});
    }
});

// Attach json-server routes last
server.use(router);

// Mount uploads outside /api
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));
app.use('/shopping-lists', express.static(join(__dirname, 'public', 'shopping-lists')));

// Mount API router under /api
app.use('/api', server);

// Start server
app.listen(process.env.SERVER_PORT || 3010, process.env.SERVER_HOSTNAME || "0.0.0.0", () => {
    const baseUrl = `http://${process.env.SERVER_HOSTNAME || "0.0.0.0"}:${process.env.SERVER_PORT || 3010}`;
    console.log(`Server running at ${baseUrl}/`);

    // Log available JSON Server routes
    const routes = Object.keys(router.db.getState());
    console.log('Available routes:');
    routes.forEach((route) => {
        console.log(`  ${baseUrl}/api/${route}`);
    });
    console.log(`  ${baseUrl}/uploads`);
    console.log(`  ${baseUrl}/shopping-lists`);
});

