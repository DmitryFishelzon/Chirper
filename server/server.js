require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3001;

const url = process.env.MONGODB_URI;
const dbName = 'Chirper';
const secretKey = process.env.SECRET_KEY;
let db;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage to use Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'chirper',
        format: async (req, file) => file.mimetype.split('/')[1],
        public_id: (req, file) => file.fieldname + '-' + Date.now(),
    },
});

const upload = multer({ storage: storage });

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

MongoClient.connect(url)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
    })
    .catch(error => {
        console.error('Failed to connect to MongoDB:', error);
    });

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Register Endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Username and password are required' });
    }

    try {
        const user = await db.collection('users').findOne({ username });
        if (user) {
            return res.status(400).send({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({
            username,
            password: hashedPassword,
            profilePicture: null,
        });
        res.status(201).send({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ message: 'Username and password are required' });
    }

    try {
        const user = await db.collection('users').findOne({ username });
        if (!user) {
            return res.status(400).send({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });
        res.status(200).send({ success: true, message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Upload Profile Picture Endpoint
app.post('/uploadProfilePicture', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    try {
        const imagePath = req.file.path;

        await db.collection('users').updateOne(
            { username: req.user.username },
            { $set: { profilePicture: imagePath } }
        );
        res.status(201).send({ imagePath: imagePath });
    } catch (error) {
        console.error('Failed to upload profile picture:', error);
        res.status(500).send({ message: 'Failed to upload profile picture', error: error.message });
    }
});

// Upload Post Image Endpoint
app.post('/uploadPostImage', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    try {
        const imagePath = req.file.path;
        res.status(201).send({ imagePath: imagePath });
    } catch (error) {
        console.error('Failed to upload post image:', error);
        res.status(500).send({ message: 'Failed to upload post image', error: error.message });
    }
});

// Get Profile Endpoint
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ username: req.user.username });
        const posts = await db.collection('posts').find({ username: req.user.username }).toArray();
        res.status(200).send({ user, posts });
    } catch (error) {
        console.error('Failed to fetch profile data:', error);
        res.status(500).send({ message: 'Failed to fetch profile data', error: error.message });
    }
});

// Get Feed Endpoint
app.get('/feed', authenticateToken, async (req, res) => {
    try {
        const posts = await db.collection('posts').find().toArray();
        res.status(200).send(posts);
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        res.status(500).send({ message: 'Failed to fetch posts', error: error.message });
    }
});

// Create Post Endpoint
app.post('/post', authenticateToken, async (req, res) => {
    const { content, image } = req.body;

    if (!content && !image) {
        return res.status(400).send({ message: 'Content or image is required' });
    }

    try {
        const post = {
            content,
            image,
            likes: 0,
            comments: [],
            createdAt: new Date(),
            username: req.user.username,
        };
        await db.collection('posts').insertOne(post);
        res.status(201).send({ message: 'Post created successfully', post });
    } catch (error) {
        console.error('Failed to create post:', error);
        res.status(500).send({ message: 'Failed to create post', error: error.message });
    }
});

// Like Post Endpoint
app.post('/post/:id/like', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        await db.collection('posts').updateOne({ _id: new ObjectId(postId) }, { $inc: { likes: 1 } });
        res.status(200).send({ message: 'Post liked successfully' });
    } catch (error) {
        console.error('Failed to like post:', error);
        res.status(500).send({ message: 'Failed to like post', error: error.message });
    }
});

// Comment on Post Endpoint
app.post('/post/:id/comment', authenticateToken, async (req, res) => {
    const { comment } = req.body;

    if (!comment) {
        return res.status(400).send({ message: 'Comment is required' });
    }

    try {
        const postId = req.params.id;
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        const newComment = {
            username: req.user.username,
            comment,
            createdAt: new Date(),
        };

        await db.collection('posts').updateOne({ _id: new ObjectId(postId) }, { $push: { comments: newComment } });
        res.status(200).send({ message: 'Comment added successfully' });
    } catch (error) {
        console.error('Failed to add comment:', error);
        res.status(500).send({ message: 'Failed to add comment', error: error.message });
    }
});

// Delete Post Endpoint
app.delete('/post/:id', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        // Ensure the user deleting the post is the owner of the post
        if (post.username !== req.user.username) {
            return res.status(403).send({ message: 'You do not have permission to delete this post' });
        }

        await db.collection('posts').deleteOne({ _id: new ObjectId(postId) });
        res.status(200).send({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Failed to delete post:', error);
        res.status(500).send({ message: 'Failed to delete post', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});