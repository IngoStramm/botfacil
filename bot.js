const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const querystring = require('querystring');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const WooCommerce = new WooCommerceRestApi({
    url: process.env.WC_URL, // Your store URL
    consumerKey: process.env.WC_CONSUMER_KEY, // Your consumer key
    consumerSecret: process.env.WC_CONSUMER_SECRET, // Your consumer secret
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

    let args = message.content.substring(prefix.length).split(' ');

    switch (args[0]) {
        case 'etapa':
            const embed = new Discord.MessageEmbed()
                .setTitle('Etapas **EM ANDAMENTO**')
                .addField(
                    `Os números referem-se recpectivamente às seguintes etapas:`,
                    `0 = Não Iniciado (Padrão)
                    1 = Briefing
                    2 = Sitemap
                    3 = Página Inicial
                    4 = Site Completo
                    5 = Publicação CF
                    6 = Treinamento
                    7 = Suporte
                    8 = Feedback
                    9 = Etapas Concluídas`
                )
                .setColor(0x523f6d);
            message.channel.send(embed);
            message.channel.send(`>>> :exclamation: **Exemplo de como atualizar um pedido**
        Para atualizar um pedido com o código "**154**" e com a etapa "**3**", use o comando: 
        \`!pedido 154 3\``);
            break;
        case 'pedido':

            if (args.length < 2) {
                return message.reply(`insira o **número do pedido** e o **número da etapa** a ser atualizada. Por exemplo: \`!pedido 0001 1\`.`);
            } else if (args.length < 3) {
                return message.reply(`é necessário inserir os dois valores: **número do pedido** e **número da etapa**. Por exemplo: \`!pedido 0001 1\`.`);
            }

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
                        return message.reply('ocorreu um erro(1) ao se conectar com a Loja do Converte Fácil.');
                    }

                    if (!etapa_value) etapa_value = '0';

                })
                .catch((error) => {
                    console.log(error.response.data);
                    return message.reply('ocorreu um erro(2) ao se conectar com a Loja do Converte Fácil.');
                });

            const data = {
                meta_data: [
                    { id: etapa_id, key: 'etapa_em_andamento', value: `${args[2]}` }
                ]
            };

            WooCommerce.put(`orders/${args[1]}`, data)
                .then((response) => {
                    console.log(`ID etapas: ${etapa_id}`);
                    console.log(response.data);
                    message.reply(`etapa do **pedido #${args[1]}** alterada de \`${etapa_value}\` para \`${args[2]}\`.`);
                })
                .catch((error) => {
                    console.log(error.response.data);
                    return message.reply('ocorreu um erro(3) ao atualizar a etapa do pedido da Loja do Converte Fácil.');
                });
            break;
    }

});

client.login(process.env.BOT_TOKEN);