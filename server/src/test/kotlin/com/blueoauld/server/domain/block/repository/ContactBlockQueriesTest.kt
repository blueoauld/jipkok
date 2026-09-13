package com.blueoauld.server.domain.block.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.favorite.entity.MemberFavorite
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.like.entity.MemberLike
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.profileview.entity.ProfileView
import com.blueoauld.server.domain.profileview.repository.ProfileViewRepository
import com.blueoauld.server.domain.secretphoto.entity.SecretPhotoAccess
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class ContactBlockQueriesTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var contactBlockRepository: ContactBlockRepository

    @Autowired
    private lateinit var memberLikeRepository: MemberLikeRepository

    @Autowired
    private lateinit var memberFavoriteRepository: MemberFavoriteRepository

    @Autowired
    private lateinit var secretPhotoAccessRepository: SecretPhotoAccessRepository

    @Autowired
    private lateinit var profileViewRepository: ProfileViewRepository

    private var meId: Long = 0

    private var otherId: Long = 0

    private var friendId: Long = 0

    @BeforeEach
    fun setUp() {
        meId = saveMember(MY_PHONE_NUMBER)
        otherId = saveMember(OTHER_PHONE_NUMBER)
        friendId = saveMember(FRIEND_PHONE_NUMBER)

        listOf(otherId, friendId).forEach { id ->
            memberLikeRepository.save(MemberLike(meId, id))
            memberLikeRepository.save(MemberLike(id, meId))
            memberFavoriteRepository.save(MemberFavorite(meId, id))
            memberFavoriteRepository.save(MemberFavorite(id, meId))
            secretPhotoAccessRepository.save(SecretPhotoAccess(meId, id))
            secretPhotoAccessRepository.save(SecretPhotoAccess(id, meId))
            profileViewRepository.save(ProfileView(id, meId, VIEWED_AT))
        }
        profileViewRepository.flush()
    }

    @Test
    fun `번호 차단이 없으면 관계 목록에 모두 보인다`() {
        // given

        // when
        val lists = visibleMemberIds()

        // then
        assertThat(lists).allSatisfy { _, ids -> assertThat(ids).containsExactlyInAnyOrder(otherId, friendId) }
        assertThat(profileViewRepository.countVisibleViews(meId)).isEqualTo(2)
    }

    @Test
    fun `내가 번호를 차단한 회원은 관계 목록과 조회 수에서 빠진다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(meId, OTHER_PHONE_NUMBER))

        // when
        val lists = visibleMemberIds()

        // then
        assertThat(lists).allSatisfy { _, ids -> assertThat(ids).containsExactly(friendId) }
        assertThat(profileViewRepository.countVisibleViews(meId)).isEqualTo(1)
        assertThat(profileViewRepository.countVisibleViewsAfter(meId, VIEWED_AT.minusSeconds(1))).isEqualTo(1)
    }

    @Test
    fun `내 번호를 차단한 회원도 관계 목록과 조회 수에서 빠진다`() {
        // given
        contactBlockRepository.saveAndFlush(ContactBlock(otherId, MY_PHONE_NUMBER))

        // when
        val lists = visibleMemberIds()

        // then
        assertThat(lists).allSatisfy { _, ids -> assertThat(ids).containsExactly(friendId) }
        assertThat(profileViewRepository.countVisibleViews(meId)).isEqualTo(1)
        assertThat(profileViewRepository.countVisibleViewsAfter(meId, VIEWED_AT.minusSeconds(1))).isEqualTo(1)
    }

    private fun visibleMemberIds() = mapOf(
        "누른 좋아요" to memberLikeRepository.findVisibleByLikerId(meId, Long.MAX_VALUE, SIZE).map { it.likedMemberId },
        "받은 좋아요" to memberLikeRepository.findVisibleByLikedMemberId(meId, Long.MAX_VALUE, SIZE).map { it.likerId },
        "즐겨찾기" to memberFavoriteRepository.findVisibleByMemberId(meId, Long.MAX_VALUE, SIZE)
            .map { it.favoriteMemberId },
        "받은 즐겨찾기" to memberFavoriteRepository.findVisibleByFavoriteMemberId(meId, Long.MAX_VALUE, SIZE)
            .map { it.memberId },
        "공개한 비밀 사진" to secretPhotoAccessRepository.findVisibleByOwnerId(meId, Long.MAX_VALUE, SIZE)
            .map { it.viewerId },
        "공개받은 비밀 사진" to secretPhotoAccessRepository.findVisibleByViewerId(meId, Long.MAX_VALUE, SIZE)
            .map { it.ownerId },
        "프로필 조회 첫 쪽" to profileViewRepository.findVisibleFirstPage(meId, SIZE).map { it.viewerId },
        "프로필 조회 다음 쪽" to profileViewRepository.findVisibleNextPage(meId, VIEWED_AT.plusSeconds(1), 0, SIZE)
            .map { it.viewerId },
    )

    private fun saveMember(phoneNumber: String) = memberRepository.saveAndFlush(
        Member(
            phoneNumber = phoneNumber,
            password = "encoded-password",
            gender = Gender.MALE,
            nickname = phoneNumber.takeLast(10),
            birthYear = 1998,
        ),
    ).id

    companion object {

        private const val MY_PHONE_NUMBER = "+821055550000"
        private const val OTHER_PHONE_NUMBER = "+821055550001"
        private const val FRIEND_PHONE_NUMBER = "+821055550002"
        private const val SIZE = 20

        private val VIEWED_AT: Instant = Instant.parse("2026-09-01T00:00:00Z")
    }
}
