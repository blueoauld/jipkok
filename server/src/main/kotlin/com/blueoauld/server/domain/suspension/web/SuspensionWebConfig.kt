package com.blueoauld.server.domain.suspension.web

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class SuspensionWebConfig(

    private val serviceSuspensionInterceptor: ServiceSuspensionInterceptor,
) : WebMvcConfigurer {

    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(serviceSuspensionInterceptor)
            .addPathPatterns(API_PATH)
            .excludePathPatterns(*ALLOWED_PATHS)
    }

    companion object {

        private const val API_PATH = "/api/**"

        private val ALLOWED_PATHS = arrayOf(
            "/api/auth/**",
            "/api/members/me",
            "/api/members/me/device-tokens/**",
        )
    }
}
