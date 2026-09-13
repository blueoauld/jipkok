package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.like.entity.MemberLike
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
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

    @Autowired
    private lateinit var memberLikeRepository: MemberLikeRepository

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

    @Test
    fun `잔액만큼 쓰면 잔액이 0이 된다`() {
        // given
        val member = saveMember("+821088880010", pointBalance = 15)

        // when
        val updated = memberRepository.addPointBalance(member.id, -15)

        // then
        assertThat(updated).isOne()
        assertThat(memberRepository.findPointBalance(member.id)).isZero()
    }

    @Test
    fun `잔액보다 많이 쓰려 하면 잔액을 바꾸지 않는다`() {
        // given
        val member = saveMember("+821088880011", pointBalance = 14)

        // when
        val updated = memberRepository.addPointBalance(member.id, -15)

        // then
        assertThat(updated).isZero()
        assertThat(memberRepository.findPointBalance(member.id)).isEqualTo(14)
    }

    @Test
    fun `없는 회원의 잔액은 바꾸지 않는다`() {
        // when
        val updated = memberRepository.addPointBalance(MISSING_MEMBER_ID, 10)

        // then
        assertThat(updated).isZero()
    }

    @Test
    fun `회원이 좋아요한 상대의 받은 좋아요 수만 하나씩 내리고 0 아래로는 내리지 않는다`() {
        // given
        val liker = saveMember("+821088880020")
        val otherLiker = saveMember("+821088880021")
        val liked = saveMember("+821088880022", receivedLikeCount = 2)
        val likedByOther = saveMember("+821088880023", receivedLikeCount = 1)
        val alreadyZero = saveMember("+821088880024")
        memberLikeRepository.saveAllAndFlush(
            listOf(
                MemberLike(liker.id, liked.id),
                MemberLike(otherLiker.id, likedByOther.id),
                MemberLike(liker.id, alreadyZero.id),
                MemberLike(liked.id, liker.id),
            ),
        )

        // when
        memberRepository.decreaseReceivedLikeCountLikedBy(liker.id)

        // then
        assertThat(receivedLikeCountOf(liked.id)).isEqualTo(1)
        assertThat(receivedLikeCountOf(likedByOther.id)).isEqualTo(1)
        assertThat(receivedLikeCountOf(alreadyZero.id)).isZero()
        assertThat(receivedLikeCountOf(liker.id)).isZero()
    }

    private fun receivedLikeCountOf(memberId: Long) =
        memberRepository.findById(memberId).orElseThrow().receivedLikeCount

    private fun saveMember(phoneNumber: String, pointBalance: Int = 0, receivedLikeCount: Int = 0) =
        memberRepository.saveAndFlush(
            Member(
                phoneNumber = phoneNumber,
                password = "encoded-password",
                gender = Gender.MALE,
                nickname = phoneNumber.takeLast(10),
                birthYear = 1998,
                receivedLikeCount = receivedLikeCount,
                pointBalance = pointBalance,
            ),
        )

    companion object {

        private const val MISSING_MEMBER_ID = -1L
    }
}
