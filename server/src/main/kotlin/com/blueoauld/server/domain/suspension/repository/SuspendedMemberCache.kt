package com.blueoauld.server.domain.suspension.repository

import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration

@Repository
class SuspendedMemberCache(

    private val stringRedisTemplate: StringRedisTemplate,
) {

    fun find(memberId: Long, type: SuspensionType): Boolean? =
        stringRedisTemplate.opsForValue()[toKey(memberId, type)]?.toBooleanStrictOrNull()

    fun save(memberId: Long, type: SuspensionType, suspended: Boolean, ttl: Duration) {
        stringRedisTemplate.opsForValue().set(toKey(memberId, type), suspended.toString(), ttl)
    }

    fun evict(memberId: Long) {
        stringRedisTemplate.delete(SuspensionType.entries.map { toKey(memberId, it) })
    }

    private fun toKey(memberId: Long, type: SuspensionType) = "$KEY_PREFIX$memberId:$type"

    companion object {

        val TTL: Duration = Duration.ofMinutes(10)
        val MIN_TTL: Duration = Duration.ofSeconds(1)

        private const val KEY_PREFIX = "suspension:"
    }
}
