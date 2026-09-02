package com.blueoauld.server.domain.push.dto

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ExpoPushMessage(

    val to: String,
    val title: String,
    val body: String,
    val data: Map<String, String> = emptyMap(),
    val collapseId: String? = null,
    val tag: String? = null,
    val badge: Int? = null,
    val channelId: String? = null,
    val priority: String? = null,
    val sound: String = SOUND,
) {

    companion object {

        private const val SOUND = "default"
    }
}
