package com.blueoauld.server.global.monitoring.dto

enum class MonitoringRange(val start: String) {

    H3("-PT3H"),
    H12("-PT12H"),
    D1("-P1D"),
    D3("-P3D"),
    W1("-P7D"),
}
