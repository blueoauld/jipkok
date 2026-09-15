package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import com.blueoauld.server.domain.block.entity.MemberBlock
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AiGreetingQueriesTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var aiPersonaRepository: AiPersonaRepository

    @Autowired
    private lateinit var aiGreetingJobRepository: AiGreetingJobRepository

    @Autowired
    private lateinit var chatRoomRepository: ChatRoomRepository

    @Autowired
    private lateinit var memberBlockRepository: MemberBlockRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `가입 후 10분에서 3일 사이의 쪽지를 받는 일반 회원만 성별과 상관없이 인사 후보가 된다`() {
        // given
        val woman = saveMember(Gender.FEMALE, "+821088880001", signedUpAgo = Duration.ofHours(1))
        val man = saveMember(Gender.MALE, "+821088880002", signedUpAgo = Duration.ofHours(2))
        saveMember(Gender.FEMALE, "+821088880003", signedUpAgo = Duration.ofMinutes(5))
        saveMember(Gender.FEMALE, "+821088880004", signedUpAgo = Duration.ofDays(4))
        saveMember(Gender.FEMALE, "+821088880005", signedUpAgo = Duration.ofHours(1), noteReceiveEnabled = false)
        saveAi(Gender.FEMALE, greetingEnabled = true)
        val queued = saveMember(Gender.FEMALE, "+821088880006", signedUpAgo = Duration.ofHours(2))
        aiGreetingJobRepository.saveAndFlush(AiGreetingJob(memberId = queued, dueAt = Instant.now()))

        // when
        val ids = aiGreetingJobRepository.findCandidates(
            oldest = Instant.now().minus(Duration.ofDays(3)),
            threshold = Instant.now().minus(Duration.ofMinutes(10)),
            size = 10,
        )

        // then
        assertThat(ids).containsExactly(man, woman)
    }

    @Test
    fun `같은 회원에게는 작업을 두 번 넣지 않는다`() {
        // given
        val memberId = saveMember(Gender.FEMALE, "+821088880011", signedUpAgo = Duration.ofHours(1))
        val first = Instant.parse("2026-09-15T03:00:00Z")
        val second = Instant.parse("2026-09-15T05:00:00Z")

        // when
        aiGreetingJobRepository.insertIfAbsent(memberId, first, first)
        aiGreetingJobRepository.insertIfAbsent(memberId, second, second)

        // then
        val job = aiGreetingJobRepository.findById(memberId).orElseThrow()
        assertThat(job.dueAt).isEqualTo(first)
        assertThat(job.state).isEqualTo(AiGreetingState.PENDING)
    }

    @Test
    fun `인사 기능이 켜진 남자 AI를 가까운 순으로 고르고 방이 있거나 차단했거나 한도에 닿은 AI는 뺀다`() {
        // given
        val target = saveMember(Gender.FEMALE, "+821088880021", signedUpAgo = Duration.ofHours(1))
        val other = saveMember(Gender.FEMALE, "+821088880022", signedUpAgo = Duration.ofHours(1))
        val near = saveAi(Gender.MALE, greetingEnabled = true, latitude = 37.51, longitude = 127.0)
        val far = saveAi(Gender.MALE, greetingEnabled = true, latitude = 35.1, longitude = 129.0)
        saveAi(Gender.FEMALE, greetingEnabled = true, latitude = 37.5, longitude = 127.0)
        saveAi(Gender.MALE, greetingEnabled = false, latitude = 37.5, longitude = 127.0)
        saveAi(Gender.MALE, greetingEnabled = true, latitude = 37.5, longitude = 127.0, enabled = false)
        val roomed = saveAi(Gender.MALE, greetingEnabled = true, latitude = 37.5, longitude = 127.0)
        chatRoomRepository.saveAndFlush(ChatRoom.of(roomed, target))
        val blocked = saveAi(Gender.MALE, greetingEnabled = true, latitude = 37.5, longitude = 127.0)
        memberBlockRepository.saveAndFlush(MemberBlock(target, blocked))
        val limited = saveAi(
            Gender.MALE,
            greetingEnabled = true,
            latitude = 37.5,
            longitude = 127.0,
            dailyGreetingLimit = 1,
        )
        aiGreetingJobRepository.saveAndFlush(
            AiGreetingJob(
                memberId = other,
                dueAt = Instant.now(),
                state = AiGreetingState.SENT,
                aiMemberId = limited,
                roomId = 1L,
                sentAt = Instant.now(),
            ),
        )
        val dayStart = Instant.now().minus(Duration.ofHours(1))

        // when
        val rows = aiGreetingJobRepository.findNearestAiCandidates(
            memberId = target,
            gender = Gender.MALE.name,
            latitude = 37.5,
            longitude = 127.0,
            dayStart = dayStart,
            size = 5,
        )

        // then
        assertThat(rows.map { it.aiMemberId }).containsExactly(near, far)
        assertThat(rows[0].distanceMeters).isBetween(0.0, 3_000.0)
        assertThat(rows[1].distanceMeters).isGreaterThan(rows[0].distanceMeters)
    }

    @Test
    fun `위치가 없으면 같은 조건의 남자 AI를 거리 없이 고른다`() {
        // given
        val target = saveMember(Gender.FEMALE, "+821088880041", signedUpAgo = Duration.ofHours(1))
        val first = saveAi(Gender.MALE, greetingEnabled = true, latitude = 37.5, longitude = 127.0)
        val second = saveAi(Gender.MALE, greetingEnabled = true, latitude = 35.1, longitude = 129.0)
        saveAi(Gender.FEMALE, greetingEnabled = true)
        saveAi(Gender.MALE, greetingEnabled = false)
        val roomed = saveAi(Gender.MALE, greetingEnabled = true)
        chatRoomRepository.saveAndFlush(ChatRoom.of(roomed, target))

        // when
        val ids = aiGreetingJobRepository.findRandomAiCandidates(
            memberId = target,
            gender = Gender.MALE.name,
            dayStart = Instant.now().minus(Duration.ofHours(1)),
            size = 5,
        )

        // then
        assertThat(ids).containsExactlyInAnyOrder(first, second)
    }

    @Test
    fun `보낸 인사 수는 오늘 보낸 것만 센다`() {
        // given
        val ai = saveAi(Gender.MALE, greetingEnabled = true)
        val today = saveMember(Gender.FEMALE, "+821088880031", signedUpAgo = Duration.ofHours(1))
        val yesterday = saveMember(Gender.FEMALE, "+821088880032", signedUpAgo = Duration.ofDays(1))
        val now = Instant.now()
        aiGreetingJobRepository.saveAndFlush(sentJob(today, ai, sentAt = now))
        aiGreetingJobRepository.saveAndFlush(sentJob(yesterday, ai, sentAt = now.minus(Duration.ofDays(1))))

        // when
        val count = aiGreetingJobRepository.countByStateAndSentAtGreaterThanEqual(
            AiGreetingState.SENT,
            now.minus(Duration.ofHours(1)),
        )

        // then
        assertThat(count).isEqualTo(1)
    }

    private fun sentJob(memberId: Long, aiMemberId: Long, sentAt: Instant) = AiGreetingJob(
        memberId = memberId,
        dueAt = sentAt,
        state = AiGreetingState.SENT,
        aiMemberId = aiMemberId,
        roomId = 1L,
        sentAt = sentAt,
    )

    private fun saveMember(
        gender: Gender,
        phoneNumber: String,
        signedUpAgo: Duration,
        noteReceiveEnabled: Boolean = true,
    ): Long {
        val member = memberRepository.saveAndFlush(
            Member(
                phoneNumber = phoneNumber,
                password = "encoded-password",
                gender = gender,
                nickname = phoneNumber.takeLast(10),
                birthYear = 1998,
                noteReceiveEnabled = noteReceiveEnabled,
            ),
        )
        entityManager.createNativeQuery("update member set created_at = :at where id = :id")
            .setParameter("at", Instant.now().minus(signedUpAgo))
            .setParameter("id", member.id)
            .executeUpdate()
        entityManager.clear()

        return member.id
    }

    private fun saveAi(
        gender: Gender,
        greetingEnabled: Boolean,
        latitude: Double = 37.5,
        longitude: Double = 127.0,
        enabled: Boolean = true,
        dailyGreetingLimit: Int = AiPersona.DEFAULT_DAILY_GREETING_LIMIT,
    ): Long {
        val member = memberRepository.saveAndFlush(
            Member(
                phoneNumber = Member.generateAiPhoneNumber(),
                password = "encoded-password",
                gender = gender,
                nickname = "ai${System.nanoTime() % 100_000}",
                birthYear = 1995,
                role = MemberRole.AI,
                latitude = latitude,
                longitude = longitude,
                locatedAt = Instant.now(),
            ),
        )
        aiPersonaRepository.saveAndFlush(
            AiPersona(
                memberId = member.id,
                enabled = enabled,
                systemPrompt = "프롬프트",
                greetingEnabled = greetingEnabled,
                dailyGreetingLimit = dailyGreetingLimit,
                nextLocationRefreshAt = Instant.now(),
            ),
        )

        return member.id
    }
}
