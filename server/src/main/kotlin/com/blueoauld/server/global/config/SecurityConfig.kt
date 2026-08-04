package com.blueoauld.server.global.config

import com.blueoauld.server.global.properties.AdMobProperties
import com.blueoauld.server.global.properties.DiscordProperties
import com.blueoauld.server.global.properties.JwtProperties
import com.blueoauld.server.global.properties.R2Properties
import com.blueoauld.server.global.properties.SolapiProperties
import com.blueoauld.server.global.security.JwtAuthenticationEntryPoint
import com.blueoauld.server.global.security.JwtAuthenticationFilter
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableConfigurationProperties(
    JwtProperties::class,
    R2Properties::class,
    AdMobProperties::class,
    DiscordProperties::class,
    SolapiProperties::class,
)
class SecurityConfig(

    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val jwtAuthenticationEntryPoint: JwtAuthenticationEntryPoint,
) {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(HttpMethod.POST, "/api/members").permitAll()
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers(HttpMethod.GET, AD_REWARD_CALLBACK_PATH).permitAll()
                    .requestMatchers(HEALTH_PATH).permitAll()
                    .requestMatchers(WEB_SOCKET_PATH).permitAll()
                    .requestMatchers(*DOCS_PATHS).permitAll()
                    .anyRequest().authenticated()
            }
            .exceptionHandling { it.authenticationEntryPoint(jwtAuthenticationEntryPoint) }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            .build()

    companion object {

        private const val AD_REWARD_CALLBACK_PATH = "/api/ads/rewards/callback"
        private const val HEALTH_PATH = "/health"
        private const val WEB_SOCKET_PATH = "/ws/**"

        private val DOCS_PATHS = arrayOf("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**")
    }
}
