package com.blueoauld.server.domain.block.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class ContactBlockRepositoryTest {

    @Autowired
    private lateinit var contactBlockRepository: ContactBlockRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    private var meId: Long = 0

    private var otherId: Long = 0

    @BeforeEach
    fun setUp() {
        meId = save(MY_PHONE_NUMBER).id
        otherId = save(OTHER_PHONE_NUMBER).id
    }

    @Test
    fun `내가 상대 번호를 차단했으면 차단 관계로 본다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(meId, OTHER_PHONE_NUMBER))

        // when, then
        assertThat(contactBlockRepository.existsBetween(meId, otherId)).isTrue()
    }

    @Test
    fun `상대가 내 번호를 차단했어도 차단 관계로 본다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(otherId, MY_PHONE_NUMBER))

        // when, then
        assertThat(contactBlockRepository.existsBetween(meId, otherId)).isTrue()
    }

    @Test
    fun `서로의 번호가 없으면 차단 관계가 아니다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(meId, THIRD_PHONE_NUMBER))

        // when, then
        assertThat(contactBlockRepository.existsBetween(meId, otherId)).isFalse()
    }

    @Test
    fun `내 것만 최근 순으로 나열하고 id로 지운다`() {
        // given
        val first = contactBlockRepository.saveAndFlush(ContactBlock(meId, OTHER_PHONE_NUMBER))
        val second = contactBlockRepository.saveAndFlush(ContactBlock(meId, THIRD_PHONE_NUMBER))
        contactBlockRepository.saveAndFlush(ContactBlock(otherId, MY_PHONE_NUMBER))

        // when
        val listed = contactBlockRepository.findAllByMemberIdOrderByIdDesc(meId)
        val deleted = contactBlockRepository.deleteByIdAndMemberId(first.id, otherId)

        // then
        assertThat(listed.map { it.id }).containsExactly(second.id, first.id)
        assertThat(deleted).isZero()
        assertThat(contactBlockRepository.countByMemberId(meId)).isEqualTo(2)
    }

    private fun save(phoneNumber: String) = memberRepository.saveAndFlush(
        Member(
            phoneNumber = phoneNumber,
            password = "encoded-password",
            gender = Gender.MALE,
            nickname = phoneNumber.takeLast(10),
            birthYear = 1998,
        ),
    )

    companion object {

        private const val MY_PHONE_NUMBER = "+821077770000"
        private const val OTHER_PHONE_NUMBER = "+821077770001"
        private const val THIRD_PHONE_NUMBER = "+821077770002"
    }
}
