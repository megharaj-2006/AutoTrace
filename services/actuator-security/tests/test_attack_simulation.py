"""
Unit tests for the lateral movement attack simulation and verification logic.
"""

from __future__ import annotations

import pytest


def evaluate_lateral_movement_outcome(
    pre_status: int | None,
    actuator_status: int | None,
    post_status: int | None,
) -> str:
    """
    Core decision logic mirroring trigger_lateral_exploit.sh:
    - PASS: pre is 200, actuator is 200, post is 502 or 504 (or connection error None).
    - FAIL: post is 200 (containment failed) or actuator is not 200.
    - INCONCLUSIVE: pre is not 200 or services were unreachable before test.
    """
    if pre_status is None or actuator_status is None:
        return "INCONCLUSIVE"

    if pre_status != 200:
        return "INCONCLUSIVE"

    if actuator_status != 200:
        return "FAIL"

    if post_status == 200:
        return "FAIL"

    if post_status in (502, 504) or post_status is None:
        return "PASS"

    return "INCONCLUSIVE"


class TestAttackSimulationLogic:
    """Tests evaluating lateral exploit verdict logic."""

    def test_successful_containment_verdict_pass(self):
        # reviews-service succeeds (200), actuator quarantines (200), post-call blocked (502)
        verdict = evaluate_lateral_movement_outcome(
            pre_status=200,
            actuator_status=200,
            post_status=502,
        )
        assert verdict == "PASS"

    def test_timeout_drop_verdict_pass(self):
        # reviews-service succeeds (200), actuator quarantines (200), post-call drops (504 / timeout)
        verdict = evaluate_lateral_movement_outcome(
            pre_status=200,
            actuator_status=200,
            post_status=504,
        )
        assert verdict == "PASS"

    def test_connection_severed_verdict_pass(self):
        # post-call completely refuses connection (post_status=None)
        verdict = evaluate_lateral_movement_outcome(
            pre_status=200,
            actuator_status=200,
            post_status=None,
        )
        assert verdict == "PASS"

    def test_containment_failed_verdict_fail(self):
        # post-call still succeeds (200) -> containment did NOT isolate
        verdict = evaluate_lateral_movement_outcome(
            pre_status=200,
            actuator_status=200,
            post_status=200,
        )
        assert verdict == "FAIL"

    def test_actuator_rejection_verdict_fail(self):
        # actuator failed or returned 500
        verdict = evaluate_lateral_movement_outcome(
            pre_status=200,
            actuator_status=500,
            post_status=200,
        )
        assert verdict == "FAIL"

    def test_pre_exploit_failure_verdict_inconclusive(self):
        # If reviews-service is already down before the test, we cannot prove containment
        verdict = evaluate_lateral_movement_outcome(
            pre_status=500,
            actuator_status=200,
            post_status=502,
        )
        assert verdict == "INCONCLUSIVE"

    def test_unreachable_prerequisite_verdict_inconclusive(self):
        verdict = evaluate_lateral_movement_outcome(
            pre_status=None,
            actuator_status=None,
            post_status=None,
        )
        assert verdict == "INCONCLUSIVE"
