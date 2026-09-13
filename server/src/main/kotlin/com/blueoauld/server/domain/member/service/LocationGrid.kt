package com.blueoauld.server.domain.member.service

import kotlin.math.floor
import kotlin.math.min

private const val CELLS_PER_DEGREE = 100.0
private const val LAST_LATITUDE_CELL = 8999.0
private const val LAST_LONGITUDE_CELL = 17999.0
private const val CELL_CENTER = 0.5

fun gridLatitude(latitude: Double) = cellCenter(latitude, LAST_LATITUDE_CELL)

fun gridLongitude(longitude: Double) = cellCenter(longitude, LAST_LONGITUDE_CELL)

private fun cellCenter(degree: Double, lastCell: Double) =
    (min(floor(degree * CELLS_PER_DEGREE), lastCell) + CELL_CENTER) / CELLS_PER_DEGREE
