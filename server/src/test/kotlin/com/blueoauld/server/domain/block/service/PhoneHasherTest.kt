package com.blueoauld.server.domain.block.service

import com.blueoauld.server.global.properties.ContactBlockProperties
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class PhoneHasherTest {

    private val phoneHasher = PhoneHasher(ContactBlockProperties("secret"))

    @Test
    fun `같은 번호는 같은 해시가 된다`() {
        // when
        val first = phoneHasher.hash(PHONE_NUMBER)
        val second = phoneHasher.hash(PHONE_NUMBER)

        // then
        assertThat(first).isEqualTo(second)
        assertThat(first).hasSize(PhoneHasher.HASH_LENGTH)
    }

    @Test
    fun `번호가 다르면 해시도 다르다`() {
        // when
        val hash = phoneHasher.hash(PHONE_NUMBER)
        val other = phoneHasher.hash("+821012345679")

        // then
        assertThat(hash).isNotEqualTo(other)
    }

    @Test
    fun `비밀키가 다르면 같은 번호도 다른 해시가 된다`() {
        // given
        val otherHasher = PhoneHasher(ContactBlockProperties("other-secret"))

        // when
        val hash = phoneHasher.hash(PHONE_NUMBER)
        val other = otherHasher.hash(PHONE_NUMBER)

        // then
        assertThat(hash).isNotEqualTo(other)
    }

    companion object {

        private const val PHONE_NUMBER = "+821012345678"
    }
}
