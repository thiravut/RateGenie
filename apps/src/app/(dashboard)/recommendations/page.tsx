"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Form,
  Modal,
  Alert,
  Spinner,
  Row,
  Col,
  Nav,
  ProgressBar,
} from "react-bootstrap";

interface Recommendation {
  id: string;
  roomType: { id: string; name: string };
  targetDate: string;
  currentPrice: number;
  recommendedPrice: number;
  changePercent: number;
  changeDirection: string;
  reason: string;
  status: string;
  rejectionReason: string | null;
  rejectionNote: string | null;
  decidedAt: string | null;
  decidedBy: { name: string } | null;
  createdAt: string;
}

interface Summary {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  approvalRate: number;
}

const REJECTION_REASONS = [
  { value: "LOCAL_EVENT", label: "มี local event" },
  { value: "PRICE_TOO_HIGH", label: "ราคาสูงเกินไป" },
  { value: "PRICE_TOO_LOW", label: "ราคาต่ำเกินไป" },
  { value: "MARKET_KNOWLEDGE", label: "มีข้อมูลตลาดที่ AI ไม่รู้" },
  { value: "OTHER", label: "อื่นๆ" },
];

const REJECTION_LABELS: Record<string, string> = {
  LOCAL_EVENT: "มี local event",
  PRICE_TOO_HIGH: "ราคาสูงเกินไป",
  PRICE_TOO_LOW: "ราคาต่ำเกินไป",
  MARKET_KNOWLEDGE: "มีข้อมูลตลาดที่ AI ไม่รู้",
  OTHER: "อื่นๆ",
};

const STATUS_TABS = [
  { key: "pending", label: "รอดำเนินการ" },
  { key: "approved", label: "อนุมัติแล้ว" },
  { key: "rejected", label: "ปฏิเสธแล้ว" },
  { key: "expired", label: "หมดอายุ" },
  { key: "all", label: "ทั้งหมด" },
];

function formatThaiDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatThaiDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number): string {
  return `฿${price.toLocaleString("th-TH")}`;
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reject modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("PRICE_TOO_HIGH");
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Hotel
  const [hotelId, setHotelId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.[0]) setHotelId(d.data[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchRecs = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations?status=${statusFilter}&limit=50`
      );
      const data = await res.json();
      setRecs(data.data ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [hotelId, statusFilter]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  async function handleApprove(recId: string) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/${recId}/approve`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      const pushInfo = data.push;
      if (pushInfo?.success) {
        setSuccess(`อนุมัติแล้ว — ราคา push ไป ${pushInfo.otaResults.length} OTA สำเร็จ`);
      } else if (pushInfo) {
        const ok = pushInfo.otaResults.filter((r: { success: boolean }) => r.success).length;
        const fail = pushInfo.otaResults.filter((r: { success: boolean }) => !r.success).length;
        setSuccess(`อนุมัติแล้ว — push สำเร็จ ${ok} OTA, ล้มเหลว ${fail} OTA`);
      } else {
        setSuccess("อนุมัติคำแนะนำเรียบร้อยแล้ว");
      }
      fetchRecs();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectId) return;
    if (rejectReason === "OTHER" && !rejectNote.trim()) {
      setError("กรุณาระบุหมายเหตุสำหรับเหตุผล 'อื่นๆ'");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/${rejectId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejectionReason: rejectReason,
            rejectionNote: rejectNote || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess("ปฏิเสธคำแนะนำเรียบร้อยแล้ว");
      setRejectId(null);
      setRejectReason("PRICE_TOO_HIGH");
      setRejectNote("");
      fetchRecs();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchApprove() {
    const pendingIds = recs
      .filter((r) => r.status === "pending")
      .map((r) => r.id);
    if (pendingIds.length === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/batch-approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommendationIds: pendingIds }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(data.message);
      fetchRecs();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  }

  // ── No hotel state ──
  if (!hotelId && !loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <Card className="border-0 shadow-sm text-center p-5" style={{ maxWidth: 420 }}>
          <Card.Body>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏨</div>
            <h5 className="mb-3">ยังไม่มีโรงแรม</h5>
            <p className="text-muted mb-0">
              กรุณาเพิ่มโรงแรมก่อนใช้งานคำแนะนำ AI
            </p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const pendingCount = recs.filter((r) => r.status === "pending").length;

  return (
    <>
      {/* ── Page Header ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">คำแนะนำราคาจาก AI</h4>
          <p className="text-muted mb-0 small">
            RateGenie วิเคราะห์ข้อมูลตลาดและแนะนำราคาที่เหมาะสมสำหรับโรงแรมของคุณ
          </p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-3">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")} className="mb-3">
          {success}
        </Alert>
      )}

      {/* ── Summary Bar ── */}
      {summary && (
        <Row className="g-3 mb-4">
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center py-3">
                <div className="text-muted small mb-1">รอดำเนินการ</div>
                <h2 className="mb-0 fw-bold" style={{ color: "#ed6c02" }}>
                  {summary.pending}
                </h2>
                <small className="text-muted">รายการ</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center py-3">
                <div className="text-muted small mb-1">อนุมัติวันนี้</div>
                <h2 className="mb-0 fw-bold text-success">{summary.approvedToday}</h2>
                <small className="text-muted">รายการ</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center py-3">
                <div className="text-muted small mb-1">ปฏิเสธวันนี้</div>
                <h2 className="mb-0 fw-bold text-danger">{summary.rejectedToday}</h2>
                <small className="text-muted">รายการ</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center py-3">
                <div className="text-muted small mb-1">อัตราอนุมัติ</div>
                <h2 className="mb-0 fw-bold" style={{ color: "#0d6efd" }}>
                  {summary.approvalRate}%
                </h2>
                <ProgressBar
                  now={summary.approvalRate}
                  variant={
                    summary.approvalRate >= 80
                      ? "success"
                      : summary.approvalRate >= 50
                        ? "primary"
                        : "warning"
                  }
                  style={{ height: 6, marginTop: 8 }}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── Filter Tabs + Batch Approve ── */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="py-2 px-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <Nav variant="pills" activeKey={statusFilter} onSelect={(k) => k && setStatusFilter(k)}>
              {STATUS_TABS.map((tab) => (
                <Nav.Item key={tab.key}>
                  <Nav.Link
                    eventKey={tab.key}
                    className="py-1 px-3"
                    style={{ fontSize: 14 }}
                  >
                    {tab.label}
                    {tab.key === "pending" && summary && summary.pending > 0 && (
                      <Badge bg="warning" text="dark" pill className="ms-2" style={{ fontSize: 11 }}>
                        {summary.pending}
                      </Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            {statusFilter === "pending" && pendingCount > 0 && (
              <Button
                variant="success"
                size="sm"
                onClick={handleBatchApprove}
                disabled={actionLoading}
                className="fw-semibold"
              >
                {actionLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    กำลังอนุมัติ...
                  </>
                ) : (
                  <>อนุมัติทั้งหมด ({pendingCount})</>
                )}
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ── Content ── */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">กำลังโหลดคำแนะนำ...</p>
        </div>
      ) : recs.length === 0 ? (
        /* ── Empty State ── */
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.6 }}>🤖</div>
            <h5 className="mb-2 text-muted">ไม่มีคำแนะนำในสถานะนี้</h5>
            <p className="text-muted mb-0" style={{ maxWidth: 360, margin: "0 auto" }}>
              {statusFilter === "pending"
                ? "AI กำลังวิเคราะห์ข้อมูลตลาดและอัตราเข้าพัก... คำแนะนำใหม่จะปรากฏที่นี่เร็วๆ นี้"
                : "ไม่พบรายการที่ตรงกับตัวกรองที่เลือก"}
            </p>
          </Card.Body>
        </Card>
      ) : (
        /* ── Recommendation Cards ── */
        <div className="d-flex flex-column gap-3">
          {recs.map((rec) => {
            const isUp = rec.changeDirection === "up";
            const isDown = rec.changeDirection === "down";
            const isPending = rec.status === "pending";
            const isApproved = rec.status === "approved";
            const isRejected = rec.status === "rejected";

            const borderColor = isApproved
              ? "#198754"
              : isRejected
                ? "#dc3545"
                : "transparent";

            return (
              <Card
                key={rec.id}
                className="border-0 shadow-sm"
                style={{
                  borderLeft: `4px solid ${borderColor}`,
                  transition: "box-shadow 0.15s ease",
                }}
              >
                <Card.Body className="p-3">
                  <Row className="align-items-center g-3">
                    {/* ── Left: Room Info ── */}
                    <Col xs={12} md={3}>
                      <h6 className="mb-1 fw-semibold">{rec.roomType.name}</h6>
                      <small className="text-muted">
                        {formatThaiDate(rec.targetDate)}
                      </small>
                      {isApproved && (
                        <div className="mt-2">
                          <Badge bg="success" className="me-1">อนุมัติแล้ว</Badge>
                          {rec.decidedBy && (
                            <small className="text-muted d-block mt-1">
                              โดย {rec.decidedBy.name}
                              {rec.decidedAt && ` - ${formatThaiDateTime(rec.decidedAt)}`}
                            </small>
                          )}
                        </div>
                      )}
                      {isRejected && (
                        <div className="mt-2">
                          <Badge bg="danger" className="me-1">ปฏิเสธแล้ว</Badge>
                          {rec.rejectionReason && (
                            <Badge bg="light" text="dark" className="ms-1" style={{ fontSize: 11 }}>
                              {REJECTION_LABELS[rec.rejectionReason] ?? rec.rejectionReason}
                            </Badge>
                          )}
                          {rec.rejectionNote && (
                            <small className="text-muted d-block mt-1 fst-italic">
                              &quot;{rec.rejectionNote}&quot;
                            </small>
                          )}
                          {rec.decidedBy && (
                            <small className="text-muted d-block mt-1">
                              โดย {rec.decidedBy.name}
                              {rec.decidedAt && ` - ${formatThaiDateTime(rec.decidedAt)}`}
                            </small>
                          )}
                        </div>
                      )}
                      {rec.status === "expired" && (
                        <div className="mt-2">
                          <Badge bg="secondary">หมดอายุ</Badge>
                        </div>
                      )}
                    </Col>

                    {/* ── Center: Price Visualization ── */}
                    <Col xs={12} md={isPending ? 5 : 9}>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        {/* Current Price */}
                        <div className="text-center">
                          <small className="text-muted d-block" style={{ fontSize: 11 }}>
                            ราคาปัจจุบัน
                          </small>
                          <span
                            className="fw-semibold"
                            style={{ fontSize: 18, color: "#6c757d" }}
                          >
                            {formatPrice(rec.currentPrice)}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div style={{ fontSize: 24 }}>
                          {isUp ? (
                            <span style={{ color: "#198754" }}>&#8599;</span>
                          ) : isDown ? (
                            <span style={{ color: "#dc3545" }}>&#8600;</span>
                          ) : (
                            <span style={{ color: "#6c757d" }}>&#8594;</span>
                          )}
                        </div>

                        {/* Recommended Price */}
                        <div className="text-center">
                          <small className="text-muted d-block" style={{ fontSize: 11 }}>
                            ราคาแนะนำ
                          </small>
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: 20,
                              color: isUp ? "#198754" : isDown ? "#dc3545" : "#212529",
                            }}
                          >
                            {formatPrice(rec.recommendedPrice)}
                          </span>
                        </div>

                        {/* Change Badge */}
                        <Badge
                          bg={isUp ? "success" : isDown ? "danger" : "secondary"}
                          style={{ fontSize: 13, padding: "6px 10px" }}
                        >
                          {isUp ? "+" : ""}
                          {rec.changePercent.toFixed(1)}%
                          {isUp ? " ↑" : isDown ? " ↓" : ""}
                        </Badge>
                      </div>

                      {/* AI Reasoning */}
                      <div
                        className="mt-2 fst-italic"
                        style={{
                          color: "#6c757d",
                          fontSize: 13,
                          lineHeight: 1.5,
                          borderTop: "1px solid #f0f0f0",
                          paddingTop: 8,
                        }}
                      >
                        💡 {rec.reason}
                      </div>
                    </Col>

                    {/* ── Right: Actions (pending only) ── */}
                    {isPending && (
                      <Col xs={12} md={4} className="text-md-end">
                        <div className="d-flex gap-2 justify-content-md-end">
                          <Button
                            variant="success"
                            onClick={() => handleApprove(rec.id)}
                            disabled={actionLoading}
                            className="fw-semibold px-4"
                          >
                            {actionLoading ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              "อนุมัติ"
                            )}
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => {
                              setRejectId(rec.id);
                              setRejectReason("PRICE_TOO_HIGH");
                              setRejectNote("");
                            }}
                            disabled={actionLoading}
                            className="fw-semibold px-4"
                          >
                            ปฏิเสธ
                          </Button>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Reject Modal ── */}
      <Modal show={!!rejectId} onHide={() => setRejectId(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5">
            ปฏิเสธคำแนะนำ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <p className="text-muted small mb-3">
            กรุณาเลือกเหตุผลที่ปฏิเสธ เพื่อช่วยให้ AI เรียนรู้และปรับปรุงคำแนะนำในอนาคต
          </p>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">เหตุผลในการปฏิเสธ *</Form.Label>
            <div className="d-flex flex-column gap-2 mt-1">
              {REJECTION_REASONS.map((r) => (
                <Form.Check
                  key={r.value}
                  type="radio"
                  id={`reject-reason-${r.value}`}
                  name="rejectionReason"
                  label={r.label}
                  value={r.value}
                  checked={rejectReason === r.value}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="py-1"
                />
              ))}
            </div>
          </Form.Group>

          <Form.Group>
            <Form.Label className="fw-semibold small">
              หมายเหตุเพิ่มเติม {rejectReason === "OTHER" && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="เช่น มีงาน Phuket Food Festival วันที่ 21-23 ทำให้ demand สูงกว่าปกติ"
              style={{ fontSize: 14 }}
            />
            <Form.Text className="text-muted">
              ข้อมูลนี้จะช่วยให้ AI เข้าใจบริบทท้องถิ่นได้ดีขึ้น
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            onClick={() => setRejectId(null)}
            className="px-4"
          >
            ยกเลิก
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            disabled={actionLoading || (rejectReason === "OTHER" && !rejectNote.trim())}
            className="px-4 fw-semibold"
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                กำลังดำเนินการ...
              </>
            ) : (
              "ยืนยันปฏิเสธ"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
