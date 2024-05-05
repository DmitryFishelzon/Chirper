const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connect() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        return client.db('chirper');
    } catch (e) {
        console.error(e);
    }
}

module.exports = connect;