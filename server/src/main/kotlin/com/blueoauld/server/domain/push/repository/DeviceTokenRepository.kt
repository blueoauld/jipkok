package com.blueoauld.server.domain.push.repository

import com.blueoauld.server.domain.push.entity.DeviceToken
import org.springframework.data.jpa.repository.JpaRepository

interface DeviceTokenRepository : JpaRepository<DeviceToken, Long> {

    fun findByToken(token: String): DeviceToken?

    fun findAllByMemberId(memberId: Long): List<DeviceToken>

    fun deleteByToken(token: String)

    fun deleteAllByTokenIn(tokens: List<String>)
}
