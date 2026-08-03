package com.blueoauld.server.global.exception

import com.blueoauld.server.global.security.JwtProvider
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest(properties = ["spring.jpa.hibernate.ddl-auto=none"])
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var jwtProvider: JwtProvider

    @Test
    fun `필수 필드가 없으면 잘못된 요청으로 준다`() {
        // when
        val result = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"phoneNumber":"01011112222"}"""),
        )

        // then
        result.andExpect(status().isBadRequest)
        result.andExpect(jsonPath("$.code").value(ErrorCode.INVALID_REQUEST.code))
    }

    @Test
    fun `본문이 깨졌으면 잘못된 요청으로 준다`() {
        // when
        val result = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{깨진"),
        )

        // then
        result.andExpect(status().isBadRequest)
        result.andExpect(jsonPath("$.code").value(ErrorCode.INVALID_REQUEST.code))
    }

    @Test
    fun `경로 변수 타입이 맞지 않으면 잘못된 요청으로 준다`() {
        // given
        val accessToken = jwtProvider.createAccessToken(MEMBER_ID, "MEMBER")

        // when
        val result = mockMvc.perform(
            get("/api/members/숫자아님").header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken"),
        )

        // then
        result.andExpect(status().isBadRequest)
        result.andExpect(jsonPath("$.code").value(ErrorCode.INVALID_REQUEST.code))
    }

    @Test
    fun `허용하지 않는 메서드면 405로 준다`() {
        // given
        val accessToken = jwtProvider.createAccessToken(MEMBER_ID, "MEMBER")

        // when
        val result = mockMvc.perform(
            put("/api/members/me/heartbeat").header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken"),
        )

        // then
        result.andExpect(status().isMethodNotAllowed)
        result.andExpect(jsonPath("$.code").value(ErrorCode.INVALID_REQUEST.code))
    }

    companion object {

        private const val MEMBER_ID = 42L
    }
}
