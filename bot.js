const Discord = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
var slugify = require('slugify');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const client = new Discord.Client();
client.order = require('./wc-order.json');
const WooCommerce = new WooCommerceRestApi({
    url: process.env.WC_URL, // Your store URL
    consumerKey: process.env.WC_CONSUMER_KEY, // Your consumer key
    consumerSecret: process.env.WC_CONSUMER_SECRET, // Your consumer secret
    version: 'wc/v3' // WooCommerce WP REST API version
});
const prefix = '!';

let orders_loop;
let orders_loop_status = 'não iniciado';
let num_loop = 0;

client.on('ready', () => {

    console.log('I am ready!');
    const verifica_wc_orders = setInterval(() => {

    }, 15000);

});

client.on('message', async message => {

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const channel_atualizar_projetos = message.guild.channels.cache.find(channel => channel.name === 'atualizar-projetos');

    let args = message.content.substring(prefix.length).split(' ');
    let channel_name = message.channel.name;

    switch (args[0]) {

        case 'help':
        case 'h':
        case 'comando':
        case 'comandos':
        case 'command':
        case 'commands':
        case 'c':
            const embedCommands = new Discord.MessageEmbed()
                .setTitle('Comandos disponíveis')
                .addField(
                    `\`!help\`, \`!h\`, \`!comando\`, \`!comandos\`, \`!command\`, \`!commands\` ou \`!c\``,
                    `Exibe as opções do **Bot Fácil**`
                )
                .addField(
                    `\`!etapa\` ou \`etapas\``,
                    `Exibe a lista com os números das etapas dos pedidos. Usado para atualizar os pedidos através do comando \`!aztualizar\``
                )
                .addField(
                    `\`!atualizar\``,
                    `Atualiza a etapa de um pedido. Este comando necessita de dois valores adicionais: o *número do pedido* e o *número da etapa*. Digite \`!etapa\` para mais informações. \n**Importante**: este comando só funciona no canal <#${channel_atualizar_projetos.id}>`
                )
                .addField(
                    `\`!vigiar\``,
                    `Comando para iniciar e pausar o processo de vigiar os pedidos do site do *Converte Fácil*. Este comando necessita de um valor adicional. \nEstas são as opções: \`!vigiar start\`, para **iniciar**, \`!vigiar end\`, para **finalizar**, e \`!vigiar status\`, para **verificar o status atual** do comando. \n **Atenção**: este comando só está disponível para usuários com privilégios de *administrador*`
                )
                .setColor(0x523f6d);
            message.channel.send(embedCommands);
            break;

        case 'etapa':
        case 'etapas':

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
        \`!atualizar 154 3\`
        **Importante**: este comando só funciona no canal <#${channel_atualizar_projetos.id}>`);
            break;

        case 'atualizar':

            if (channel_name !== 'atualizar-projetos') return message.reply(`este comando só funciona no canal <#${channel_atualizar_projetos.id}>`);

            if (args.length < 2) {
                return message.reply(`insira o **número do pedido** e o **número da etapa** a ser atualizada. Por exemplo: \`!atualizar 0001 1\`. Utilize o comando \`!etapa\` para consultar os números das etapas.`);
            } else if (args.length < 3) {
                return message.reply(`é necessário inserir os dois valores: **número do pedido** e **número da etapa**. Por exemplo: \`!atualizar 0001 1\`. Utilize o comando \`!etapa\` para consultar os números das etapas.`);
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

        case 'vigiar':

            if (!message.member.hasPermission("Administrator")) return message.reply('Apenas usuários com privilégio de "*Administrador*" podem utilizar este recurso.');


            const str_vigiar_opcoes = `As opções disponíveis, são: \`!vigiar start\`, para **iniciar**, \`!vigiar end\`, para **finalizar**, e \`!vigiar status\`, para **verificar o status atual** do comando.`;

            if (args.length < 2) {
                return message.reply(`o comando \`!vigiar\` necessita de um **segundo atributo**. ${str_vigiar_opcoes}`);
            }

            const channel_novos_pedidos = client.channels.cache.find(channel => channel.name === 'novos-pedidos');

            if (args[1] === 'status') {

                return message.channel.send(`O status atual do comando \`!vigiar\` é "**${orders_loop_status}**".`);

            } else if (args[1] === 'end') {

                clearInterval(orders_loop);
                orders_loop_status = 'pausado';
                console.log('Total de loops executados: ' + num_loop);
                return message.reply('*Bot Fácil* **parou** de vigiar os pedidos do Converte Fácil.');

            } else if (args[1] === 'start') {

                message.reply('*Bot Fácil* **começou** a vigiar os pedidos do Converte Fácil.');

                orders_loop_status = 'executando';

                orders_loop = setInterval(() => {

                    console.log('loop #' + num_loop);

                    WooCommerce.get("orders")
                        .then((response) => {

                            let wc_last_order_id = response.data[0].id;

                            if (!client.order['last_order'] || parseInt(wc_last_order_id) > parseInt(client.order['last_order'].id)) {

                                console.log('wc_last_order_id: ' + wc_last_order_id);

                                client.order['last_order'] = {
                                    id: wc_last_order_id,
                                    date: response.data[0].date_created,
                                    cliente: `${response.data[0].billing.first_name} ${response.data[0].billing.last_name}`
                                }

                                console.log(`parseInt(client.order['last_order'].id: ${parseInt(client.order['last_order'].id)}`);

                                fs.writeFile('./wc-order.json', JSON.stringify(client.order, null, 4), err => {

                                    if (err) throw err;

                                    let last_order_id = client.order['last_order'].id;
                                    let last_order_cliente = client.order['last_order'].cliente;

                                    channel_novos_pedidos
                                        .send('Compra realizada no site  :partying_face: \n>>> Cliente: `' + last_order_cliente + '`\nCódigo Compra: `' + last_order_id + '`');

                                    let server = message.guild;
                                    let new_channel_name = slugify(last_order_cliente + ' ' + last_order_id, {
                                        replacement: '-', remove: '/[*+~.()\'"!:@àáäâèéëêìíïîòóöôùúüûñç·/_,:;]/g', lower: true, strict: true, locale: 'en'
                                    });

                                    console.log(`Nome slugficiado: ${new_channel_name}`);

                                    let atendimentoCF = server.roles.cache.find(role => role.name === "AtendimentoCF");
                                    const msg_atendimento = 'Olá <@&' + atendimentoCF.id + '>\nEntrar em contato em até 3 horas úteis para:\n>>> se apresentar ao cliente;\nagendar coleta de briefing;\nreforçar pedido de preenchimento do pré-briefing e envio de materiais.';

                                    if (channel_cliente = client.channels.cache.find(channel => channel.name === new_channel_name)) {
                                        return channel_cliente.send(msg_atendimento);
                                    } else {
                                        server.channels.create(new_channel_name)
                                            .then(channel => {
                                                let category = server.channels.cache.find(c => c.name == "📒 PROJETOS CF" && c.type == "category");

                                                if (!category) throw new Error("Category channel does not exist");
                                                channel.setParent(category.id);


                                                return channel
                                                    .send(msg_atendimento);
                                            })
                                            .catch(console.error);
                                    }

                                });
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                        });

                    num_loop++;

                }, 300000);

            }
            break;
    }

});

client.login(process.env.BOT_TOKEN);