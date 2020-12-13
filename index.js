const Discord = require('discord.js');
const mongoose = require('mongoose');
const client = new Discord.Client();
const prefix = '$';
let reactionmodel = require('./models/reactionrole');
client.on('ready', async() => {
    console.log('Ready');
    mongoose.connect("MONGODB_URL", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(async() => console.log('Ready DataBase'));
});


client.on('message', async(message) => {
  if(message.author.bot) return;
  if(message.content.startsWith(prefix + 'rradd')) {
    let args = message.content.split(' ');
    let channel = message.mentions.channels.first();
    if(!channel) return message.channel.send(`**${prefix}rradd \`<#Channel> <MessageID> <@&Role> <Emoji>\`**`);
    if(!message.guild.channels.cache.find((ch) => ch.id == channel.id)) return message.reply(`**invaild channel**`);
    if(!args[2]) return message.channel.send(`**${prefix}rradd ${channel} \`<MessageID> <@&Role> <Emoji>\`**`);
    let role = message.guild.roles.cache.find((ro) => ro.id === args[3]);
    if(!role) return message.channel.send(`**${prefix}rradd <#${args[1]}> ${args[2]} \`<@&Role> <Emoji>\`**`);
    if(!message.guild.roles.cache.find((ro) => ro.id == role.id)) return message.reply(`**invaild role**`);
    if(!args[4]) return message.channel.send(`**${prefix}rradd <#${args[1]}> ${args[2]} ${args[3]} \`<Emoji>\`**`);
   // if(!client.emojis.cache.get(args[4])) return;
    channel.messages.fetch(args[2]).then(async(m) => {
      m.react(args[4]);
      message.channel.send(`**Done Create new ReactionRole:** [Go To Message](https://discord.com/channels/${message.guild.id}/${channel.id}/${args[2]})`);
      new reactionmodel({
        GuildID: message.guild.id,
        Channel: channel.id,
        MessageID: m.id,
        Role: args[3],
        Emoji: args[4]
      }).save().catch(console.error);
    });
  }
});


client.on('message', async(message) => {
  if(message.author.bot) return;
  if(message.content.startsWith(prefix + 'rrdel')) {
    let args = message.content.split(' ');
    if(!args[1]) return message.channel.send(`> :x: | Usage: ${prefix}rrdel \`<MessageID>\``);
    reactionmodel.findOne({
      MessageID: args[1], GuildID: message.guild.id,
    }, async(err, doc) => {
      if(err) throw err;
      if(!doc) return message.channel.send(`**Not Found reaction role**`);
      reactionmodel.findOneAndDelete(
        { MessageID: args[1], GuildID: message.guild.id },
      (err) => {
        if(err) throw err;
      });
      message.channel.send(`**Done Removed Reaction Role From this messageID**`);
    });
  }
});

client.on('raw', packet => {
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
  const channel = client.channels.cache.get(packet.d.channel_id);
  if (channel.messages.cache.has(packet.d.message_id)) return;
  channel.messages.fetch(packet.d.message_id).then(message => {
      const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
      const reaction = message.reactions.cache.get(emoji);
      if (reaction) reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));
      if (packet.t === 'MESSAGE_REACTION_ADD') {
          client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
      }
      if (packet.t === 'MESSAGE_REACTION_REMOVE') {
          client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.user_id));
      }
  });
});
client.on('messageReactionAdd', async(reaction, user) => {
  if(user.bot) return;
  let member = reaction.message.guild.members.cache.get(user.id);
  reactionmodel.findOne(
    {
      GuildID: reaction.message.guild.id,
      Emoji: reaction.emoji.toString(),
      MessageID: reaction.message.id,
    },
    async (err, data) => {
      if (err) throw err;
      if (data) {
        if (!member.roles.cache.has(data.Role)) {
          member.roles.add(data.Role);
          user.send(`*Done Added Role \`${reaction.message.guild.roles.cache.find((ro) => ro.id === data.Role).name}\`*`);
        } else {
        }
      }
    }
  );
});

client.on('messageReactionRemove', async(reaction, user) => {
  if(user.bot) return;
  let member = reaction.message.guild.members.cache.get(user.id);
  reactionmodel.findOne(
    {
      GuildID: reaction.message.guild.id,
      Emoji: reaction.emoji.toString(),
      MessageID: reaction.message.id,
    },
    async (err, data) => {
      if (err) throw err;
      if (data) {
        if (member.roles.cache.has(data.Role)) {
          member.roles.remove(data.Role);
          user.send(`*Done Removed Role \`${reaction.message.guild.roles.cache.find((ro) => ro.id === data.Role).name}\`*`)
        } else {
        }
      }
    }
  );
});

client.login("TOKEN_HEREEEEE")
