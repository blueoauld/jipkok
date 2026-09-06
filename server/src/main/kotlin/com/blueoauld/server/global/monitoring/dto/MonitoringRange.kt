package com.blueoauld.server.global.monitoring.dto

import java.time.Duration

enum class MonitoringRange(val duration: Duration, val minPeriodSeconds: Int) {

    H3(Duration.ofHours(3), 60),
    H12(Duration.ofHours(12), 60),
    D1(Duration.ofDays(1), 300),
    D3(Duration.ofDays(3), 900),
    W1(Duration.ofDays(7), 3600),
}
