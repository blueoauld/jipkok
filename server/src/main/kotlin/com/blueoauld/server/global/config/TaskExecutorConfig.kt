package com.blueoauld.server.global.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor

@Configuration
class TaskExecutorConfig {

    @Bean(TASK_EXECUTOR)
    fun taskExecutor() = ThreadPoolTaskExecutor().apply {
        corePoolSize = CORE_POOL_SIZE
        maxPoolSize = MAX_POOL_SIZE
        queueCapacity = QUEUE_CAPACITY
        setThreadNamePrefix(THREAD_NAME_PREFIX)
        setWaitForTasksToCompleteOnShutdown(true)
        setAwaitTerminationSeconds(AWAIT_TERMINATION_SECONDS)
    }

    companion object {

        const val TASK_EXECUTOR = "taskExecutor"

        private const val CORE_POOL_SIZE = 16
        private const val MAX_POOL_SIZE = 32
        private const val QUEUE_CAPACITY = 500
        private const val AWAIT_TERMINATION_SECONDS = 10
        private const val THREAD_NAME_PREFIX = "task-"
    }
}
