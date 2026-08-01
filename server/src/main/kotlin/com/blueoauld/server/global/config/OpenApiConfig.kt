package com.blueoauld.server.global.config

import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.exception.ErrorResponse
import io.swagger.v3.core.converter.ModelConverters
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.media.Content
import io.swagger.v3.oas.models.media.MediaType
import io.swagger.v3.oas.models.media.Schema
import io.swagger.v3.oas.models.responses.ApiResponse
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springdoc.core.customizers.OpenApiCustomizer
import org.springdoc.core.customizers.OperationCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    @Bean
    fun openApi(): OpenAPI = OpenAPI()
        .info(Info().title("집콕 API").version("v1").description(errorCodeTable()))
        .addSecurityItem(SecurityRequirement().addList(BEARER_SCHEME))
        .components(
            Components().addSecuritySchemes(
                BEARER_SCHEME,
                SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT"),
            ),
        )

    @Bean
    fun errorSchemaCustomizer() = OpenApiCustomizer { openApi ->
        ModelConverters.getInstance().read(ErrorResponse::class.java)
            .forEach { (name, schema) -> openApi.components.addSchemas(name, schema) }
    }

    @Bean
    fun requiredPropertyCustomizer() = OpenApiCustomizer { openApi ->
        openApi.components?.schemas?.values?.forEach { schema ->
            val required = schema.properties.orEmpty()
                .filterValues { !it.isNullable() }
                .keys
                .toList()

            if (required.isNotEmpty()) {
                schema.required = required
            }
        }
    }

    @Bean
    fun errorResponseCustomizer() = OperationCustomizer { operation, _ ->
        ERROR_RESPONSES.forEach { (status, description) ->
            operation.responses.addApiResponse(
                status,
                ApiResponse().description(description).content(errorContent()),
            )
        }

        operation
    }

    private fun Schema<*>.isNullable() = nullable == true || types?.contains("null") == true

    private fun errorContent() = Content().addMediaType(
        APPLICATION_JSON,
        MediaType().schema(Schema<Any>().`$ref`("#/components/schemas/ErrorResponse")),
    )

    private fun errorCodeTable() = ErrorCode.entries.joinToString(
        separator = "\n",
        prefix = "## 오류 코드\n\n| 코드 | 상태 | 메시지 |\n| --- | --- | --- |\n",
    ) { "| ${it.code} | ${it.status.value()} | ${it.message} |" }

    companion object {

        private const val BEARER_SCHEME = "bearerAuth"
        private const val APPLICATION_JSON = "application/json"

        private val ERROR_RESPONSES = listOf(
            "400" to "요청이 올바르지 않다",
            "401" to "인증이 필요하다",
            "500" to "서버에 문제가 발생했다",
        )
    }
}
