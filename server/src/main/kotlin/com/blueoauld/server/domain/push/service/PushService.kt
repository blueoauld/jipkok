package com.blueoauld.server.domain.push.service

import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import com.blueoauld.server.global.push.ExpoPushClient
import com.blueoauld.server.global.push.ExpoPushMessage
import org.springframework.messaging.simp.user.SimpUserRegistry
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PushService(

    private val deviceTokenRepository: DeviceTokenRepository,
    private val expoPushClient: ExpoPushClient,
    private val simpUserRegistry: SimpUserRegistry,
) {

    fun isConnected(memberId: Long) = simpUserRegistry.getUser(memberId.toString()) != null

    @Transactional
    fun send(
        memberId: Long,
        title: String,
        body: String,
        data: Map<String, String> = emptyMap(),
        badge: Int? = null,
        channelId: String? = null,
        priority: String? = null,
    ) {
        val messages = deviceTokenRepository.findAllByMemberId(memberId)
            .map {
                ExpoPushMessage(
                    to = it.token,
                    title = title,
                    body = body,
                    data = data,
                    badge = badge,
                    channelId = channelId,
                    priority = priority,
                )
            }

        removeExpired(expoPushClient.send(messages))
    }

    @Transactional
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

        deviceTokenRepository.findAllByMemberIdIn(memberIds)
            .map {
                ExpoPushMessage(
                    to = it.token,
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
            .forEach { removeExpired(expoPushClient.send(it)) }
    }

    private fun removeExpired(tokens: List<String>) {
        if (tokens.isNotEmpty()) {
            deviceTokenRepository.deleteAllByTokenIn(tokens)
        }
    }

    companion object {

        private const val BATCH_SIZE = 100
    }
}
