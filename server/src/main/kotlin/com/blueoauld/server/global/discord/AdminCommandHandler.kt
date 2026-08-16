package com.blueoauld.server.global.discord

import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent

interface AdminCommandHandler {

    fun supports(name: String): Boolean

    fun handle(event: SlashCommandInteractionEvent): AdminReply
}
