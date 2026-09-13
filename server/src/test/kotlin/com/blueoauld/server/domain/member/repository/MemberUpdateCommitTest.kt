package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.TransactionDefinition
import org.springframework.transaction.support.TransactionTemplate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class MemberUpdateCommitTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var transactionManager: PlatformTransactionManager

    private var memberId: Long = 0

    @AfterEach
    fun tearDown() {
        TransactionTemplate(transactionManager).executeWithoutResult {
            memberRepository.deleteAllByIdIn(listOf(memberId))
        }
    }

    @Test
    fun `회원을 고치는 사이 다른 요청이 올린 좋아요 수와 포인트를 덮어쓰지 않는다`() {
        // given
        memberId = memberRepository.saveAndFlush(member()).id

        // when
        TransactionTemplate(transactionManager).executeWithoutResult {
            val member = memberRepository.findById(memberId).get()

            newTransaction().executeWithoutResult {
                memberRepository.increaseReceivedLikeCount(memberId)
                memberRepository.addPointBalance(memberId, POINT)
            }

            member.latitude = LATITUDE
        }

        // then
        val member = memberRepository.findById(memberId).get()
        assertThat(member.receivedLikeCount).isEqualTo(1)
        assertThat(member.pointBalance).isEqualTo(POINT)
        assertThat(member.latitude).isEqualTo(LATITUDE)
    }

    private fun newTransaction() = TransactionTemplate(transactionManager).apply {
        propagationBehavior = TransactionDefinition.PROPAGATION_REQUIRES_NEW
    }

    private fun member() = Member(
        phoneNumber = "+821066660000",
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "commit0000",
        birthYear = 1998,
    )

    companion object {

        private const val POINT = 15
        private const val LATITUDE = 37.5
    }
}
