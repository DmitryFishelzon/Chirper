const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3001;

const url = 'mongodb+srv://dmitryfishelzon:test123@cluster1.jlcih30.mongodb.net/Chirper?retryWrites=true&w=majority';
const dbName = 'Chirper';
let db;

app.use(cors());
app.use(bodyParser.json());

MongoClient.connect(url)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(error => console.error(error));

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
    await db.collection('users').insertOne({ username, password: hashedPassword });

    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});