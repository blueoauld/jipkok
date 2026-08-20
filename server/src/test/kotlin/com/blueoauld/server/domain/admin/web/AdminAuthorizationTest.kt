package com.blueoauld.server.domain.admin.web

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.global.security.JwtProvider
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@AutoConfigureMockMvc
class AdminAuthorizationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var jwtProvider: JwtProvider

    @Test
    fun `토큰이 없으면 어드민 API가 401을 준다`() {
        // given

        // when
        val result = mockMvc.perform(get(SUMMARY_PATH))

        // then
        result.andExpect(status().isUnauthorized)
    }

    @Test
    fun `일반 회원 토큰으로는 어드민 API가 403을 준다`() {
        // given
        val token = jwtProvider.createAccessToken(MEMBER_ID, MemberRole.MEMBER.name)

        // when
        val result = mockMvc.perform(get(SUMMARY_PATH).header("Authorization", "Bearer $token"))

        // then
        result.andExpect(status().isForbidden)
    }

    @Test
    fun `관리자 토큰으로는 어드민 API가 열린다`() {
        // given
        val token = jwtProvider.createAccessToken(MEMBER_ID, MemberRole.ADMIN.name)

        // when
        val result = mockMvc.perform(get(SUMMARY_PATH).header("Authorization", "Bearer $token"))

        // then
        result.andExpect(status().isOk)
    }

    companion object {

        private const val MEMBER_ID = 7L
        private const val SUMMARY_PATH = "/api/admin/dashboard/summary"
    }
}
