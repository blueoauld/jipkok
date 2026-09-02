package com.blueoauld.server.global.config

import com.blueoauld.server.TestcontainersConfiguration
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Import
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class TaskExecutorConfigTest {

    @Autowired
    private lateinit var context: ApplicationContext

    @Test
    fun `비동기 실행기를 직접 만든다`() {
        // given, when
        val taskExecutor = context.getBean(TaskExecutorConfig.TASK_EXECUTOR, ThreadPoolTaskExecutor::class.java)

        // then
        assertThat(taskExecutor.corePoolSize).isEqualTo(16)
        assertThat(taskExecutor.maxPoolSize).isEqualTo(32)
        assertThat(taskExecutor.queueCapacity).isEqualTo(500)
        assertThat(taskExecutor.threadNamePrefix).isEqualTo("task-")
    }

    @Test
    fun `웹소켓 실행기가 있어 부트 자동 설정은 실행기를 만들지 않는다`() {
        // given, when
        val names = context.getBeanNamesForType(ThreadPoolTaskExecutor::class.java)

        // then
        assertThat(names).contains(TaskExecutorConfig.TASK_EXECUTOR)
        assertThat(names).doesNotContain("applicationTaskExecutor")
    }
}
