package com.blueoauld.server.domain.suspension.service

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.event.MemberSuspensionChangedEvent
import com.blueoauld.server.domain.suspension.repository.SuspendedMemberCache
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationEventPublisher
import org.springframework.context.annotation.Import
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class SuspendedMemberCacheEvictorCommitTest {

    @Autowired
    private lateinit var suspendedMemberCache: SuspendedMemberCache

    @Autowired
    private lateinit var eventPublisher: ApplicationEventPublisher

    @Autowired
    private lateinit var transactionManager: PlatformTransactionManager

    @AfterEach
    fun tearDown() {
        suspendedMemberCache.evict(MEMBER_ID)
    }

    @Test
    fun `정지가 바뀌면 커밋한 뒤에야 캐시를 비운다`() {
        // given
        suspendedMemberCache.save(MEMBER_ID, SuspensionType.SERVICE, false, SuspendedMemberCache.TTL)

        // when
        val cachedBeforeCommit = TransactionTemplate(transactionManager).execute {
            eventPublisher.publishEvent(MemberSuspensionChangedEvent(setOf(MEMBER_ID)))
            suspendedMemberCache.find(MEMBER_ID, SuspensionType.SERVICE)
        }

        // then
        assertThat(cachedBeforeCommit).isFalse()
        assertThat(suspendedMemberCache.find(MEMBER_ID, SuspensionType.SERVICE)).isNull()
    }

    companion object {

        private const val MEMBER_ID = 987_700L
    }
}
