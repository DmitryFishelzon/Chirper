const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

const url = process.env.MONGODB_URI;
const dbName = 'Chirper';

if (!url) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
}

(async () => {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(dbName);
        await db.collection('users').updateMany({}, { $set: { profilePicture: null } });
        console.log('Updated user documents to include profilePicture field');
    } catch (error) {
        console.error('Error updating user documents:', error);
    } finally {
        await client.close();
    }
})();
