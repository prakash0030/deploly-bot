import { REST, Routes } from "discord.js";
import fs from "fs";
import "dotenv/config";

// Load all commands from /commands folder
const commands = [];
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const cmd = await import(`./commands/${file}`);
    commands.push(cmd.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log("🚀 Registering slash commands...");

        // GUILD COMMANDS = INSTANT UPDATE
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID, // Bot ID
                process.env.GUILD_ID   // Server ID
            ),
            { body: commands }
        );

        console.log("✅ Slash commands registered instantly!");
    } catch (err) {
        console.error("❌ Failed to register commands:");
        console.error(err);
    }
})();
