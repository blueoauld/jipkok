package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class MemberRepositoryTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `닉네임 조회는 탈퇴 회원도 준다`() {
        // given
        val member = saveMember("+821088880007")
        memberRepository.delete(member)
        entityManager.flush()

        // when
        val nicknames = memberRepository.findNicknamesByIdIn(listOf(member.id))

        // then
        assertThat(nicknames).hasSize(1)
        assertThat(nicknames.first().nickname).isEqualTo(member.nickname)
    }

    private fun saveMember(phoneNumber: String) = memberRepository.saveAndFlush(
        Member(
            phoneNumber = phoneNumber,
            password = "encoded-password",
            gender = Gender.MALE,
            nickname = phoneNumber.takeLast(10),
            birthYear = 1998,
        ),
    )
}
