package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.block.entity.MemberBlock
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.Collections.reverseOrder

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class MemberListRepositoryTest {

    @Autowired
    private lateinit var memberListRepository: MemberListRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var memberBlockRepository: MemberBlockRepository

    private var meId: Long = 0

    private var nearId: Long = 0

    private var farId: Long = 0

    private var hongId: Long = 0

    @BeforeEach
    fun setUp() {
        val now = Instant.now()

        meId = save(member("01099990000", Gender.MALE, MY_LATITUDE, MY_LONGITUDE, now)).id
        nearId = save(
            member("01099990001", Gender.FEMALE, 37.51, 127.0, now.minusSeconds(60))
                .apply { receivedLikeCount = 3 },
        ).id
        farId = save(member("01099990002", Gender.MALE, 37.9, 127.0, now.minusSeconds(120))).id
        hongId = save(
            member("01099990003", Gender.MALE, 37.5, 127.0, now.minusSeconds(180))
                .apply {
                    nickname = "HongGil"
                    receivedLikeCount = 7
                },
        ).id
    }

    @Test
    fun `최근순은 접속 시각이 늦은 회원부터 준다`() {
        // given

        // when
        val rows = memberListRepository.findRecent(meId, null, MY_LATITUDE, MY_LONGITUDE, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).containsSubsequence(nearId, farId)
        assertThat(rows.map { it.getMemberId() }).doesNotContain(meId)
    }

    @Test
    fun `거리순은 가까운 회원부터 준다`() {
        // given

        // when
        val rows = memberListRepository.findByDistance(meId, null, MY_LATITUDE, MY_LONGITUDE, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).containsSubsequence(nearId, farId)
    }

    @Test
    fun `성별을 지정하면 해당 성별만 준다`() {
        // given

        // when
        val rows = memberListRepository.findRecent(
            meId,
            Gender.FEMALE.name,
            MY_LATITUDE,
            MY_LONGITUDE,
            null,
            null,
            PAGE_SIZE,
        )

        // then
        assertThat(rows.map { it.getMemberId() }).contains(nearId)
        assertThat(rows.map { it.getMemberId() }).doesNotContain(farId)
    }

    @Test
    fun `커서를 주면 그 뒤부터 준다`() {
        // given
        val first = memberListRepository.findByDistance(meId, null, MY_LATITUDE, MY_LONGITUDE, null, null, 1).first()

        // when
        val next = memberListRepository.findByDistance(
            meId,
            null,
            37.5,
            127.0,
            first.getOrderValue(),
            first.getMemberId(),
            PAGE_SIZE,
        )

        // then
        assertThat(next.map { it.getMemberId() }).doesNotContain(first.getMemberId())
        assertThat(next.map { it.getOrderValue() }).allMatch { it >= first.getOrderValue() }
    }

    @Test
    fun `최근순에도 거리와 갱신일이 담긴다`() {
        // given

        // when
        val rows = memberListRepository.findRecent(meId, null, MY_LATITUDE, MY_LONGITUDE, null, null, PAGE_SIZE)
        val near = rows.first { it.getMemberId() == nearId }

        // then
        assertThat(near.getLocatedAt()).isNotNull()
        assertThat(near.getDistance()).isNotNull().isGreaterThan(0.0)
    }

    @Test
    fun `내 좌표가 없으면 최근순의 거리는 비어 있다`() {
        // given

        // when
        val rows = memberListRepository.findRecent(meId, null, null, null, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getDistance() }).allMatch { it == null }
    }

    @Test
    fun `랭킹은 받은 좋아요가 많은 회원부터 준다`() {
        // given

        // when
        val rows = memberListRepository.findByReceivedLikeCount(meId, null, null, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).containsSubsequence(hongId, nearId)
        assertThat(rows.map { it.getMemberId() }).doesNotContain(meId)
        assertThat(rows.map { it.getOrderValue() }).isSortedAccordingTo(reverseOrder())
    }

    @Test
    fun `랭킹 커서를 주면 그 뒤부터 준다`() {
        // given
        val first = memberListRepository.findByReceivedLikeCount(meId, null, null, null, null, 1).first()

        // when
        val next = memberListRepository.findByReceivedLikeCount(
            meId,
            null,
            first.getOrderValue().toLong(),
            first.getLocatedAt()?.epochSecond ?: 0,
            first.getMemberId(),
            PAGE_SIZE,
        )

        // then
        assertThat(next.map { it.getMemberId() }).doesNotContain(first.getMemberId())
        assertThat(next.map { it.getOrderValue() }).allMatch { it <= first.getOrderValue() }
    }

    @Test
    fun `좋아요가 같으면 접속이 늦은 회원부터 준다`() {
        // given
        val now = Instant.now()
        val older = save(
            member("01099990004", Gender.MALE, 37.5, 127.0, now.minusSeconds(600))
                .apply { receivedLikeCount = 7 },
        ).id
        val newer = save(
            member("01099990005", Gender.MALE, 37.5, 127.0, now)
                .apply { receivedLikeCount = 7 },
        ).id

        // when
        val rows = memberListRepository.findByReceivedLikeCount(meId, null, null, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).containsSubsequence(newer, older)
    }

    @Test
    fun `랭킹에서도 차단한 회원은 빠진다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(meId, hongId))

        // when
        val rows = memberListRepository.findByReceivedLikeCount(meId, null, null, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).doesNotContain(hongId)
    }

    @Test
    fun `랭킹은 좋아요가 없는 회원도 준다`() {
        // given

        // when
        val rows = memberListRepository.findByReceivedLikeCount(meId, null, null, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).contains(farId)
    }

    @Test
    fun `닉네임 앞부분이 같으면 대소문자와 무관하게 찾는다`() {
        // given

        // when
        val rows = memberListRepository.findByNicknamePrefix(meId, "HONG", null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).contains(hongId)
    }

    @Test
    fun `닉네임 중간이 같으면 찾지 않는다`() {
        // given

        // when
        val rows = memberListRepository.findByNicknamePrefix(meId, "gil", null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).doesNotContain(hongId)
    }

    @Test
    fun `검색에서도 차단한 회원은 빠진다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(meId, hongId))

        // when
        val rows = memberListRepository.findByNicknamePrefix(meId, "hong", null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).doesNotContain(hongId)
    }

    @Test
    fun `와일드카드를 그대로 보내면 아무나 찾히지 않는다`() {
        // given

        // when
        val rows = memberListRepository.findByNicknamePrefix(meId, "\\%", null, null, PAGE_SIZE)

        // then
        assertThat(rows).isEmpty()
    }

    @Test
    fun `차단한 회원은 빠진다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(meId, nearId))

        // when
        val rows = memberListRepository.findRecent(meId, null, MY_LATITUDE, MY_LONGITUDE, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).doesNotContain(nearId)
    }

    @Test
    fun `나를 차단한 회원도 빠진다`() {
        // given
        memberBlockRepository.saveAndFlush(MemberBlock(nearId, meId))

        // when
        val rows = memberListRepository.findRecent(meId, null, MY_LATITUDE, MY_LONGITUDE, null, null, PAGE_SIZE)

        // then
        assertThat(rows.map { it.getMemberId() }).doesNotContain(nearId)
    }

    private fun save(member: Member) = memberRepository.saveAndFlush(member)

    private fun member(
        phoneNumber: String,
        gender: Gender,
        latitude: Double,
        longitude: Double,
        locatedAt: Instant,
    ) = Member(
        phoneNumber = phoneNumber,
        password = "encoded-password",
        gender = gender,
        nickname = phoneNumber.takeLast(10),
        birthYear = 1998,
    ).apply {
        this.latitude = latitude
        this.longitude = longitude
        this.locatedAt = locatedAt
    }

    companion object {

        private const val PAGE_SIZE = 200
        private const val MY_LATITUDE = 37.5
        private const val MY_LONGITUDE = 127.0
    }
}
