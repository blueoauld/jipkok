package com.blueoauld.server.global.web

import com.blueoauld.server.TestcontainersConfiguration
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@Import(TestcontainersConfiguration::class)
@SpringBootTest(properties = ["management.endpoint.health.show-details=always"])
@AutoConfigureMockMvc
class HealthCheckTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `헬스 체크가 인증 없이 열리고 DB와 레디스까지 본다`() {
        // given, when
        val result = mockMvc.perform(get("/health"))

        // then
        result.andExpect(status().isOk)
        result.andExpect(jsonPath("$.status").value("UP"))
        result.andExpect(jsonPath("$.components.db.status").value("UP"))
        result.andExpect(jsonPath("$.components.redis.status").value("UP"))
    }
}
