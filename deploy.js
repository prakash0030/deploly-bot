import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("deploy")
        .setDescription("Deploy a Minecraft server for a user.")
        .addStringOption(opt =>
            opt.setName("ram").setDescription("RAM in GB (ex: 4gb)").setRequired(true))
        .addStringOption(opt =>
            opt.setName("disk").setDescription("Disk space (ex: 10gb)").setRequired(true))
        .addStringOption(opt =>
            opt.setName("version").setDescription("Version (ex: paper)").setRequired(true))
        .addUserOption(opt =>
            opt.setName("owner").setDescription("User to deploy for").setRequired(true)),
};
