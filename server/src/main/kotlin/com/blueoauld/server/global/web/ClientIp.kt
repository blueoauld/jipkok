package com.blueoauld.server.global.web

import jakarta.servlet.http.HttpServletRequest

private const val CLOUDFLARE_IP_HEADER = "CF-Connecting-IP"

fun HttpServletRequest.clientIp(): String = getHeader(CLOUDFLARE_IP_HEADER)?.takeIf { it.isNotBlank() } ?: remoteAddr
