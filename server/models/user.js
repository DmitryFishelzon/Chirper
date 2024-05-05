const ObjectId = require('mongodb').ObjectId;

class User {
    constructor(db) {
        this.collection = db.collection('users');
    }

    async createUser(userData) {
        return await this.collection.insertOne(userData);
    }

    async findUserById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }
    
}

module.exports = User;