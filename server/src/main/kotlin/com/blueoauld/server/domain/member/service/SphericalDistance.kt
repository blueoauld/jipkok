package com.blueoauld.server.domain.member.service

import kotlin.math.acos
import kotlin.math.cos
import kotlin.math.sin

private const val EARTH_RADIUS_METERS = 6_371_008.8

fun sphericalDistanceMeters(
    latitude: Double,
    longitude: Double,
    otherLatitude: Double,
    otherLongitude: Double,
): Double {
    val cosine = cos(Math.toRadians(latitude)) * cos(Math.toRadians(otherLatitude)) *
            cos(Math.toRadians(otherLongitude) - Math.toRadians(longitude)) +
            sin(Math.toRadians(latitude)) * sin(Math.toRadians(otherLatitude))

    return EARTH_RADIUS_METERS * acos(cosine.coerceIn(-1.0, 1.0))
}
