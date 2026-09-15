package com.blueoauld.server.domain.member.service

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.repository.AiGreetingJobRepository
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.block.entity.MemberBlock
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.diary.entity.Diary
import com.blueoauld.server.domain.diary.entity.DiaryAttachment
import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType
import com.blueoauld.server.domain.diary.repository.DiaryAttachmentRepository
import com.blueoauld.server.domain.diary.repository.DiaryRepository
import com.blueoauld.server.domain.favorite.entity.MemberFavorite
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.feed.entity.FeedPost
import com.blueoauld.server.domain.feed.entity.FeedPostLike
import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.like.entity.MemberLike
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.memo.entity.MemberMemo
import com.blueoauld.server.domain.memo.repository.MemberMemoRepository
import com.blueoauld.server.domain.point.entity.PointHistory
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.repository.PointHistoryRepository
import com.blueoauld.server.domain.profileview.entity.ProfileView
import com.blueoauld.server.domain.profileview.repository.ProfileViewRepository
import com.blueoauld.server.domain.push.entity.DeviceToken
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import com.blueoauld.server.domain.secretphoto.entity.SecretPhotoAccess
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.domain.worry.entity.WorryComment
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.WorryPostLike
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class MemberWithdrawServiceIntegrationTest {

    @Autowired
    private lateinit var memberWithdrawService: MemberWithdrawService

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var aiGreetingJobRepository: AiGreetingJobRepository

    @Autowired
    private lateinit var chatRoomRepository: ChatRoomRepository

    @Autowired
    private lateinit var feedPostRepository: FeedPostRepository

    @Autowired
    private lateinit var feedPostLikeRepository: FeedPostLikeRepository

    @Autowired
    private lateinit var worryPostRepository: WorryPostRepository

    @Autowired
    private lateinit var worryPostLikeRepository: WorryPostLikeRepository

    @Autowired
    private lateinit var worryCommentRepository: WorryCommentRepository

    @Autowired
    private lateinit var diaryRepository: DiaryRepository

    @Autowired
    private lateinit var diaryAttachmentRepository: DiaryAttachmentRepository

    @Autowired
    private lateinit var memberBlockRepository: MemberBlockRepository

    @Autowired
    private lateinit var contactBlockRepository: ContactBlockRepository

    @Autowired
    private lateinit var memberFavoriteRepository: MemberFavoriteRepository

    @Autowired
    private lateinit var memberLikeRepository: MemberLikeRepository

    @Autowired
    private lateinit var memberMemoRepository: MemberMemoRepository

    @Autowired
    private lateinit var secretPhotoAccessRepository: SecretPhotoAccessRepository

    @Autowired
    private lateinit var profileViewRepository: ProfileViewRepository

    @Autowired
    private lateinit var pointHistoryRepository: PointHistoryRepository

    @Autowired
    private lateinit var deviceTokenRepository: DeviceTokenRepository

    @Autowired
    private lateinit var refreshTokenRepository: RefreshTokenRepository

    @Autowired
    private lateinit var clock: Clock

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `모든 도메인에서 회원의 흔적을 지운다`() {
        // given
        val member = memberRepository.save(newMember("+821011112222", "탈퇴자"))
        val partner = memberRepository.save(newMember("+821033334444", "상대방", receivedLikeCount = 1))
        val now = clock.instant()

        chatRoomRepository.save(ChatRoom.of(member.id, partner.id))
        aiGreetingJobRepository.save(AiGreetingJob(memberId = member.id, dueAt = now))

        feedPostRepository.save(FeedPost(member.id, now, "feeds/mine.webp"))
        val partnerFeedPost = feedPostRepository.save(
            FeedPost(partner.id, now, "feeds/partner.webp", likeCount = 1),
        )
        feedPostLikeRepository.save(FeedPostLike(partnerFeedPost.id, member.id))

        worryPostRepository.save(WorryPost(member.id, WorryCategory.LOVE, "내 고민"))
        val partnerWorryPost = worryPostRepository.save(
            WorryPost(partner.id, WorryCategory.WORK, "상대 고민", likeCount = 1, commentCount = 1),
        )
        worryPostLikeRepository.save(WorryPostLike(partnerWorryPost.id, member.id))
        worryCommentRepository.save(WorryComment(partnerWorryPost.id, member.id, "내 댓글", 1))

        val diary = diaryRepository.save(Diary(member.id, LocalDate.of(2026, 9, 1), "내 일기"))
        diaryAttachmentRepository.save(
            DiaryAttachment(diary.id, DiaryAttachmentType.PHOTO, "diaries/${member.id}/photo.webp", position = 0),
        )

        memberBlockRepository.save(MemberBlock(member.id, partner.id))
        contactBlockRepository.save(ContactBlock(member.id, "+821055556666"))
        memberFavoriteRepository.save(MemberFavorite(member.id, partner.id))
        memberLikeRepository.save(MemberLike(member.id, partner.id))
        memberMemoRepository.save(MemberMemo(member.id, partner.id, "내가 남긴 메모"))
        memberMemoRepository.save(MemberMemo(partner.id, member.id, "상대가 남긴 메모"))
        secretPhotoAccessRepository.save(SecretPhotoAccess(member.id, partner.id))
        secretPhotoAccessRepository.save(SecretPhotoAccess(partner.id, member.id))
        profileViewRepository.save(ProfileView(member.id, partner.id, now))
        pointHistoryRepository.save(PointHistory(member.id, PointType.ACCESS_REWARD, 30, 30, now))
        deviceTokenRepository.save(DeviceToken(member.id, "expo-token", DevicePlatform.IOS))
        refreshTokenRepository.save(member.id, "refresh-token")

        entityManager.flush()

        // when
        memberWithdrawService.withdraw(member.id)

        entityManager.flush()
        entityManager.clear()

        // then
        assertThat(memberRepository.findById(member.id)).isEmpty()
        assertThat(chatRoomRepository.findAllByMember(member.id)).isEmpty()
        assertThat(refreshTokenRepository.findToken(member.id)).isNull()
        assertThat(diaryAttachmentRepository.findAllByDiaryIdOrderByPosition(diary.id)).isEmpty()

        val remaining = REMAINING_ROW_QUERIES.filterValues { countRows(it, member.id) > 0 }.keys
        assertThat(remaining).isEmpty()

        assertThat(memberRepository.findById(partner.id).orElseThrow().receivedLikeCount).isZero()
        assertThat(feedPostRepository.findById(partnerFeedPost.id).orElseThrow().likeCount).isZero()
        val worryPost = worryPostRepository.findById(partnerWorryPost.id).orElseThrow()
        assertThat(worryPost.likeCount).isZero()
        assertThat(worryPost.commentCount).isZero()
    }

    private fun newMember(phoneNumber: String, nickname: String, receivedLikeCount: Int = 0) = Member(
        phoneNumber = phoneNumber,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = nickname,
        birthYear = 1998,
        receivedLikeCount = receivedLikeCount,
    )

    private fun countRows(condition: String, memberId: Long): Long {
        val (table, where) = condition.split("|")

        return (
            entityManager.createNativeQuery("select count(*) from $table where $where")
                .setParameter("memberId", memberId)
                .singleResult as Number
            ).toLong()
    }

    companion object {

        private val REMAINING_ROW_QUERIES = mapOf(
            "AI 첫 쪽지 작업" to "ai_greeting_job|member_id = :memberId",
            "피드 게시물" to "feed_post|member_id = :memberId and deleted_at is null",
            "피드 좋아요" to "feed_post_like|member_id = :memberId",
            "고민 글" to "worry_post|member_id = :memberId and deleted_at is null",
            "고민 좋아요" to "worry_post_like|member_id = :memberId",
            "고민 댓글" to "worry_comment|member_id = :memberId and deleted_at is null",
            "일기" to "diary|member_id = :memberId",
            "차단" to "member_block|blocker_id = :memberId or blocked_member_id = :memberId",
            "번호 차단" to "contact_block|member_id = :memberId",
            "즐겨찾기" to "member_favorite|member_id = :memberId or favorite_member_id = :memberId",
            "좋아요" to "member_like|liker_id = :memberId or liked_member_id = :memberId",
            "회원 메모" to "member_memo|owner_id = :memberId or target_id = :memberId",
            "비밀 사진 공개" to "secret_photo_access|owner_id = :memberId or viewer_id = :memberId",
            "프로필 열람" to "profile_view|viewer_id = :memberId or viewed_member_id = :memberId",
            "포인트 내역" to "point_history|member_id = :memberId",
            "기기 토큰" to "device_token|member_id = :memberId",
        )
    }
}
