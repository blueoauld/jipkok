package com.blueoauld.server

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.containers.GenericContainer
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName

@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    fun postgresContainer() = POSTGRES

    @Bean
    @ServiceConnection(name = "redis")
    fun redisContainer() = REDIS

    companion object {

        private const val POSTGRES_IMAGE = "postgis/postgis:18-3.6"
        private const val REDIS_IMAGE = "redis:8.4.0"
        private const val REDIS_PORT = 6379

        private val POSTGRES = PostgreSQLContainer(
            DockerImageName.parse(POSTGRES_IMAGE).asCompatibleSubstituteFor(PostgreSQLContainer.IMAGE),
        )

        private val REDIS: GenericContainer<*> = GenericContainer(DockerImageName.parse(REDIS_IMAGE))
            .withExposedPorts(REDIS_PORT)
    }
}
