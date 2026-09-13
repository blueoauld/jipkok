package com.blueoauld.server.global.exception

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.global.security.JwtProvider
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.orm.ObjectOptimisticLockingFailureException
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@Import(TestcontainersConfiguration::class)
@SpringBootTest
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
                .content("""{"phoneNumber":"+821011112222"}"""),
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

    @Test
    fun `동시 요청이 유니크 제약에 걸리면 중복 요청으로 준다`() {
        // given
        val exception = DataIntegrityViolationException("duplicate key value violates unique constraint")

        // when
        val response = GlobalExceptionHandler().handleDataIntegrityViolation(exception)

        // then
        assertThat(response.statusCode).isEqualTo(HttpStatus.CONFLICT)
        assertThat(response.body?.code).isEqualTo(ErrorCode.DUPLICATE_REQUEST.code)
    }

    @Test
    fun `다른 요청이 먼저 지운 행을 지우려 하면 중복 요청으로 준다`() {
        // given
        val exception = ObjectOptimisticLockingFailureException(Any::class.java, 1L)

        // when
        val response = GlobalExceptionHandler().handleOptimisticLockingFailure(exception)

        // then
        assertThat(response.statusCode).isEqualTo(HttpStatus.CONFLICT)
        assertThat(response.body?.code).isEqualTo(ErrorCode.DUPLICATE_REQUEST.code)
    }

    companion object {

        private const val MEMBER_ID = 42L
    }
}
