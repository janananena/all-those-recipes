import jsonServer from 'json-server';
import fs from 'fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express(); // top-level app
const server = express.Router(); // API router

const rawRecipeSchema = await fs.promises.readFile(new URL('./recipe.schema.json', import.meta.url));
const recipeSchema = JSON.parse(rawRecipeSchema);
const rawTagSchema = await fs.promises.readFile(new URL('./tag.schema.json', import.meta.url));
const tagSchema = JSON.parse(rawTagSchema);
const rawFavoritesSchema = await fs.promises.readFile(new URL('./favorites.schema.json', import.meta.url));
const favoritesSchema = JSON.parse(rawFavoritesSchema);

const router = jsonServer.router(process.env.DATABASE_FILE);
const middlewares = jsonServer.defaults();

const ajv = new Ajv();
addFormats(ajv);

ajv.addSchema(recipeSchema, 'https://example.com/recipe.schema.json');
ajv.addSchema(tagSchema, 'https://example.com/tag.schema.json');
ajv.addSchema(favoritesSchema, 'https://example.com/favorites.schema.json');

const validateRecipe = ajv.compile(recipeSchema);
const validateTag = ajv.compile(tagSchema);
const validateFavorites = ajv.compile(favoritesSchema);

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
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

server.use(authMiddleware);

// File handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadFolder = join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, {recursive: true});

const storage = multer.memoryStorage();
const upload = multer({storage});

server.post('/uploadImage', upload.single('image'), async (req, res) => {
    try {
        console.log('Received image upload request');
        if (!req.file) return res.status(400).json({error: 'No file uploaded'});

        const timestamp = Date.now();
        const outputFilename = `${timestamp}-${req.file.originalname.replace(/\s+/g, '-')}`;
        const outputPath = join(uploadFolder, outputFilename);

        console.log('Processing image...');
        await sharp(req.file.buffer)
            .resize({ width: 800 })
            .jpeg({ quality: 80 })
            .toFile(outputPath);

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
        const outputFilename = `${timestamp}-${req.file.originalname.replace(/\s+/g, '-')}`;
        const outputPath = join(uploadFolder, outputFilename);

        await fs.promises.writeFile(outputPath, req.file.buffer);

        res.json({ url: `/uploads/${outputFilename}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Failed to upload file'});
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
        if(req.path.startsWith('/recipes')) {
            const valid = validateRecipe(req.body);
            if (!valid) return res.status(400).json({ errors: validateRecipe.errors });
        } else if (req.path.startsWith('/tags'))  {
            const valid = validateTag(req.body);
            if (!valid) return res.status(400).json({ errors: validateTag.errors });
        } else if (req.path.startsWith('/favorites')){
            const valid = validateFavorites(req.body);
            if (!valid) return res.status(400).json({ errors: validateFavorites.errors });
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
        const defaultUser = { username: 'admin', passwordHash };
        await fs.promises.writeFile(usersFilePath, JSON.stringify([defaultUser], null, 2), 'utf-8');
        console.log('🔐 Default admin user created: username=admin, password=password');
    }
};

await ensureDefaultAdminUser();


server.post('/createUser', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        let users = JSON.parse(data);

        if (users.find(u => u.username === username)) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        users.push({ username, passwordHash });

        // Remove default admin if other user is added
        if (username !== 'admin' && users.some(u => u.username === 'admin')) {
            users = users.filter(u => u.username !== 'admin');
            console.log('🗑️ Default admin user removed after real user creation');
        }

        await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

server.get('/users', (req, res) => {
    fs.promises.readFile(usersFilePath, 'utf-8')
        .then(data => {
            const users = JSON.parse(data).map(u => ({ username: u.username }));
            res.json(users);
        })
        .catch(err => {
            console.error('Failed to read users:', err);
            res.status(500).json({ error: 'Failed to fetch users' });
        });
});

server.delete('/users/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        let users = JSON.parse(data);

        if (!users.find(u => u.username === username)) {
            return res.status(404).json({ error: 'User not found' });
        }

        users = users.filter(u => u.username !== username);

        // If last user deleted, re-create default admin
        if (users.length === 0) {
            const passwordHash = await bcrypt.hash('password', 10);
            users.push({ username: 'admin', passwordHash });
            console.log('All users deleted, re-created default admin (admin/password)');
        }

        await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
        res.json({ message: `User '${username}' deleted` });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

server.get('/me', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ username: req.user.username });
});

server.post('/changePassword', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const username = req.user?.username;

    if (!username || !oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!valid) return res.status(403).json({ error: 'Old password incorrect' });

        user.passwordHash = await bcrypt.hash(newPassword, 10);

        await fs.promises.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';

server.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        if (!fs.existsSync(usersFilePath)) {
            return res.status(500).json({ error: 'User database not found' });
        }

        const data = await fs.promises.readFile(usersFilePath, 'utf-8');
        const users = JSON.parse(data);
        const user = users.find(u => u.username === username);

        if (!user) return res.status(401).json({ error: 'Invalid username or password' });

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return res.status(401).json({ error: 'Invalid username or password' });

        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Attach json-server routes last
server.use(router);

// Mount uploads outside /api
app.use('/uploads', express.static(join(__dirname, 'public', 'uploads')));

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
});

