"""Offline tests: public download metadata, unchanged data and failed refreshes."""
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import build_dataset as pipeline


class ProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="skilltide-provenance-")
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "input.csv"
        pipeline.FETCH_RECORDS.clear()

    def test_download_dates_survive_cache_reuse(self):
        with patch.object(pipeline.urllib.request, "urlopen", return_value=io.BytesIO(b"value\n1\n")) as request:
            pipeline.fetch("https://example.test/data.csv", self.path)
            original = pipeline.FETCH_RECORDS[str(self.path)]["downloadedAt"]
            pipeline.fetch("https://example.test/data.csv", self.path)
            self.assertEqual(request.call_count, 1)
        record = pipeline.FETCH_RECORDS[str(self.path)]
        self.assertEqual(record["downloadedAt"], original)
        self.assertEqual(record["access"], "cached")

    def test_old_or_modified_cache_has_unknown_download_date(self):
        self.path.write_text("old cache", encoding="utf-8")
        pipeline.fetch("https://example.test/data.csv", self.path)
        self.assertNotIn("downloadedAt", pipeline.FETCH_RECORDS[str(self.path)])
        self.path.with_suffix(".csv.download.json").write_text(json.dumps({"url": "https://example.test/data.csv", "downloadedAt": "2026-01-01", "sha256": "different"}))
        pipeline.fetch("https://example.test/data.csv", self.path)
        self.assertNotIn("downloadedAt", pipeline.FETCH_RECORDS[str(self.path)])

    def test_failed_refresh_preserves_previous_input(self):
        self.path.write_bytes(b"previous usable data")
        with patch.object(pipeline.urllib.request, "urlopen", side_effect=OSError("offline")), patch.object(pipeline.time, "sleep"):
            with self.assertRaises(RuntimeError):
                pipeline.fetch("https://example.test/data.csv", self.path, refresh=True)
        self.assertEqual(self.path.read_bytes(), b"previous usable data")
        self.assertNotIn(str(self.path), pipeline.FETCH_RECORDS)

    def test_fresh_metadata_does_not_count_as_substantive_change(self):
        data = {"generatedAt": "2026-01-01", "sources": {"sample": {"published": "2025", "retrieved": "2026-01-01"}}, "roles": [{"id": "example"}]}
        later = copy.deepcopy(data)
        later["generatedAt"] = "2026-10-22"
        later["refresh"] = {"builtAt": "2026-10-22"}
        later["sources"]["sample"]["retrieved"] = "2026-10-22"
        self.assertEqual(pipeline.content_hash(data), pipeline.content_hash(later))
        later["roles"].append({"id": "another"})
        self.assertNotEqual(pipeline.content_hash(data), pipeline.content_hash(later))

    def test_building_does_not_claim_a_validated_refresh(self):
        data = {"sources": {"sample": {"retrieved": "2026-10-22"}}, "roles": []}
        pipeline.attach_provenance(data, None)
        self.assertNotIn("retrieved", data["sources"]["sample"])
        self.assertNotIn("lastSuccessfulAt", data["refresh"])
        self.assertNotIn("validatedAt", data["refresh"])


if __name__ == "__main__":
    unittest.main()
