package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.service.ChatRoomService
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.memo.repository.MemberMemoRepository
import com.blueoauld.server.domain.point.repository.PointHistoryRepository
import com.blueoauld.server.domain.profileview.repository.ProfileViewRepository
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import io.mockk.verifyOrder
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.*

class MemberWithdrawServiceTest {

    private val memberRepository = mockk<MemberRepository>(relaxed = true)

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val chatRoomService = mockk<ChatRoomService>(relaxed = true)

    private val feedPostRepository = mockk<FeedPostRepository>(relaxed = true)

    private val feedPostLikeRepository = mockk<FeedPostLikeRepository>(relaxed = true)

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val worryPostLikeRepository = mockk<WorryPostLikeRepository>(relaxed = true)

    private val worryCommentRepository = mockk<WorryCommentRepository>(relaxed = true)

    private val memberBlockRepository = mockk<MemberBlockRepository>(relaxed = true)

    private val memberFavoriteRepository = mockk<MemberFavoriteRepository>(relaxed = true)

    private val memberLikeRepository = mockk<MemberLikeRepository>(relaxed = true)

    private val memberMemoRepository = mockk<MemberMemoRepository>(relaxed = true)

    private val secretPhotoAccessRepository = mockk<SecretPhotoAccessRepository>(relaxed = true)

    private val profileViewRepository = mockk<ProfileViewRepository>(relaxed = true)

    private val pointHistoryRepository = mockk<PointHistoryRepository>(relaxed = true)

    private val deviceTokenRepository = mockk<DeviceTokenRepository>(relaxed = true)

    private val refreshTokenRepository = mockk<RefreshTokenRepository>(relaxed = true)

    private val memberWithdrawService = MemberWithdrawService(
        memberRepository,
        chatRoomRepository,
        chatRoomService,
        feedPostRepository,
        feedPostLikeRepository,
        worryPostRepository,
        worryPostLikeRepository,
        worryCommentRepository,
        memberBlockRepository,
        memberFavoriteRepository,
        memberLikeRepository,
        memberMemoRepository,
        secretPhotoAccessRepository,
        profileViewRepository,
        pointHistoryRepository,
        deviceTokenRepository,
        refreshTokenRepository,
    )

    private val member = Member(
        phoneNumber = "+821011112222",
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "홍길동",
        birthYear = 1998,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)
        every { chatRoomRepository.findAllByMember(MEMBER_ID) } returns emptyList()
    }

    @Test
    fun `회원과 활동 내역을 지운다`() {
        // when
        memberWithdrawService.withdraw(MEMBER_ID)

        // then
        verify { feedPostRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { feedPostLikeRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { worryPostRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { worryPostLikeRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { worryCommentRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { memberBlockRepository.deleteAllByMember(MEMBER_ID) }
        verify { memberFavoriteRepository.deleteAllByMember(MEMBER_ID) }
        verify { memberLikeRepository.deleteAllByMember(MEMBER_ID) }
        verify { memberMemoRepository.deleteAllByMember(MEMBER_ID) }
        verify { secretPhotoAccessRepository.deleteAllByMember(MEMBER_ID) }
        verify { pointHistoryRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { deviceTokenRepository.deleteAllByMemberId(MEMBER_ID) }
        verify { memberRepository.delete(member) }
    }

    @Test
    fun `좋아요를 지우기 전에 받은 쪽의 개수를 줄인다`() {
        // when
        memberWithdrawService.withdraw(MEMBER_ID)

        // then
        verifyOrder {
            memberRepository.decreaseReceivedLikeCountLikedBy(MEMBER_ID)
            memberLikeRepository.deleteAllByMember(MEMBER_ID)
        }
        verifyOrder {
            feedPostRepository.decreaseLikeCountLikedBy(MEMBER_ID)
            feedPostLikeRepository.deleteAllByMemberId(MEMBER_ID)
        }
        verifyOrder {
            worryPostRepository.decreaseLikeCountLikedBy(MEMBER_ID)
            worryPostLikeRepository.deleteAllByMemberId(MEMBER_ID)
        }
    }

    @Test
    fun `댓글을 지우기 전에 글의 댓글 수를 줄인다`() {
        // when
        memberWithdrawService.withdraw(MEMBER_ID)

        // then
        verifyOrder {
            worryPostRepository.decreaseCommentCountCommentedBy(MEMBER_ID)
            worryCommentRepository.deleteAllByMemberId(MEMBER_ID)
        }
    }

    @Test
    fun `저장된 리프레시 토큰을 지운다`() {
        // when
        memberWithdrawService.withdraw(MEMBER_ID)

        // then
        verify { refreshTokenRepository.delete(MEMBER_ID) }
    }

    @Test
    fun `참여 중인 대화방을 모두 지운다`() {
        // given
        val room = ChatRoom.of(MEMBER_ID, PARTNER_ID)
        every { chatRoomRepository.findAllByMember(MEMBER_ID) } returns listOf(room)

        // when
        memberWithdrawService.withdraw(MEMBER_ID)

        // then
        verify { chatRoomService.deleteAll(MEMBER_ID, listOf(room)) }
    }

    @Test
    fun `없는 회원이면 지우지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when, then
        assertThatThrownBy { memberWithdrawService.withdraw(MEMBER_ID) }
            .isInstanceOf(BusinessException::class.java)

        verify(exactly = 0) { memberRepository.delete(any()) }
    }

    companion object {

        private const val MEMBER_ID = 1L
        private const val PARTNER_ID = 2L
    }
}
