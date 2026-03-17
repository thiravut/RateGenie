"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Alert,
  ProgressBar,
  Spinner,
} from "react-bootstrap";
import Link from "next/link";

/* ───────────────────── Types ───────────────────── */

interface DashboardData {
  hotel: { id: string; name: string };
  occupancy: {
    today: number;
    forecast7Days: { date: string; occupancy: number }[];
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
    changeDirection: string;
  };
  recommendations: {
    pending: number;
    approvedToday: number;
    approvalRate: number;
  };
  syncStatus: {
    overallStatus: string;
    connections: {
      otaName: string;
      status: string;
      lastSyncAt: string | null;
      nextSyncAt?: string | null;
    }[];
  };
}

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
}

/* ───────────────────── Helpers ───────────────────── */

function formatPrice(n: number): string {
  return "฿" + n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function occupancyColor(pct: number): string {
  if (pct > 70) return "var(--rg-success)";
  if (pct >= 50) return "var(--rg-warning)";
  return "var(--rg-danger)";
}

function occupancyBg(pct: number): string {
  if (pct > 70) return "var(--rg-success-light)";
  if (pct >= 50) return "var(--rg-warning-light)";
  return "var(--rg-danger-light)";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "ยังไม่เคย sync";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function countdownTime(iso: string | null | undefined): string {
  if (!iso) return "–";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "กำลัง sync...";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `อีก ${mins} นาที`;
  return `อีก ${Math.floor(mins / 60)} ชม.`;
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

/* ───────────────────── Component ───────────────────── */

export default function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  // Step 1: fetch hotel list
  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.[0]) setHotelId(d.data[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Step 2: fetch dashboard + pending recommendations
  const fetchAll = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const [dashRes, recRes] = await Promise.all([
        fetch(`/api/hotels/${hotelId}/dashboard`),
        fetch(`/api/hotels/${hotelId}/recommendations?status=pending&limit=3`),
      ]);
      const dashData = await dashRes.json();
      const recData = await recRes.json();
      setData(dashData);
      setRecs(recData.data ?? []);
    } catch {
      // silent — cards will show empty state
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Actions
  async function handleApprove(recId: string) {
    setActionLoading(recId);
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/${recId}/approve`,
        { method: "POST" }
      );
      if (res.ok) {
        setToast({ type: "success", msg: "อนุมัติแล้ว" });
        fetchAll();
      } else {
        const d = await res.json();
        setToast({ type: "danger", msg: d.error ?? "เกิดข้อผิดพลาด" });
      }
    } catch {
      setToast({ type: "danger", msg: "เกิดข้อผิดพลาด" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(recId: string) {
    setActionLoading(recId);
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/${recId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason: "OTHER" }),
        }
      );
      if (res.ok) {
        setToast({ type: "success", msg: "ปฏิเสธแล้ว" });
        fetchAll();
      } else {
        const d = await res.json();
        setToast({ type: "danger", msg: d.error ?? "เกิดข้อผิดพลาด" });
      }
    } catch {
      setToast({ type: "danger", msg: "เกิดข้อผิดพลาด" });
    } finally {
      setActionLoading(null);
    }
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--rg-primary)" }} />
        <div className="text-muted mt-2">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  /* ─── Empty state ─── */
  if (!data) {
    return (
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏨</div>
          <p className="text-muted mb-3">ยังไม่มีโรงแรม กรุณาเพิ่มโรงแรมเพื่อเริ่มใช้งาน</p>
          <Link href="/hotels" className="btn btn-primary">
            เพิ่มโรงแรม
          </Link>
        </Card.Body>
      </Card>
    );
  }

  /* ─── Derived values ─── */
  const occ = data.occupancy;
  const rev = data.revenue;
  const rec = data.recommendations;
  const sync = data.syncStatus;
  const trendUp = rev.changeDirection === "up";

  // Revenue comparison bar heights
  const maxRev = Math.max(rev.thisMonth, rev.lastMonth, 1);

  return (
    <>
      {/* Toast */}
      {toast && (
        <Alert
          variant={toast.type}
          dismissible
          onClose={() => setToast(null)}
          className="position-fixed top-0 end-0 m-3"
          style={{ zIndex: 9999, minWidth: 260 }}
        >
          {toast.msg}
        </Alert>
      )}

      {/* ━━━ Header bar ━━━ */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between mb-4 p-3 rounded"
        style={{
          background: "linear-gradient(135deg, var(--rg-primary), var(--rg-primary-dark))",
          color: "#fff",
        }}
      >
        <div>
          <h4 className="mb-0 fw-bold">{data.hotel.name}</h4>
          <small style={{ opacity: 0.85 }}>
            {new Date().toLocaleDateString("th-TH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </small>
        </div>
        <div className="d-flex gap-3 mt-2 mt-md-0">
          <div className="text-center">
            <div style={{ fontSize: 12, opacity: 0.8 }}>อัตราอนุมัติ</div>
            <div className="fw-bold">{rec.approvalRate}%</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: 12, opacity: 0.8 }}>อนุมัติวันนี้</div>
            <div className="fw-bold">{rec.approvedToday}</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: 12, opacity: 0.8 }}>OTA เชื่อมต่อ</div>
            <div className="fw-bold">{sync.connections.length}</div>
          </div>
        </div>
      </div>

      {/* ━━━ 4 KPI Cards ━━━ */}
      <Row className="g-3 mb-4">
        {/* 1. Occupancy วันนี้ */}
        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-muted small mb-1">Occupancy วันนี้</div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <h2 className="mb-0 fw-bold" style={{ color: occupancyColor(occ.today) }}>
                  {occ.today}%
                </h2>
              </div>
              <ProgressBar
                now={occ.today}
                style={{ height: 8, backgroundColor: "var(--rg-gray-100)" }}
              >
                <ProgressBar
                  now={occ.today}
                  style={{ backgroundColor: occupancyColor(occ.today) }}
                />
              </ProgressBar>
              <small className="text-muted mt-auto pt-2">
                {occ.today > 70
                  ? "ดีมาก"
                  : occ.today >= 50
                    ? "ปานกลาง"
                    : "ต่ำ — ควรปรับราคา"}
              </small>
            </Card.Body>
          </Card>
        </Col>

        {/* 2. รายได้เดือนนี้ */}
        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-muted small mb-1">รายได้เดือนนี้</div>
              <h2 className="mb-0 fw-bold font-mono">{formatPrice(rev.thisMonth)}</h2>
              <div className="mt-1">
                <span
                  className="fw-semibold"
                  style={{ color: trendUp ? "var(--rg-success)" : "var(--rg-danger)" }}
                >
                  {trendUp ? "▲" : "▼"} {trendUp ? "+" : ""}
                  {rev.changePercent}%
                </span>
                <span className="text-muted small ms-1">vs เดือนก่อน</span>
              </div>
              <small className="text-muted mt-auto pt-2">
                เดือนก่อน: {formatPrice(rev.lastMonth)}
              </small>
            </Card.Body>
          </Card>
        </Col>

        {/* 3. คำแนะนำ AI รอดำเนินการ */}
        <Col xs={6} lg={3}>
          <Link href="/recommendations" className="text-decoration-none">
            <Card
              className="border-0 shadow-sm h-100"
              style={{
                borderLeft: `4px solid var(--rg-info) !important`,
                borderLeftWidth: 4,
                borderLeftStyle: "solid",
                borderLeftColor: "var(--rg-info)",
              }}
            >
              <Card.Body className="d-flex flex-column">
                <div className="text-muted small mb-1">คำแนะนำ AI รอดำเนินการ</div>
                <h2
                  className="mb-0 fw-bold"
                  style={{ color: rec.pending > 0 ? "var(--rg-info)" : "var(--rg-gray-500)" }}
                >
                  {rec.pending}
                </h2>
                <small className="text-muted mt-auto pt-2">
                  {rec.pending > 0 ? "คลิกเพื่อดูรายละเอียด →" : "ไม่มีคำแนะนำค้างอยู่"}
                </small>
              </Card.Body>
            </Card>
          </Link>
        </Col>

        {/* 4. OTA Status */}
        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-muted small mb-1">OTA Status</div>
              <div className="mb-1">
                <Badge
                  pill
                  bg=""
                  style={{
                    fontSize: 14,
                    padding: "6px 14px",
                    backgroundColor:
                      sync.overallStatus === "healthy"
                        ? "var(--rg-success)"
                        : sync.overallStatus === "degraded"
                          ? "var(--rg-warning)"
                          : "var(--rg-gray-500)",
                  }}
                >
                  {sync.overallStatus === "healthy"
                    ? "ปกติ"
                    : sync.overallStatus === "degraded"
                      ? "มีปัญหา"
                      : "ยังไม่เชื่อมต่อ"}
                </Badge>
              </div>
              <small className="text-muted mt-auto pt-2">
                {sync.connections.length} OTA เชื่อมต่อ
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ━━━ Charts Row ━━━ */}
      <Row className="g-3 mb-4">
        {/* 5. Occupancy 7-day forecast */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-bold">Occupancy 7 วันข้างหน้า</h6>
                <small className="text-muted">คาดการณ์โดย AI</small>
              </div>
              <div className="d-flex flex-column gap-2">
                {occ.forecast7Days.map((d) => {
                  const dayName = new Date(d.date).toLocaleDateString("th-TH", {
                    weekday: "short",
                  });
                  const fullDate = new Date(d.date).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                  });
                  const weekend = isWeekend(d.date);
                  return (
                    <div
                      key={d.date}
                      className="d-flex align-items-center gap-2"
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        backgroundColor: weekend ? "var(--rg-primary-light)" : "transparent",
                      }}
                    >
                      <div
                        style={{ width: 70, flexShrink: 0 }}
                        className="small"
                      >
                        <span className={`fw-semibold ${weekend ? "" : ""}`}>
                          {dayName}
                        </span>{" "}
                        <span className="text-muted">{fullDate}</span>
                      </div>
                      {weekend && (
                        <Badge
                          bg=""
                          style={{
                            fontSize: 9,
                            backgroundColor: "var(--rg-primary)",
                            flexShrink: 0,
                          }}
                        >
                          วันหยุด
                        </Badge>
                      )}
                      <div className="flex-grow-1" style={{ height: 24, position: "relative" }}>
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: occupancyBg(d.occupancy),
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${d.occupancy}%`,
                              height: "100%",
                              backgroundColor: occupancyColor(d.occupancy),
                              borderRadius: 4,
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                      <div
                        className="fw-bold text-end"
                        style={{
                          width: 44,
                          flexShrink: 0,
                          fontSize: 13,
                          color: occupancyColor(d.occupancy),
                        }}
                      >
                        {d.occupancy}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 6. Revenue trend mini-chart */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <h6 className="mb-3 fw-bold">เปรียบเทียบรายได้</h6>
              <div className="d-flex align-items-end justify-content-center gap-4 flex-grow-1">
                {/* Last month bar */}
                <div className="text-center">
                  <div className="small text-muted mb-1">{formatPrice(rev.lastMonth)}</div>
                  <div
                    style={{
                      width: 56,
                      height: `${Math.max((rev.lastMonth / maxRev) * 140, 20)}px`,
                      backgroundColor: "var(--rg-gray-300)",
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.6s ease",
                    }}
                  />
                  <div className="small text-muted mt-1">เดือนก่อน</div>
                </div>
                {/* This month bar */}
                <div className="text-center">
                  <div className="small fw-semibold mb-1" style={{ color: trendUp ? "var(--rg-success)" : "var(--rg-danger)" }}>
                    {formatPrice(rev.thisMonth)}
                  </div>
                  <div
                    style={{
                      width: 56,
                      height: `${Math.max((rev.thisMonth / maxRev) * 140, 20)}px`,
                      backgroundColor: trendUp ? "var(--rg-success)" : "var(--rg-danger)",
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.6s ease",
                    }}
                  />
                  <div className="small text-muted mt-1">เดือนนี้</div>
                </div>
              </div>
              <div className="text-center mt-3">
                <Badge
                  bg=""
                  style={{
                    fontSize: 13,
                    padding: "5px 12px",
                    backgroundColor: trendUp ? "var(--rg-success-light)" : "var(--rg-danger-light)",
                    color: trendUp ? "var(--rg-success)" : "var(--rg-danger)",
                  }}
                >
                  {trendUp ? "▲" : "▼"} {trendUp ? "+" : ""}
                  {rev.changePercent}% จากเดือนก่อน
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ━━━ AI Recommendations Preview ━━━ */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-bold">
              คำแนะนำ AI ล่าสุด
              {rec.pending > 0 && (
                <Badge
                  bg=""
                  className="ms-2"
                  style={{
                    fontSize: 11,
                    backgroundColor: "var(--rg-info-light)",
                    color: "var(--rg-info)",
                    verticalAlign: "middle",
                  }}
                >
                  {rec.pending} รายการรอดำเนินการ
                </Badge>
              )}
            </h6>
            <Link
              href="/recommendations"
              className="text-decoration-none small fw-semibold"
              style={{ color: "var(--rg-primary)" }}
            >
              ดูทั้งหมด →
            </Link>
          </div>

          {recs.length === 0 ? (
            <div
              className="text-center py-4 rounded"
              style={{ backgroundColor: "var(--rg-gray-100)" }}
            >
              <div className="text-muted">ไม่มีคำแนะนำที่รอดำเนินการ</div>
              <small className="text-muted">
                AI จะสร้างคำแนะนำใหม่เมื่อมีข้อมูลเพียงพอ
              </small>
            </div>
          ) : (
            <Row className="g-3">
              {recs.map((r) => {
                const isUp = r.changeDirection === "up";
                const priceColor = isUp ? "var(--rg-success)" : "var(--rg-danger)";
                const priceBg = isUp ? "var(--rg-success-light)" : "var(--rg-danger-light)";
                const arrow = isUp ? "↑" : "↓";
                return (
                  <Col md={4} key={r.id}>
                    <div
                      className="p-3 rounded h-100 d-flex flex-column"
                      style={{
                        backgroundColor: "var(--rg-gray-100)",
                        border: "1px solid var(--rg-gray-300)",
                      }}
                    >
                      {/* Room + date */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-semibold">{r.roomType.name}</div>
                          <small className="text-muted">
                            {new Date(r.targetDate).toLocaleDateString("th-TH", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </small>
                        </div>
                        <Badge
                          bg=""
                          style={{
                            backgroundColor: priceBg,
                            color: priceColor,
                            fontSize: 12,
                          }}
                        >
                          {arrow} {isUp ? "+" : ""}
                          {r.changePercent.toFixed(1)}%
                        </Badge>
                      </div>

                      {/* Prices */}
                      <div className="mb-2">
                        <span className="font-mono text-muted" style={{ textDecoration: "line-through", fontSize: 13 }}>
                          {formatPrice(r.currentPrice)}
                        </span>
                        <span className="mx-1">→</span>
                        <span className="font-mono fw-bold" style={{ color: priceColor, fontSize: 16 }}>
                          {formatPrice(r.recommendedPrice)}
                        </span>
                      </div>

                      {/* Reason */}
                      <small className="text-muted mb-3 flex-grow-1">
                        {r.reason}
                      </small>

                      {/* Actions */}
                      <div className="d-flex gap-2 mt-auto">
                        <Button
                          size="sm"
                          variant=""
                          className="flex-fill"
                          style={{
                            backgroundColor: "var(--rg-success)",
                            borderColor: "var(--rg-success)",
                            color: "#fff",
                          }}
                          disabled={actionLoading === r.id}
                          onClick={() => handleApprove(r.id)}
                        >
                          {actionLoading === r.id ? "..." : "อนุมัติ"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          className="flex-fill"
                          disabled={actionLoading === r.id}
                          onClick={() => handleReject(r.id)}
                        >
                          ปฏิเสธ
                        </Button>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* ━━━ OTA Sync Status ━━━ */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-bold">สถานะการเชื่อมต่อ OTA</h6>
            <Badge
              bg=""
              pill
              style={{
                backgroundColor:
                  sync.overallStatus === "healthy"
                    ? "var(--rg-success-light)"
                    : sync.overallStatus === "degraded"
                      ? "var(--rg-warning-light)"
                      : "var(--rg-gray-100)",
                color:
                  sync.overallStatus === "healthy"
                    ? "var(--rg-success)"
                    : sync.overallStatus === "degraded"
                      ? "var(--rg-warning)"
                      : "var(--rg-gray-500)",
              }}
            >
              {sync.overallStatus === "healthy"
                ? "ระบบปกติ"
                : sync.overallStatus === "degraded"
                  ? "มีปัญหาบางส่วน"
                  : "ยังไม่เชื่อมต่อ"}
            </Badge>
          </div>

          {sync.connections.length === 0 ? (
            <div
              className="text-center py-3 rounded"
              style={{ backgroundColor: "var(--rg-gray-100)" }}
            >
              <div className="text-muted">ยังไม่ได้เชื่อมต่อ OTA</div>
              <Link
                href="/hotels"
                className="small text-decoration-none"
                style={{ color: "var(--rg-primary)" }}
              >
                ตั้งค่าการเชื่อมต่อ →
              </Link>
            </div>
          ) : (
            <Row className="g-3">
              {sync.connections.map((conn) => {
                const connected = conn.status === "connected";
                return (
                  <Col sm={6} key={conn.otaName}>
                    <div
                      className="d-flex align-items-center p-3 rounded"
                      style={{
                        backgroundColor: connected
                          ? "var(--rg-success-light)"
                          : "var(--rg-danger-light)",
                        border: `1px solid ${connected ? "var(--rg-success)" : "var(--rg-danger)"}`,
                        borderLeftWidth: 4,
                      }}
                    >
                      {/* OTA icon placeholder */}
                      <div
                        className="d-flex align-items-center justify-content-center rounded me-3"
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: connected ? "var(--rg-success)" : "var(--rg-danger)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {conn.otaName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold">{conn.otaName}</span>
                          <Badge
                            bg=""
                            pill
                            style={{
                              fontSize: 10,
                              backgroundColor: connected ? "var(--rg-success)" : "var(--rg-danger)",
                            }}
                          >
                            {connected ? "เชื่อมต่อแล้ว" : "มีปัญหา"}
                          </Badge>
                        </div>
                        <div className="d-flex gap-3 mt-1">
                          <small className="text-muted">
                            Sync ล่าสุด: {relativeTime(conn.lastSyncAt)}
                          </small>
                          {conn.nextSyncAt && (
                            <small className="text-muted">
                              ถัดไป: {countdownTime(conn.nextSyncAt)}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
