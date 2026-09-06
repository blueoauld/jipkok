package com.blueoauld.server.global.config

import com.blueoauld.server.global.properties.CloudWatchProperties
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient
import java.time.Duration

@Configuration
@ConditionalOnExpression("!'\${cloudwatch.dashboard-name:}'.isEmpty()")
class CloudWatchConfig {

    @Bean
    fun cloudWatchClient(properties: CloudWatchProperties): CloudWatchClient = CloudWatchClient.builder()
        .region(Region.of(properties.region))
        .overrideConfiguration {
            it.apiCallTimeout(API_CALL_TIMEOUT)
            it.apiCallAttemptTimeout(API_CALL_ATTEMPT_TIMEOUT)
        }
        .build()

    companion object {

        private val API_CALL_TIMEOUT: Duration = Duration.ofSeconds(20)
        private val API_CALL_ATTEMPT_TIMEOUT: Duration = Duration.ofSeconds(10)
    }
}
