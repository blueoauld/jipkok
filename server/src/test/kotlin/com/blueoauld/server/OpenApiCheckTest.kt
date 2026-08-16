package com.blueoauld.server

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
@SpringBootTest(properties = ["spring.jpa.hibernate.ddl-auto=none"])
@AutoConfigureMockMvc
class OpenApiCheckTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `문서가 인증 없이 열리고 엔드포인트가 담긴다`() {
        // given, when
        val result = mockMvc.perform(get("/v3/api-docs"))

        // then
        result.andExpect(status().isOk)
        result.andExpect(jsonPath("$.info.title").value("집콕 API"))
        result.andExpect(jsonPath("$.paths['/api/members'].post").exists())
        result.andExpect(jsonPath("$.paths['/api/auth/login'].post").exists())
        result.andExpect(jsonPath("$.paths['/api/points/me/histories'].get").exists())
        result.andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme").value("bearer"))
        result.andExpect(jsonPath("$.paths['/api/auth/login'].post.summary").value("로그인"))
        result.andExpect(
            jsonPath("$.paths['/api/auth/login'].post.responses['401'].content['application/json'].schema.\$ref")
                .value("#/components/schemas/ErrorResponse"),
        )
        result.andExpect(
            jsonPath("$.paths['/api/auth/login'].post.responses['200'].content['application/json'].schema.\$ref")
                .value("#/components/schemas/TokenResponse"),
        )
        result.andExpect(jsonPath("$.paths['/api/auth/login'].post.responses['200'].content['*/*']").doesNotExist())
        result.andExpect(jsonPath("$.components.schemas.ErrorResponse").exists())
        result.andExpect(jsonPath("$.info.description").value(org.hamcrest.Matchers.containsString("COMMON_001")))
    }
}
