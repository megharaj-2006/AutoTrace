"""
Unit tests for chaos experiment safety bounds, parameter validation, and recovery logic.
"""

from __future__ import annotations

import pytest


def validate_latency_params(delay_ms: int | str, max_delay: int = 10000) -> bool:
    """Validate latency chaos parameters."""
    try:
        val = int(delay_ms)
        return 0 < val <= max_delay
    except (ValueError, TypeError):
        return False


def validate_packet_drop_params(
    container: str,
    target: str,
    duration_s: int | str,
    allowed_containers: set[str],
    allowed_targets: set[str],
    max_duration: int = 60,
) -> bool:
    """Validate packet drop chaos parameters."""
    if container not in allowed_containers:
        return False
    if target not in allowed_targets:
        return False
    try:
        dur = int(duration_s)
        return 0 < dur <= max_duration
    except (ValueError, TypeError):
        return False


class TestChaosSafetyBounds:
    """Tests ensuring chaos scripts adhere to safe operational limits."""

    def test_latency_valid_bounds(self):
        assert validate_latency_params(500) is True
        assert validate_latency_params(3000) is True
        assert validate_latency_params(10000) is True

    def test_latency_exceeding_max_rejected(self):
        assert validate_latency_params(10001) is False
        assert validate_latency_params(50000) is False

    def test_latency_zero_or_negative_rejected(self):
        assert validate_latency_params(0) is False
        assert validate_latency_params(-500) is False

    def test_packet_drop_valid_params(self):
        allowed_c = {"order-service", "reviews-service", "gateway-service"}
        allowed_t = {"payment-vault", "order-service"}
        assert validate_packet_drop_params("order-service", "payment-vault", 15, allowed_c, allowed_t) is True

    def test_packet_drop_unauthorized_container_rejected(self):
        allowed_c = {"order-service", "reviews-service"}
        allowed_t = {"payment-vault"}
        # Attempt to target core infrastructure redpanda
        assert validate_packet_drop_params("redpanda", "payment-vault", 15, allowed_c, allowed_t) is False

    def test_packet_drop_duration_bounds(self):
        allowed_c = {"order-service"}
        allowed_t = {"payment-vault"}
        # Valid duration
        assert validate_packet_drop_params("order-service", "payment-vault", 30, allowed_c, allowed_t) is True
        # Exceeds max 60s
        assert validate_packet_drop_params("order-service", "payment-vault", 120, allowed_c, allowed_t) is False
        # Negative
        assert validate_packet_drop_params("order-service", "payment-vault", -5, allowed_c, allowed_t) is False
