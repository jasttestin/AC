/* eslint-disable no-inline-comments */
const Discord = require('discord.js');
const client = new Discord.Client();

const moment = require('moment');

const config = require('./config');
require('./functions')(client);

const Sqlite = require('better-sqlite3');
client.db = new Sqlite('./database.sqlite');

client.on('ready', async () => {
  // check and then create a new table structures
  const table = client.db.prepare('SELECT count(*) FROM sqlite_master WHERE type = \'table\' AND name = \'limits\'').get();
  if (!table['count(*)']) client.db.prepare('CREATE TABLE limits (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, guild TEXT NOT NULL, snowflake TEXT NOT NULL, current INTEGER NOT NULL, day INTEGER DEFAULT 0)').run();

  client.db.pragma('synchronous = 1');
  client.db.pragma('journal_mode = wal');

  console.log('Bot is online.');

  function dailyCheck() {
    const row = client.db.prepare('SELECT day FROM limits LIMIT 1').get();
    if (!row) return client.db.prepare('UPDATE limits SET day = ?, current = 0').run(moment().date());
    if (client.db.prepare('SELECT day FROM limits LIMIT 1').get().day !== moment().date()) {
      client.db.prepare('UPDATE limits SET day = ?, current = 0').run(moment().date());
    }
  }
  dailyCheck();
  setInterval(() => dailyCheck(), 43286400);
});

client.on('message', async (message) => {
  if (!message.guild) return; // if the message is from a DM, don't go through
  if (message.system) return; // if the message is from discord itself, don't go through
  if (message.author.id === client.user.id) return; // if the message is this bot, don't go through
  if (!message.author) return;
  if (!message.author.id) return;


  if (message.channel.id == "707702167552786442") {
      message.channel.fetchMessages({ limit: 50 })
    .then(collected => {
        message.channel.bulkDelete(messages).catch(console.error);
        message.channel.send({
          embed: {
            description: config.rules1,
            color: 11344153,
          },
        });
      }).catch(console.error);

    console.log('deleted messages');

    return;
  }

  message.channel.fetchMessages({ limit: 50 })
    .then(collected => {
      const messages = collected.filter(msg => msg.author.id === client.user.id && msg.embeds.length === 1 ? msg.embeds[0].description === config.rules : false);
      if ((messages && messages.size <= 0) || !messages) message.channel.send({
        embed: {
          description: config.rules,
          color: 11344153,
        },
      });
      else {
        message.channel.bulkDelete(messages).catch(console.error);
        message.channel.send({
          embed: {
            description: config.rules,
            color: 11344153,
          },
        });
      }
    }).catch(console.error);


  if (!message.member) await message.guild.fetchMember(message.author); // cache the member to avoid errors later

  if (message.member.roles.some(role => config.blacklisted_roles.includes(role.name))) return;

  if (!client.checkInvite(message)) {
    message.reply('you need to send an invite and a description.').then(m => m.delete(10000).catch(() => {}));
    return message.delete();
  }

  if (config.blacklisted_channels.some(element => element === message.channel.name)) return;

  if (client.checkInvite(message) && message.cleanContent.replace(/\s/g, '').replace(/discord(?:app\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/i, '').length <= 0) {
    message.reply('you need to send an invite and a description.').then(m => m.delete(10000).catch(() => {}));
    return message.delete(); //ok
  }

  const row = client.db.prepare('SELECT id,current FROM limits WHERE snowflake = ? AND guild = ?').get(message.author.id, message.guild.id);
  if (!row) return client.db.prepare('INSERT INTO limits (snowflake, guild, current) VALUES (?, ?, 1)').run(message.author.id, message.guild.id);

  if (row.current >= config.advertisements_per_day) {
    message.reply('you cannot post anymore advertisements for today.').then(m => m.delete(10000).catch(() => {}));
    return message.delete();
  }
  client.db.prepare('UPDATE limits SET current = ? WHERE id = ?').run(row.current + 1, row.id);
});

client.login(process.env.token);

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
client.on('warn', console.error);
client.on('error', console.error);
client.on('reconnecting', console.error);
client.on('resume', console.error);