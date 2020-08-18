const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const querystring = require('querystring');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const WooCommerce = new WooCommerceRestApi({
    url: 'https://convertefacil.com.br', // Your store URL
    consumerKey: 'ck_3b7e6ae8f899f6c87e1e32c76a1268c660686f90', // Your consumer key
    consumerSecret: 'cs_8e879c2c4f70fccc11c42f65e386273f99af48ee', // Your consumer secret
    version: 'wc/v3' // WooCommerce WP REST API version
});
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

    // const args = message.content.slice(prefix.length).trim().split(/ +/);
    // const command = args.shift().toLowerCase();
    let args = message.content.substring(prefix.length).split(' ');

    switch (args[0]) {
        case 'urban':
            if (!args.length) {
                return message.channel.send('You need to supply a search term!');
            }

            const query = querystring.stringify({ term: args.join(' ') });

            const { list } = await fetch(`https://api.urbandictionary.com/v0/define?${query}`).then(response => response.json());

            if (!list.length) {
                return message.channel.send(`No results found for **${args.join(' ')}**.`);
            }

            message.channel.send(list[0].definition);
            break;
        case 'pedido':
            // console.log(args.length);

            if (args.length < 2) {
                return message.reply(`insira o **número do pedido** e o **número do status** a ser atualizado. Por exemplo: \`!pedido 0001 1\`.`);
            } else if (args.length < 3) {
                return message.reply(`é necessário inserir os dois valores: **número do pedido** e **número do status**. Por exemplo: \`!pedido 0001 1\`.`);
            }

            // for (i = 0; i < args.length; i++) {
            //     console.log(args[i]);
            // }
            let etapa_id;
            let etapa_value;

            WooCommerce.get(`orders/${args[1]}`)
                .then((response) => {
                    let metas = response.data.meta_data;
                    for (i = 0; i < metas.length; i++) {
                        if (metas[i].key === 'etapa_em_andamento') {
                            etapa_id = metas[i].id;
                            etapa_value = metas[i].value;
                        }
                    }
                    if (!etapa_id) {
                        return message.reply('ocorreu um erro(1.1) ao se conectar com a Loja do Converte Fácil.');
                    }

                    if (!etapa_value) etapa_value = '0';

                })
                .catch((error) => {
                    console.log(error.response.data);
                    return message.reply('ocorreu um erro(1) ao se conectar com a Loja do Converte Fácil.');
                });

            const data = {
                meta_data: [
                    { id: etapa_id, key: 'etapa_em_andamento', value: `${args[2]}` }
                    // { etapa_em_andamento: `${args[2]}` }
                ]
            };

            WooCommerce.put(`orders/${args[1]}`, data)
                .then((response) => {
                    console.log(`ID etapas: ${etapa_id}`);
                    console.log(response.data);
                    message.reply(`status do **pedido #${args[1]}** atualizado de \`${etapa_value}\` para \`${args[2]}\`.`);
                })
                .catch((error) => {
                    console.log(error.response.data);
                    return message.reply('ocorreu um erro(2) ao atualizar o status do pedido da Loja do Converte Fácil.');
                });
            break;
    }

});

// THIS  MUST  BE  THIS  WAY
client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret