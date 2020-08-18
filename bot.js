const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const querystring = require('querystring');
const prefix = '!';



client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content === 'ping') {
       message.reply('pong');
    }
});

client.on('message', async message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

    if (command === 'urban') {
        if (!args.length) {
          return message.channel.send('You need to supply a search term!');
        }
      
          const query = querystring.stringify({ term: args.join(' ') });
      
        const { list } = await fetch(`https://api.urbandictionary.com/v0/define?${query}`).then(response => response.json());
      }

});

// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret