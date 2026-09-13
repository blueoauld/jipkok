package com.blueoauld.server.domain.member.service

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
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
class LocationGridTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `상세가 계산한 격자 좌표가 목록이 쓰는 DB 컬럼과 같다`() {
        // given
        val points = listOf(
            Point(37.51, 127.0),
            Point(37.5665, 126.978),
            Point(37.35389, -121.8906983),
            Point(-33.8688, 151.2093),
            Point(-0.001, -0.001),
            Point(90.0, 180.0),
            Point(-90.0, -180.0),
        )

        points.forEachIndexed { index, point ->
            // when
            val memberId = memberRepository.saveAndFlush(member(index, point)).id
            val stored = storedGrid(memberId)

            // then
            assertThat(stored).isEqualTo(Point(gridLatitude(point.latitude), gridLongitude(point.longitude)))
        }
    }

    @Test
    fun `같은 칸 안의 좌표는 같은 격자 좌표가 된다`() {
        // given

        // when
        val latitudes = listOf(37.5101, 37.5199).map { gridLatitude(it) }
        val longitudes = listOf(127.0001, 127.0099).map { gridLongitude(it) }

        // then
        assertThat(latitudes).containsOnly(37.515)
        assertThat(longitudes).containsOnly(127.005)
    }

    @Test
    fun `위도 90도와 경도 180도는 범위 안의 마지막 칸으로 모은다`() {
        // given

        // when
        val latitude = gridLatitude(90.0)
        val longitude = gridLongitude(180.0)

        // then
        assertThat(latitude).isEqualTo(89.995)
        assertThat(longitude).isEqualTo(179.995)
    }

    private fun storedGrid(memberId: Long): Point {
        val row = entityManager
            .createNativeQuery("select grid_latitude, grid_longitude from member where id = ?1")
            .setParameter(1, memberId)
            .singleResult as Array<*>

        return Point(row[0] as Double, row[1] as Double)
    }

    private fun member(index: Int, point: Point) = Member(
        phoneNumber = "+82109999100$index",
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "grid$index",
        birthYear = 1998,
    ).apply {
        latitude = point.latitude
        longitude = point.longitude
    }

    private data class Point(val latitude: Double, val longitude: Double)
}
