package com.blueoauld.server.domain.auth.repository

import com.blueoauld.server.global.repository.increaseWithWindow
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration

data class LoginAttemptCount(

    val phoneNumber: Long,
    val ipAddress: Long,
)

@Repository
class LoginAttemptCache(

    private val stringRedisTemplate: StringRedisTemplate,
) {

    fun find(phoneNumber: String, ipAddress: String) = LoginAttemptCount(
        phoneNumber = count(phoneNumberKey(phoneNumber)),
        ipAddress = count(ipAddressKey(ipAddress)),
    )

    fun increase(phoneNumber: String, ipAddress: String) {
        stringRedisTemplate.increaseWithWindow(phoneNumberKey(phoneNumber), WINDOW)
        stringRedisTemplate.increaseWithWindow(ipAddressKey(ipAddress), WINDOW)
    }

    fun clear(phoneNumber: String) {
        stringRedisTemplate.delete(phoneNumberKey(phoneNumber))
    }

    private fun count(key: String) = stringRedisTemplate.opsForValue()[key]?.toLongOrNull() ?: 0

    private fun phoneNumberKey(phoneNumber: String) = PHONE_NUMBER_KEY_PREFIX + phoneNumber

    private fun ipAddressKey(ipAddress: String) = IP_ADDRESS_KEY_PREFIX + ipAddress

    companion object {

        val WINDOW: Duration = Duration.ofMinutes(10)

        private const val PHONE_NUMBER_KEY_PREFIX = "login:phone:"
        private const val IP_ADDRESS_KEY_PREFIX = "login:ip:"
    }
}
