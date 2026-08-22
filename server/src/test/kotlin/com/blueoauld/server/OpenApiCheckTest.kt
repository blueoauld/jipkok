package com.blueoauld.server

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.node.ObjectNode
import java.io.File

@Import(TestcontainersConfiguration::class)
@SpringBootTest(properties = ["spring.jpa.hibernate.ddl-auto=none"])
@AutoConfigureMockMvc
class OpenApiCheckTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `커밋된 문서가 서버와 같다`() {
        // given
        val served = objectMapper.readTree(
            mockMvc.perform(get("/v3/api-docs")).andReturn().response.contentAsByteArray,
        )

        // when
        val admin = objectMapper.readTree(File("../admin/openapi.json"))
        val app = objectMapper.readTree(File("../app/openapi.json"))

        // then
        assertThat(admin).isEqualTo(served)
        assertThat(app).isEqualTo(withoutAdminPaths(served))
    }

    private fun withoutAdminPaths(spec: JsonNode): JsonNode {
        val copy = spec.deepCopy() as ObjectNode
        val paths = copy.get("paths") as ObjectNode
        paths.properties().map { it.key }.filter { it.startsWith(ADMIN_PREFIX) }
            .forEach { paths.remove(it) }

        return copy
    }

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

    companion object {

        private const val ADMIN_PREFIX = "/api/admin"
    }
}
