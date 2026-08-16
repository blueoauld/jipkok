package com.blueoauld.server.domain.member.service

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@Transactional
class SphericalDistanceTest {

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `상세의 거리가 목록이 쓰는 postgis 값과 같다`() {
        // given
        val pairs = listOf(
            Pair(Point(37.5665, 126.9780), Point(37.5674, 126.9780)),
            Pair(Point(37.5665, 126.9780), Point(37.5013, 127.0396)),
            Pair(Point(37.5665, 126.9780), Point(35.1796, 129.0756)),
            Pair(Point(33.4996, 126.5312), Point(38.2070, 128.5918)),
        )

        pairs.forEach { (me, target) ->
            // when
            val calculated = sphericalDistanceMeters(me.latitude, me.longitude, target.latitude, target.longitude)
            val postgis = distanceSphere(me, target)

            // then
            assertThat(calculated).isCloseTo(postgis, within(TOLERANCE_METERS))
        }
    }

    private fun distanceSphere(me: Point, target: Point) = entityManager
        .createNativeQuery("select st_distancesphere(st_makepoint(?1, ?2), st_makepoint(?3, ?4))")
        .setParameter(1, me.longitude)
        .setParameter(2, me.latitude)
        .setParameter(3, target.longitude)
        .setParameter(4, target.latitude)
        .singleResult as Double

    private data class Point(val latitude: Double, val longitude: Double)

    companion object {

        private const val TOLERANCE_METERS = 0.1
    }
}
