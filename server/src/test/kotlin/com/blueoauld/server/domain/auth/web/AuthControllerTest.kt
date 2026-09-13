package com.blueoauld.server.domain.auth.web

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.auth.dto.request.LoginRequest
import com.blueoauld.server.domain.auth.service.AuthService
import com.blueoauld.server.global.exception.ErrorCode
import org.junit.jupiter.api.Test
import org.mockito.Mockito.verifyNoInteractions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.ObjectMapper

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockitoBean
    private lateinit var authService: AuthService

    @Test
    fun `휴대폰 번호 형식이 아니면 로그인을 시도하지 않고 거절한다`() {
        // given
        val request = LoginRequest("+8210".padEnd(LONG_PHONE_NUMBER_LENGTH, '1'), "password")

        // when
        val result = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)),
        )

        // then
        result.andExpect(status().isBadRequest)
        result.andExpect(jsonPath("$.code").value(ErrorCode.INVALID_REQUEST.code))
        verifyNoInteractions(authService)
    }

    companion object {

        private const val LONG_PHONE_NUMBER_LENGTH = 10_000
    }
}
