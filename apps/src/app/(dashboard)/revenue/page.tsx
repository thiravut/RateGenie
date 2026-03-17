"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  ButtonGroup,
  ProgressBar,
} from "react-bootstrap";

interface AnalyticsData {
  period: string;
  revenue: {
    before: { total: number; avgDaily: number };
    after: { total: number; avgDaily: number; projected: number };
    changePercent: number;
    changeDirection: string;
  };
  occupancy: {
    before: { average: number };
    after: { average: number };
    changePercent: number;
  };
  aiPerformance: {
    totalRecommendations: number;
    approved: number;
    rejected: number;
    expired: number;
    approvalRate: number;
    topRejectionReasons: { reason: string; label: string; count: number }[];
  };
}

function formatMoney(n: number): string {
  return n.toLocaleString("th-TH");
}

/** Pure CSS bar chart — two bars per row */
function ComparisonBar({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after: number;
}) {
  const max = Math.max(before, after, 1);
  const beforePct = (before / max) * 100;
  const afterPct = (after / max) * 100;

  return (
    <div className="mb-3">
      <div className="fw-semibold small mb-1">{label}</div>
      {/* Before bar */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <span
          className="text-muted"
          style={{ width: 40, fontSize: "0.75rem", flexShrink: 0 }}
        >
          ก่อน
        </span>
        <div
          style={{ flex: 1, background: "#e9ecef", borderRadius: 4, height: 22 }}
        >
          <div
            style={{
              width: `${beforePct}%`,
              background: "#adb5bd",
              borderRadius: 4,
              height: "100%",
              minWidth: beforePct > 0 ? 2 : 0,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span style={{ width: 100, fontSize: "0.75rem", textAlign: "right" }}>
          {formatMoney(before)} ฿
        </span>
      </div>
      {/* After bar */}
      <div className="d-flex align-items-center gap-2">
        <span
          className="text-muted"
          style={{ width: 40, fontSize: "0.75rem", flexShrink: 0 }}
        >
          หลัง
        </span>
        <div
          style={{ flex: 1, background: "#e9ecef", borderRadius: 4, height: 22 }}
        >
          <div
            style={{
              width: `${afterPct}%`,
              background:
                "linear-gradient(90deg, #0d6efd 0%, #198754 100%)",
              borderRadius: 4,
              height: "100%",
              minWidth: afterPct > 0 ? 2 : 0,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span style={{ width: 100, fontSize: "0.75rem", textAlign: "right" }}>
          {formatMoney(after)} ฿
        </span>
      </div>
    </div>
  );
}

/** CSS donut chart using conic-gradient */
function DonutChart({
  approvedPct,
  rejectedPct,
  expiredPct,
}: {
  approvedPct: number;
  rejectedPct: number;
  expiredPct: number;
}) {
  const a = approvedPct;
  const r = a + rejectedPct;
  // expiredPct fills the rest

  return (
    <div className="d-flex align-items-center gap-3">
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `conic-gradient(
            #198754 0% ${a}%,
            #dc3545 ${a}% ${r}%,
            #adb5bd ${r}% 100%
          )`,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Inner white circle to make it a donut */}
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "25%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: "#fff",
          }}
        />
      </div>
      <div className="small">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: 2,
              background: "#198754",
            }}
          />
          อนุมัติ {approvedPct.toFixed(1)}%
        </div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: 2,
              background: "#dc3545",
            }}
          />
          ปฏิเสธ {rejectedPct.toFixed(1)}%
        </div>
        <div className="d-flex align-items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: 2,
              background: "#adb5bd",
            }}
          />
          หมดอายุ {expiredPct.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export default function RevenuePage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30d" | "90d">("30d");

  const fetchAnalytics = useCallback(
    async (hId: string, p: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hotels/${hId}/analytics?period=${p}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load: get first hotel then fetch analytics
  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((d) => {
        if (!d.data?.[0]) {
          setLoading(false);
          return;
        }
        setHotelId(d.data[0].id);
        fetchAnalytics(d.data[0].id, period);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when period changes (after initial load)
  useEffect(() => {
    if (hotelId) {
      fetchAnalytics(hotelId, period);
    }
  }, [period, hotelId, fetchAnalytics]);

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  /* ---------- No data ---------- */
  if (!data) {
    return (
      <>
        <h4 className="mb-4">รายได้ & Analytics</h4>
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <p className="text-muted">ยังไม่มีข้อมูลเพียงพอ</p>
          </Card.Body>
        </Card>
      </>
    );
  }

  /* ---------- Computed helpers ---------- */
  const isUp = data.revenue.changeDirection === "up";
  const total = data.aiPerformance.totalRecommendations || 1;
  const approvedPct = (data.aiPerformance.approved / total) * 100;
  const rejectedPct = (data.aiPerformance.rejected / total) * 100;
  const expiredPct = (data.aiPerformance.expired / total) * 100;
  const maxRejection = Math.max(
    ...data.aiPerformance.topRejectionReasons.map((r) => r.count),
    1
  );

  return (
    <>
      {/* ========== HEADER ========== */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="mb-0">รายได้ & Analytics</h4>
        <div className="d-flex align-items-center gap-2">
          <ButtonGroup size="sm">
            <Button
              variant={period === "30d" ? "primary" : "outline-primary"}
              onClick={() => setPeriod("30d")}
            >
              30 วัน
            </Button>
            <Button
              variant={period === "90d" ? "primary" : "outline-primary"}
              onClick={() => setPeriod("90d")}
            >
              90 วัน
            </Button>
          </ButtonGroup>
          {hotelId && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() =>
                window.open(
                  `/api/hotels/${hotelId}/analytics/export?period=${period}`,
                  "_blank"
                )
              }
            >
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* ========== REVENUE COMPARISON ========== */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            {/* LEFT — Before */}
            <Col md={5}>
              <div
                className="p-3 rounded"
                style={{ background: "#f8f9fa" }}
              >
                <div className="text-muted small fw-semibold mb-2">
                  ก่อนใช้ระบบ
                </div>
                <h3 className="mb-1" style={{ fontFamily: "monospace" }}>
                  {formatMoney(data.revenue.before.total)} ฿
                </h3>
                <div className="text-muted small">
                  เฉลี่ย {formatMoney(data.revenue.before.avgDaily)} ฿/วัน
                </div>
                <div className="text-muted small">
                  Occupancy {data.occupancy.before.average}%
                </div>
              </div>
            </Col>

            {/* CENTER — Arrow + change */}
            <Col
              md={2}
              className="text-center py-3 d-flex flex-column align-items-center justify-content-center"
            >
              <div
                className={`fw-bold fs-4 ${isUp ? "text-success" : "text-danger"}`}
              >
                {isUp ? "+" : ""}
                {data.revenue.changePercent}%
              </div>
              <div
                style={{ fontSize: "2rem" }}
                className={isUp ? "text-success" : "text-danger"}
              >
                {isUp ? "\u2192" : "\u2192"}
              </div>
              <div className="text-muted small">
                Occupancy {isUp ? "+" : ""}
                {data.occupancy.changePercent}%
              </div>
            </Col>

            {/* RIGHT — After */}
            <Col md={5}>
              <div
                className="p-3 rounded"
                style={{
                  background: isUp
                    ? "rgba(25,135,84,0.08)"
                    : "rgba(220,53,69,0.08)",
                }}
              >
                <div className="text-muted small fw-semibold mb-2">
                  หลังใช้ระบบ
                </div>
                <h3
                  className={`mb-1 ${isUp ? "text-success" : "text-danger"}`}
                  style={{ fontFamily: "monospace" }}
                >
                  {formatMoney(data.revenue.after.total)} ฿
                </h3>
                <div className="text-muted small">
                  เฉลี่ย {formatMoney(data.revenue.after.avgDaily)} ฿/วัน
                </div>
                <div className="text-muted small">
                  Occupancy {data.occupancy.after.average}%
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ========== REVENUE BAR CHART ========== */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Card.Title className="mb-3">เปรียบเทียบรายได้</Card.Title>
          <ComparisonBar
            label="รายได้รวม"
            before={data.revenue.before.total}
            after={data.revenue.after.total}
          />
          <ComparisonBar
            label="รายได้เฉลี่ย/วัน"
            before={data.revenue.before.avgDaily}
            after={data.revenue.after.avgDaily}
          />
        </Card.Body>
      </Card>

      {/* ========== AI PERFORMANCE ========== */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Card.Title className="mb-3">AI Performance</Card.Title>

          <Row className="g-3 mb-4">
            {/* Donut chart */}
            <Col md={5} className="d-flex align-items-center justify-content-center">
              <DonutChart
                approvedPct={approvedPct}
                rejectedPct={rejectedPct}
                expiredPct={expiredPct}
              />
            </Col>

            {/* Stats */}
            <Col md={7}>
              <Row className="g-2">
                <Col xs={6}>
                  <div className="p-2 rounded" style={{ background: "#f8f9fa" }}>
                    <div className="text-muted small">คำแนะนำทั้งหมด</div>
                    <h5 className="mb-0">
                      {data.aiPerformance.totalRecommendations}
                    </h5>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="p-2 rounded" style={{ background: "#f8f9fa" }}>
                    <div className="text-muted small">อัตราอนุมัติ</div>
                    <h5 className="mb-0 text-success">
                      {data.aiPerformance.approvalRate}%
                    </h5>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-2 rounded" style={{ background: "#f8f9fa" }}>
                    <div className="text-muted small">อนุมัติ</div>
                    <h5 className="mb-0 text-success">
                      {data.aiPerformance.approved}
                    </h5>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-2 rounded" style={{ background: "#f8f9fa" }}>
                    <div className="text-muted small">ปฏิเสธ</div>
                    <h5 className="mb-0 text-danger">
                      {data.aiPerformance.rejected}
                    </h5>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-2 rounded" style={{ background: "#f8f9fa" }}>
                    <div className="text-muted small">หมดอายุ</div>
                    <h5 className="mb-0 text-secondary">
                      {data.aiPerformance.expired}
                    </h5>
                  </div>
                </Col>
              </Row>

              {/* Stacked progress bar */}
              <div className="mt-3">
                <ProgressBar style={{ height: 24 }}>
                  <ProgressBar
                    variant="success"
                    now={approvedPct}
                    key="approved"
                    label={`${approvedPct.toFixed(0)}%`}
                  />
                  <ProgressBar
                    variant="danger"
                    now={rejectedPct}
                    key="rejected"
                    label={`${rejectedPct.toFixed(0)}%`}
                  />
                  <ProgressBar
                    striped
                    variant="secondary"
                    now={expiredPct}
                    key="expired"
                    label={`${expiredPct.toFixed(0)}%`}
                  />
                </ProgressBar>
              </div>
            </Col>
          </Row>

          {/* Top rejection reasons */}
          {data.aiPerformance.topRejectionReasons.length > 0 && (
            <div className="mt-3">
              <div className="fw-semibold small mb-2">
                เหตุผลปฏิเสธหลัก
              </div>
              {data.aiPerformance.topRejectionReasons.map((r) => (
                <div key={r.reason} className="mb-2">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{r.label}</span>
                    <span className="text-muted">{r.count} ครั้ง</span>
                  </div>
                  <div
                    style={{
                      background: "#e9ecef",
                      borderRadius: 4,
                      height: 14,
                    }}
                  >
                    <div
                      style={{
                        width: `${(r.count / maxRejection) * 100}%`,
                        background: "#dc3545",
                        borderRadius: 4,
                        height: "100%",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ========== PROJECTED REVENUE ========== */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Card.Title className="mb-2">คาดการณ์รายได้</Card.Title>
          <p className="text-muted small mb-3">
            หากแนวโน้มปัจจุบันยังคงดำเนินต่อไป
          </p>
          <div className="d-flex align-items-end gap-2">
            <h2 className="mb-0 text-primary" style={{ fontFamily: "monospace" }}>
              {formatMoney(data.revenue.after.projected)} ฿
            </h2>
            <span className="text-muted small mb-1">/ เดือน (ประมาณการ)</span>
          </div>
          <div className="mt-2">
            <ProgressBar
              now={
                data.revenue.after.total > 0
                  ? Math.min(
                      (data.revenue.after.total / data.revenue.after.projected) *
                        100,
                      100
                    )
                  : 0
              }
              variant="primary"
              style={{ height: 10 }}
            />
            <div className="d-flex justify-content-between small text-muted mt-1">
              <span>
                รายได้ปัจจุบัน: {formatMoney(data.revenue.after.total)} ฿
              </span>
              <span>เป้าหมาย: {formatMoney(data.revenue.after.projected)} ฿</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
