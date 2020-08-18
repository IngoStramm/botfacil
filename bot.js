const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');


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

    fetch('https://aws.random.cat/meow').then(response => response.json());
    
    if (command === 'cat') {
        const { file } = await fetch('https://aws.random.cat/meow').then(response => response.json());
    
        message.channel.send(file);
    }

});

// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret