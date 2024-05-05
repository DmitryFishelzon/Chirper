const express = require('express');
const router = express.Router();
const connect = require('../db');
const User = require('../models/user');

router.get('/user/:id', async (req, res) => {
    const db = await connect();
    const user = new User(db);
    const userData = await user.findUserById(req.params.id);
    res.json(userData);
});

router.post('/user', async (req, res) => {
    const db = await connect();
    const user = new User(db);
    const result = await user.createUser(req.body);
    res.json(result);
});

module.exports = router;
