package com.blueoauld.server.domain.member.web

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.service.MemberService
import com.blueoauld.server.domain.member.service.MemberWithdrawService
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.JwtProvider
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doThrow
import org.mockito.Mockito.verify
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.ObjectMapper

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@AutoConfigureMockMvc
class MemberControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var jwtProvider: JwtProvider

    @MockitoBean
    private lateinit var memberService: MemberService

    @MockitoBean
    private lateinit var memberWithdrawService: MemberWithdrawService

    @MockitoBean
    private lateinit var memberSuspensionService: MemberSuspensionService

    @Test
    fun `토큰의 회원 id로 프로필 설정을 호출한다`() {
        // given
        val accessToken = jwtProvider.createAccessToken(MEMBER_ID, "MEMBER")
        val request = SetupProfileRequest("닉네임", 1998, "자기소개")

        // when
        val result = mockMvc.perform(
            patch("/api/members/me/profile")
                .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)),
        )

        // then
        result.andExpect(status().isNoContent)
        verify(memberService).setupProfile(MEMBER_ID, request)
    }

    @Test
    fun `토큰이 없으면 인증 오류를 준다`() {
        // given
        val request = SetupProfileRequest("닉네임", 1998)

        // when
        val result = mockMvc.perform(
            patch("/api/members/me/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)),
        )

        // then
        result.andExpect(status().isUnauthorized)
        result.andExpect(jsonPath("$.code").value("AUTH_010"))
    }

    @Test
    fun `닉네임이 열 자를 넘으면 검증 오류를 준다`() {
        // given
        val accessToken = jwtProvider.createAccessToken(MEMBER_ID, "MEMBER")
        val request = SetupProfileRequest("가".repeat(11), 1998)

        // when
        val result = mockMvc.perform(
            patch("/api/members/me/profile")
                .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)),
        )

        // then
        result.andExpect(status().isBadRequest)
        result.andExpect(jsonPath("$.code").value("COMMON_001"))
    }

    @Test
    fun `서비스 정지 중이어도 탈퇴할 수 있다`() {
        // given
        val accessToken = jwtProvider.createAccessToken(MEMBER_ID, "MEMBER")
        doThrow(BusinessException(ErrorCode.SERVICE_SUSPENDED))
            .`when`(memberSuspensionService).check(MEMBER_ID, SuspensionType.SERVICE)

        // when
        val result = mockMvc.perform(
            delete("/api/members/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken"),
        )

        // then
        result.andExpect(status().isNoContent)
        verify(memberWithdrawService).withdraw(MEMBER_ID)
    }

    companion object {

        private const val MEMBER_ID = 42L
    }
}
