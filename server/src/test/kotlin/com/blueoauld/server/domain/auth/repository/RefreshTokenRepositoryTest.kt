package com.blueoauld.server.domain.auth.repository

import com.blueoauld.server.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class RefreshTokenRepositoryTest {

    @Autowired
    private lateinit var refreshTokenRepository: RefreshTokenRepository

    @AfterEach
    fun tearDown() {
        refreshTokenRepository.delete(MEMBER_ID)
    }

    @Test
    fun `저장된 토큰과 같으면 지운다`() {
        // given
        refreshTokenRepository.save(MEMBER_ID, CURRENT_TOKEN)

        // when
        refreshTokenRepository.deleteIfMatches(MEMBER_ID, CURRENT_TOKEN)

        // then
        assertThat(refreshTokenRepository.findToken(MEMBER_ID)).isNull()
    }

    @Test
    fun `다른 기기 로그인으로 바뀐 옛 토큰이면 지우지 않는다`() {
        // given
        refreshTokenRepository.save(MEMBER_ID, CURRENT_TOKEN)

        // when
        refreshTokenRepository.deleteIfMatches(MEMBER_ID, OLD_TOKEN)

        // then
        assertThat(refreshTokenRepository.findToken(MEMBER_ID)).isEqualTo(CURRENT_TOKEN)
    }

    companion object {

        private const val MEMBER_ID = 987_800L
        private const val CURRENT_TOKEN = "current-refresh-token"
        private const val OLD_TOKEN = "old-refresh-token"
    }
}
