package com.blueoauld.server.domain.push.service

import com.blueoauld.server.global.push.ExpoPushClient
import com.blueoauld.server.global.push.ExpoPushMessage
import org.springframework.messaging.simp.user.SimpUserRegistry
import org.springframework.stereotype.Service

@Service
class PushService(

    private val deviceTokenService: DeviceTokenService,
    private val expoPushClient: ExpoPushClient,
    private val simpUserRegistry: SimpUserRegistry,
) {

    fun isConnected(memberId: Long) = simpUserRegistry.getUser(memberId.toString()) != null

    fun send(
        memberId: Long,
        title: String,
        body: String,
        data: Map<String, String> = emptyMap(),
        badge: Int? = null,
        channelId: String? = null,
        priority: String? = null,
    ) {
        val messages = deviceTokenService.findTokens(memberId)
            .map {
                ExpoPushMessage(
                    to = it,
                    title = title,
                    body = body,
                    data = data,
                    badge = badge,
                    channelId = channelId,
                    priority = priority,
                )
            }

        deviceTokenService.removeExpired(expoPushClient.send(messages))
    }

    fun sendAll(
        memberIds: List<Long>,
        title: String,
        body: String,
        data: Map<String, String> = emptyMap(),
        collapseKey: String? = null,
        channelId: String? = null,
        priority: String? = null,
    ) {
        if (memberIds.isEmpty()) {
            return
        }

        deviceTokenService.findTokens(memberIds)
            .map {
                ExpoPushMessage(
                    to = it,
                    title = title,
                    body = body,
                    data = data,
                    collapseId = collapseKey,
                    tag = collapseKey,
                    channelId = channelId,
                    priority = priority,
                )
            }
            .chunked(BATCH_SIZE)
            .forEach { deviceTokenService.removeExpired(expoPushClient.send(it)) }
    }

    companion object {

        private const val BATCH_SIZE = 100
    }
}
