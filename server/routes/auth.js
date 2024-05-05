const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connect = require('../db');
const User = require('../models/user');

// User Registration
router.post('/register', async (req, res) => {
    const db = await connect();
    const user = new User(db);

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        };

        const result = await user.createUser(newUser);
        res.status(201).json({ message: 'User created', userId: result.insertedId });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const db = await connect();
    const user = new User(db);

    try {
        const userData = await user.findUserByEmail(req.body.email);
        if (!userData) return res.status(404).json({ message: 'User not found' });

        // Compare the password
        const validPassword = await bcrypt.compare(req.body.password, userData.password);
        if (!validPassword) return res.status(401).json({ message: 'Invalid password' });

        // Generate JWT
        const token = jwt.sign({ _id: userData._id, name: userData.name }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;