import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import fetch from "node-fetch";

// Create client
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Bot is ready
client.once(Events.ClientReady, (c) => {
    console.log(`🤖 Logged in as ${c.user.tag}`);
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    console.log("🔥 Interaction received:", interaction.commandName);

    if (interaction.commandName !== "deploy") return;

    try {
        // reply instantly to avoid "Application did not respond"
        await interaction.reply("⏳ Deploying your server...");

        const ram = interaction.options.getString("ram").replace("gb", "") * 1024;
        const disk = interaction.options.getString("disk").replace("gb", "") * 1024;
        const version = interaction.options.getString("version");
        const owner = interaction.options.getUser("owner");

        console.log("📌 Parsed options:", { ram, disk, version, owner });

        // 1️⃣ CREATE USER
        console.log("📡 Sending request to create user...");

        const userResponse = await fetch(`${process.env.PTERO_PANEL_URL}/api/application/users`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: `${owner.id}@example.com`,
                username: owner.username,
                first_name: owner.username,
                last_name: "Client",
                password: Math.random().toString(36).slice(2)
            })
        });

        const userData = await userResponse.json();
        console.log("📥 User API response:", userData);

        if (!userResponse.ok) {
            return interaction.editReply("❌ Failed to create user. Check your Pterodactyl API key or permissions.");
        }

        const userId = userData.attributes.id;
        const password = userData.attributes.password;

        // 2️⃣ CREATE SERVER
        console.log("📡 Sending request to create server...");

        const serverResponse = await fetch(`${process.env.PTERO_PANEL_URL}/api/application/servers`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.PTERO_API_KEY}`,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: `MC-${owner.username}`,
                user: userId,
                egg: parseInt(process.env.EGG_ID),
                docker_image: "ghcr.io/pterodactyl/yolks:java_17",
                limits: {
                    memory: ram,
                    swap: 0,
                    disk: disk,
                    io: 500,
                    cpu: 0
                },
                feature_limits: {
                    databases: 1,
                    backups: 1
                },
                startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar",
                environment: {
                    SERVER_JARFILE: "server.jar",
                    MINECRAFT_VERSION: version
                },
                allocation: {
                    default: parseInt(process.env.ALLOC_ID)
                }
            })
        });

        const serverData = await serverResponse.json();
        console.log("📥 Server API response:", serverData);

        if (!serverResponse.ok) {
            return interaction.editReply("❌ Failed to create server. Check node ID, allocation, egg, etc.");
        }

        // 3️⃣ SEND DM TO USER
        await owner.send(`
🎉 **Your Server is Ready!**

🔗 Panel: ${process.env.PTERO_PANEL_URL}
👤 Username: ${userData.attributes.email}
🔑 Password: ${password}

🖥 Server ID: ${serverData.attributes.id}

Enjoy your server!
        `);

        // Edit original reply
        await interaction.editReply(`✅ Server deployed successfully and DM sent to **${owner.username}**`);

    } catch (err) {
        console.error("❌ ERROR IN DEPLOY COMMAND:", err);
        try {
            await interaction.editReply("❌ Something went wrong. Check console logs.");
        } catch {
            console.log("Reply edit failed.");
        }
    }
});

// Login bot
client.login(process.env.BOT_TOKEN);
