console.log('Loading dependencies...');
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js');

console.log('Initializing client...');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID;
const CATEGORY_ID = process.env.CATEGORY_ID;
const STAFF_ROLES = process.env.STAFF_ROLES ? process.env.STAFF_ROLES.split(',') : [];

// Queue state
let activeTicketsCount = 0;
const waitingList = [];
const MAX_TICKETS = 10;

console.log('Config loaded. Logging in...');
client.once('clientReady', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(TICKET_CHANNEL_ID);
    if (!channel) return console.error('Ticket channel not found');

    const embed = new EmbedBuilder()
        .setTitle('🎟️ CTR Support System')
        .setDescription('Si necesitas asistencia técnica o reportar algo, haz clic en el botón de abajo para abrir un ticket.')
        .addFields(
            { name: '📋 Información', value: 'Nuestro equipo te atenderá lo antes posible.' },
            { name: '⏳ Estado de la Cola', value: `${activeTicketsCount}/${MAX_TICKETS} tickets activos.` }
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setColor('#5865F2')
        .setFooter({ text: 'Powered by Antigravity • CTR Bot', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Abrir Ticket')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Success),
        );

    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const existing = messages.find(m => m.embeds[0]?.title === '🎟️ CTR Support System');
        if (existing) {
            await existing.edit({ embeds: [embed], components: [row] });
        } else {
            await channel.send({ embeds: [embed], components: [row] });
        }
        console.log('Ticket system message ready.');
    } catch (error) {
        console.error('Error handling initial message:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'open_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
        if (existingChannel) {
            return interaction.reply({ content: `❌ Ya tienes un ticket abierto: ${existingChannel}`, flags: MessageFlags.Ephemeral });
        }

        if (activeTicketsCount >= MAX_TICKETS) {
            if (waitingList.includes(user.id)) {
                const pos = waitingList.indexOf(user.id) + 1;
                return interaction.reply({ content: `⏳ Ya estás en la lista de espera. Posición: **#${pos}**`, flags: MessageFlags.Ephemeral });
            }
            waitingList.push(user.id);
            return interaction.reply({ content: `⚠️ El sistema está lleno (${MAX_TICKETS}/10). Has sido añadido a la **lista de espera**. Te notificaremos cuando se libere un espacio.`, flags: MessageFlags.Ephemeral });
        }

        await createTicket(guild, user, interaction);
    }

    if (interaction.customId === 'close_ticket') {
        const member = interaction.member;
        const hasStaffRole = STAFF_ROLES.some(roleId => member.roles.cache.has(roleId));

        if (!hasStaffRole) {
            return interaction.reply({ content: '❌ Solo el **Staff** puede cerrar este ticket.', flags: MessageFlags.Ephemeral });
        }

        const deleteEmbed = new EmbedBuilder()
            .setTitle('🔒 Cerrando Ticket')
            .setDescription('El canal se eliminará permanentemente en **5 segundos**.')
            .setColor('#ED4245')
            .setTimestamp();

        await interaction.reply({ embeds: [deleteEmbed] });

        setTimeout(async () => {
            try {
                await interaction.channel.delete();
                activeTicketsCount--;
                
                // Process waiting list
                if (waitingList.length > 0) {
                    const nextUserId = waitingList.shift();
                    const nextUser = await client.users.fetch(nextUserId);
                    const guild = interaction.guild;
                    
                    // We can't use interaction.reply here since it's a new context
                    // But we can create the channel and DM the user or just create it.
                    await createTicket(guild, nextUser);
                }
            } catch (error) {
                console.error('Error during ticket closure:', error);
            }
        }, 5000);
    }
});

async function createTicket(guild, user, interaction = null) {
    const channelName = `ticket-${user.username.toLowerCase()}`;
    
    try {
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: CATEGORY_ID,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                },
                ...STAFF_ROLES.map(roleId => ({
                    id: roleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                })),
            ],
        });

        activeTicketsCount++;

        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🎫 Nuevo Ticket Abierto')
            .setDescription(`Hola ${user}, bienvenido a soporte. Por favor, detalla tu consulta y un administrador te atenderá pronto.`)
            .addFields(
                { name: '👤 Usuario', value: `<@${user.id}>`, inline: true },
                { name: '🛠️ Staff', value: 'Los moderadores han sido notificados.', inline: true }
            )
            .setColor('#2ECC71')
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: 'Seguridad CTR' })
            .setTimestamp();

        const closeRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Finalizar Ticket')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger),
            );

        await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeRow] });

        if (interaction) {
            await interaction.reply({ content: `⭐ | Tu ticket ha sido creado correctamente: ${ticketChannel}`, flags: MessageFlags.Ephemeral });
        } else {
            // If from waitlist, try to notify user via DM
            try {
                await user.send(`✅ ¡Espacio liberado! Tu ticket en **${guild.name}** ha sido creado: ${ticketChannel}`);
            } catch (e) {
                console.log(`Could not DM user ${user.id}`);
            }
        }
    } catch (error) {
        console.error('Error creating ticket channel:', error);
        if (interaction) {
            await interaction.reply({ content: '❌ Error crítico al crear el canal.', flags: MessageFlags.Ephemeral });
        }
    }
}

client.login(process.env.DISCORD_TOKEN);
