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
        res.status(500).send({ message: 'Failed to fetch profile data', error: error.message });
    }
});

// Get Feed Endpoint
app.get('/feed', authenticateToken, async (req, res) => {
    try {
        const posts = await db.collection('posts').find().toArray();
        res.status(200).send(posts);
    } catch (error) {
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
        const user = await db.collection('users').findOne({ username: req.user.username });

        const post = {
            content,
            image,
            likesCount: 0,
            likes: [],
            comments: [],
            createdAt: new Date(),
            username: req.user.username,
            profilePicture: user.profilePicture,
        };
        await db.collection('posts').insertOne(post);
        res.status(201).send({ message: 'Post created successfully', post });
    } catch (error) {
        res.status(500).send({ message: 'Failed to create post', error: error.message });
    }
});

// Update Post Content Endpoint
app.put('/post/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).send({ message: 'Content is required' });
    }

    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        if (post.username !== req.user.username) {
            return res.status(403).send({ message: 'Unauthorized to update this post' });
        }

        await db.collection('posts').updateOne(
            { _id: new ObjectId(id) },
            { $set: { content } }
        );

        res.status(200).send({ message: 'Post updated successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to update post', error: error.message });
    }
});

// Update Bio Endpoint
app.put('/updateBio', authenticateToken, async (req, res) => {
    const { bio } = req.body;

    try {
        await db.collection('users').updateOne(
            { username: req.user.username },
            { $set: { bio: bio } }
        );
        res.status(200).send({ message: 'Bio updated successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to update bio', error: error.message });
    }
});

// Like Post Endpoint
app.post('/post/:id/like', authenticateToken, async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        if (post.likes.includes(req.user.username)) {
            return res.status(400).send({ message: 'You have already liked this post' });
        }

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $inc: { likesCount: 1 }, $push: { likes: req.user.username } }
        );

        res.status(200).send({ message: 'Post liked successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to like post', error: error.message });
    }
});

// Comment on Post Endpoint
app.post('/post/:id/comment', authenticateToken, async (req, res) => {
    const { comment } = req.body;
    const postId = req.params.id;

    if (!comment) {
        return res.status(400).send({ message: 'Comment is required' });
    }

    try {
        const user = await db.collection('users').findOne({ username: req.user.username });
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        const newComment = {
            _id: new ObjectId(),
            username: req.user.username,
            profilePicture: user.profilePicture,
            comment,
            createdAt: new Date(),
            likes: [],
            replies: [],
        };

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: newComment } }
        );

        res.status(200).send({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
        res.status(500).send({ message: 'Failed to add comment', error: error.message });
    }
});

// Like Comment Endpoint
app.post('/post/:postId/comment/:commentId/like', authenticateToken, async (req, res) => {
    const { postId, commentId } = req.params;

    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).send({ message: 'Comment not found' });
        }

        const comment = post.comments[commentIndex];
        if (comment.likes.includes(req.user.username)) {
            return res.status(400).send({ message: 'You have already liked this comment' });
        }

        post.comments[commentIndex].likes.push(req.user.username);

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
            { $set: { "comments.$.likes": comment.likes } }
        );

        res.status(200).send({ message: 'Comment liked successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to like comment', error: error.message });
    }
});

// Like Reply Endpoint
app.post('/post/:postId/comment/:commentId/reply/:replyId/like', authenticateToken, async (req, res) => {
    const { postId, commentId, replyId } = req.params;

    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).send({ message: 'Comment not found' });
        }

        const replyIndex = post.comments[commentIndex].replies.findIndex(r => r._id.toString() === replyId);
        if (replyIndex === -1) {
            return res.status(404).send({ message: 'Reply not found' });
        }

        const reply = post.comments[commentIndex].replies[replyIndex];
        if (reply.likes.includes(req.user.username)) {
            return res.status(400).send({ message: 'You have already liked this reply' });
        }

        post.comments[commentIndex].replies[replyIndex].likes.push(req.user.username);

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId), "comments.replies._id": new ObjectId(replyId) },
            { $set: { "comments.$[comment].replies.$[reply].likes": reply.likes } },
            { arrayFilters: [{ "comment._id": new ObjectId(commentId) }, { "reply._id": new ObjectId(replyId) }] }
        );

        res.status(200).send({ message: 'Reply liked successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to like reply', error: error.message });
    }
});

// Reply to Comment Endpoint
app.post('/post/:postId/comment/:commentId/reply', authenticateToken, async (req, res) => {
    const { reply } = req.body;
    const { postId, commentId } = req.params;

    if (!reply) {
        return res.status(400).send({ message: 'Reply is required' });
    }

    try {
        const user = await db.collection('users').findOne({ username: req.user.username });
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        const newReply = {
            _id: new ObjectId(),
            username: req.user.username,
            profilePicture: user.profilePicture,
            reply,
            createdAt: new Date(),
            likes: [],
        };

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
            { $push: { "comments.$.replies": newReply } }
        );

        res.status(200).send({ message: 'Reply added successfully', reply: newReply });
    } catch (error) {
        res.status(500).send({ message: 'Failed to add reply', error: error.message });
    }
});

// Delete Post Endpoint
app.delete('/post/:id', authenticateToken, async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        if (post.username !== req.user.username) {
            return res.status(403).send({ message: 'Unauthorized to delete this post' });
        }

        await db.collection('posts').deleteOne({ _id: new ObjectId(postId) });

        res.status(200).send({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to delete post', error: error.message });
    }
});

// Delete Comment Endpoint
app.delete('/post/:postId/comment/:commentId', authenticateToken, async (req, res) => {
    const { postId, commentId } = req.params;

    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        const comment = post.comments.find(c => c._id.toString() === commentId);
        if (!comment) {
            return res.status(404).send({ message: 'Comment not found' });
        }

        if (comment.username !== req.user.username && post.username !== req.user.username) {
            return res.status(403).send({ message: 'Unauthorized to delete this comment' });
        }

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId) },
            { $pull: { comments: { _id: new ObjectId(commentId) } } }
        );

        res.status(200).send({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to delete comment', error: error.message });
    }
});

// Delete Reply Endpoint
app.delete('/post/:postId/comment/:commentId/reply/:replyId', authenticateToken, async (req, res) => {
    const { postId, commentId, replyId } = req.params;

    try {
        const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        const comment = post.comments.find(c => c._id.toString() === commentId);
        if (!comment) {
            return res.status(404).send({ message: 'Comment not found' });
        }

        const reply = comment.replies.find(r => r._id.toString() === replyId);
        if (!reply) {
            return res.status(404).send({ message: 'Reply not found' });
        }

        if (reply.username !== req.user.username && post.username !== req.user.username) {
            return res.status(403).send({ message: 'Unauthorized to delete this reply' });
        }

        await db.collection('posts').updateOne(
            { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
            { $pull: { "comments.$.replies": { _id: new ObjectId(replyId) } } }
        );

        res.status(200).send({ message: 'Reply deleted successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to delete reply', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});