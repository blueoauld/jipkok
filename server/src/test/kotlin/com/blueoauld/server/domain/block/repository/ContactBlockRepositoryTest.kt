package com.blueoauld.server.domain.block.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.block.service.PhoneHasher
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

    @Autowired
    private lateinit var phoneHasher: PhoneHasher

    private var meId: Long = 0

    private var otherId: Long = 0

    @BeforeEach
    fun setUp() {
        meId = save(MY_PHONE_NUMBER).id
        otherId = save(OTHER_PHONE_NUMBER).id
    }

    @Test
    fun `내 주소록에 상대 번호가 있으면 차단 관계로 본다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(meId, phoneHasher.hash(OTHER_PHONE_NUMBER)))

        // when, then
        assertThat(contactBlockRepository.existsBetween(meId, otherId)).isTrue()
    }

    @Test
    fun `상대 주소록에 내 번호가 있어도 차단 관계로 본다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(otherId, phoneHasher.hash(MY_PHONE_NUMBER)))

        // when, then
        assertThat(contactBlockRepository.existsBetween(meId, otherId)).isTrue()
    }

    @Test
    fun `서로의 번호가 없으면 차단 관계가 아니다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(meId, phoneHasher.hash("+821077770002")))

        // when, then
        assertThat(contactBlockRepository.existsBetween(meId, otherId)).isFalse()
    }

    @Test
    fun `회원의 차단 번호를 세고 전부 지운다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(meId, phoneHasher.hash("+821077770002")))
        contactBlockRepository.saveAndFlush(ContactBlock(meId, phoneHasher.hash("+821077770003")))

        // when
        val count = contactBlockRepository.countByMemberId(meId)
        contactBlockRepository.deleteAllByMemberId(meId)

        // then
        assertThat(count).isEqualTo(2)
        assertThat(contactBlockRepository.countByMemberId(meId)).isZero()
    }

    private fun save(phoneNumber: String) = memberRepository.saveAndFlush(
        Member(
            phoneNumber = phoneNumber,
            phoneHash = phoneHasher.hash(phoneNumber),
            password = "encoded-password",
            gender = Gender.MALE,
            nickname = phoneNumber.takeLast(10),
            birthYear = 1998,
        ),
    )

    companion object {

        private const val MY_PHONE_NUMBER = "+821077770000"
        private const val OTHER_PHONE_NUMBER = "+821077770001"
    }
}
