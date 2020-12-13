const { Schema, model } = require('mongoose');

const Reactionrole = new Schema({
    GuildID: String,
    Channel: String,
    MessageID: String,
    Role: String,
    Emoji: String
});

module.exports = model("Reactionrole", Reactionrole);