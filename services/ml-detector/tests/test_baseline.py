from app.baseline import Baseline, build_baseline
from app.synth import benign_stream


def test_baseline_matrix_shape_and_edges(tmp_path):
    b = build_baseline(benign_stream(3000))
    adj = b.adjacency()
    assert adj.shape == (4, 4)
    assert adj.sum() == 4  # four authorised edges in the testbed
    i, j = b.index("reviews-service"), b.index("payment-vault")
    assert adj[i, j] == 0  # the lateral-movement edge is NOT authorised


def test_roundtrip(tmp_path):
    b = build_baseline(benign_stream(1000))
    p = tmp_path / "b.json"
    b.save(p)
    b2 = Baseline.load(p)
    assert b2.nodes == b.nodes
    assert (b2.counts == b.counts).all()
    assert b2.stats.keys() == b.stats.keys()
