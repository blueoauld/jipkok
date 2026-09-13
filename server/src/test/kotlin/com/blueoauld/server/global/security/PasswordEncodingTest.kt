package com.blueoauld.server.global.security

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

class PasswordEncodingTest {

    @Test
    fun `72바이트를 넘는 비밀번호는 요청 오류로 거절한다`() {
        // given
        val password = "가".repeat(25)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            checkPasswordBytes(password)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REQUEST)
    }

    @Test
    fun `72바이트까지 받은 비밀번호는 BCrypt로 암호화할 수 있다`() {
        // given
        val password = "가".repeat(24)
        val passwordEncoder = BCryptPasswordEncoder()

        // when
        checkPasswordBytes(password)
        val encoded = passwordEncoder.encodePassword(password)

        // then
        assertThat(passwordEncoder.matches(password, encoded)).isTrue()
    }
}
