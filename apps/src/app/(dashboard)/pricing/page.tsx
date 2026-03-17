"use client";

import { useState, useEffect, useMemo, CSSProperties } from "react";
import {
  Card,
  Table,
  Badge,
  Spinner,
  Nav,
  Row,
  Col,
  ButtonGroup,
  Button,
} from "react-bootstrap";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OtaPrice {
  price: number;
  syncedAt: string;
}

interface DayPrice {
  date: string;
  otas: Record<string, OtaPrice>;
  hasPriceDifference: boolean;
}

interface RoomType {
  id: string;
  name: string;
  prices: DayPrice[];
}

interface PriceData {
  dateRange: { from: string; to: string };
  roomTypes: RoomType[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const OTA_META: Record<string, { label: string; color: string }> = {
  agoda: { label: "Agoda", color: "#FF5A00" },
  booking: { label: "Booking.com", color: "#003580" },
};

/** Format price as ฿X,XXX */
function fmtPrice(n: number | undefined | null): string {
  if (n == null) return "—";
  return `฿${n.toLocaleString("th-TH")}`;
}

/** Thai short day + date, e.g. "จ. 17 มี.ค." */
function fmtThaiDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

/** Check if a date falls on weekend (Sat/Sun) */
function isWeekend(iso: string): boolean {
  const day = new Date(iso + "T00:00:00").getDay();
  return day === 0 || day === 6;
}

/** Compute price difference (amount & percentage) between two OTA prices */
function priceDiff(
  a: number | undefined,
  b: number | undefined
): { amount: number; pct: number } | null {
  if (a == null || b == null) return null;
  const amount = Math.abs(a - b);
  if (amount === 0) return null;
  const base = Math.min(a, b);
  const pct = base > 0 ? (amount / base) * 100 : 0;
  return { amount, pct };
}

/* ------------------------------------------------------------------ */
/*  Inline styles (supplement Bootstrap)                               */
/* ------------------------------------------------------------------ */

const styles: Record<string, CSSProperties> = {
  mono: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  weekendRow: { backgroundColor: "#f8f9fa" },
  diffRow: { backgroundColor: "#fff8e1" },
  diffRowHigh: { backgroundColor: "#fff3e0" },
  barContainer: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  barLabel: { width: 90, fontSize: "0.8rem", textAlign: "right" as const },
  barTrack: {
    flex: 1,
    height: 18,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative" as const,
  },
  barPrice: {
    fontSize: "0.75rem",
    width: 70,
    textAlign: "right" as const,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Summary cards at top */
function SummaryCards({ roomTypes }: { roomTypes: RoomType[] }) {
  const stats = useMemo(() => {
    let matched = 0;
    let mismatched = 0;
    const otaTotals: Record<string, { sum: number; count: number }> = {};

    for (const rt of roomTypes) {
      for (const p of rt.prices) {
        if (p.hasPriceDifference) mismatched++;
        else matched++;

        for (const [key, val] of Object.entries(p.otas)) {
          if (!otaTotals[key]) otaTotals[key] = { sum: 0, count: 0 };
          otaTotals[key].sum += val.price;
          otaTotals[key].count += 1;
        }
      }
    }

    const otaAvgs = Object.entries(otaTotals).map(([key, v]) => ({
      key,
      label: OTA_META[key]?.label ?? key,
      avg: v.count > 0 ? Math.round(v.sum / v.count) : 0,
    }));
    otaAvgs.sort((a, b) => b.avg - a.avg);

    return { matched, mismatched, otaAvgs };
  }, [roomTypes]);

  const total = stats.matched + stats.mismatched;
  const matchPct = total > 0 ? Math.round((stats.matched / total) * 100) : 0;

  return (
    <Row className="g-3 mb-4">
      {/* Parity score */}
      <Col xs={12} md={4}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="text-center">
            <div className="text-muted small mb-1">Rate Parity Score</div>
            <div
              className="fw-bold mb-2"
              style={{ fontSize: "2.5rem", color: matchPct >= 80 ? "#198754" : "#dc3545" }}
            >
              {matchPct}%
            </div>
            <div className="d-flex justify-content-center gap-4">
              <span>
                <span
                  className="d-inline-block rounded-circle me-1"
                  style={{ width: 10, height: 10, backgroundColor: "#198754" }}
                />
                <strong className="text-success">{stats.matched}</strong>{" "}
                <span className="text-muted small">วันตรงกัน</span>
              </span>
              <span>
                <span
                  className="d-inline-block rounded-circle me-1"
                  style={{ width: 10, height: 10, backgroundColor: "#dc3545" }}
                />
                <strong className="text-danger">{stats.mismatched}</strong>{" "}
                <span className="text-muted small">วันไม่ตรง</span>
              </span>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/* Highest avg OTA */}
      <Col xs={12} md={4}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="text-center">
            <div className="text-muted small mb-1">OTA ราคาเฉลี่ยสูงสุด</div>
            {stats.otaAvgs[0] && (
              <>
                <div className="fw-bold fs-4" style={{ color: OTA_META[stats.otaAvgs[0].key]?.color }}>
                  {stats.otaAvgs[0].label}
                </div>
                <div style={styles.mono} className="text-muted">
                  เฉลี่ย {fmtPrice(stats.otaAvgs[0].avg)} / คืน
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Col>

      {/* Lowest avg OTA */}
      <Col xs={12} md={4}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Body className="text-center">
            <div className="text-muted small mb-1">OTA ราคาเฉลี่ยต่ำสุด</div>
            {stats.otaAvgs.length > 1 && stats.otaAvgs[stats.otaAvgs.length - 1] && (
              <>
                <div
                  className="fw-bold fs-4"
                  style={{
                    color:
                      OTA_META[stats.otaAvgs[stats.otaAvgs.length - 1].key]?.color,
                  }}
                >
                  {stats.otaAvgs[stats.otaAvgs.length - 1].label}
                </div>
                <div style={styles.mono} className="text-muted">
                  เฉลี่ย {fmtPrice(stats.otaAvgs[stats.otaAvgs.length - 1].avg)} / คืน
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

/** Horizontal bar chart comparing OTA prices for a room type */
function PriceBarChart({ prices }: { prices: DayPrice[] }) {
  const maxPrice = useMemo(() => {
    let m = 0;
    for (const p of prices) {
      for (const val of Object.values(p.otas)) {
        if (val.price > m) m = val.price;
      }
    }
    return m || 1;
  }, [prices]);

  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body>
        <h6 className="mb-3 text-muted">เปรียบเทียบราคารายวัน</h6>
        {prices.map((p) => (
          <div key={p.date} className="mb-2">
            <div className="text-muted small mb-1">{fmtThaiDate(p.date)}</div>
            {Object.entries(OTA_META).map(([key, meta]) => {
              const price = p.otas[key]?.price;
              const widthPct = price != null ? (price / maxPrice) * 100 : 0;
              return (
                <div key={key} style={styles.barContainer}>
                  <div style={styles.barLabel}>{meta.label}</div>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        width: `${widthPct}%`,
                        height: "100%",
                        backgroundColor: meta.color,
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <div style={styles.barPrice}>{fmtPrice(price)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </Card.Body>
    </Card>
  );
}

/** Rate parity table for a single room type */
function RoomRateTable({ room }: { room: RoomType }) {
  return (
    <>
      <Card className="border-0 shadow-sm mb-3">
        <div className="table-responsive">
          <Table hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 120 }}>วันที่</th>
                <th className="text-end" style={{ minWidth: 110 }}>
                  <span style={{ color: OTA_META.agoda.color, fontWeight: 700 }}>
                    Agoda
                  </span>
                </th>
                <th className="text-end" style={{ minWidth: 110 }}>
                  <span style={{ color: OTA_META.booking.color, fontWeight: 700 }}>
                    Booking.com
                  </span>
                </th>
                <th className="text-end" style={{ minWidth: 100 }}>
                  ส่วนต่าง
                </th>
                <th style={{ minWidth: 140 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {room.prices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    ไม่พบข้อมูลราคา
                  </td>
                </tr>
              ) : (
                room.prices.map((p) => {
                  const agodaPrice = p.otas.agoda?.price;
                  const bookingPrice = p.otas.booking?.price;
                  const diff = priceDiff(agodaPrice, bookingPrice);
                  const weekend = isWeekend(p.date);

                  let rowStyle: CSSProperties = {};
                  if (p.hasPriceDifference && diff && diff.pct >= 5) {
                    rowStyle = styles.diffRowHigh;
                  } else if (p.hasPriceDifference) {
                    rowStyle = styles.diffRow;
                  } else if (weekend) {
                    rowStyle = styles.weekendRow;
                  }

                  return (
                    <tr key={p.date} style={rowStyle}>
                      <td>
                        <span className="fw-medium">{fmtThaiDate(p.date)}</span>
                        {weekend && (
                          <span className="text-muted ms-1" style={{ fontSize: "0.7rem" }}>
                            วันหยุด
                          </span>
                        )}
                      </td>
                      <td className="text-end" style={styles.mono}>
                        {fmtPrice(agodaPrice)}
                      </td>
                      <td className="text-end" style={styles.mono}>
                        {fmtPrice(bookingPrice)}
                      </td>
                      <td className="text-end" style={styles.mono}>
                        {diff ? (
                          <span className="text-danger">
                            {fmtPrice(diff.amount)}{" "}
                            <span className="text-muted small">
                              ({diff.pct.toFixed(1)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {p.hasPriceDifference && diff ? (
                          <Badge
                            pill
                            bg="warning"
                            text="dark"
                            style={{ fontSize: "0.78rem" }}
                          >
                            ⚠️ ราคาต่าง {diff.pct.toFixed(1)}%
                          </Badge>
                        ) : (
                          <Badge
                            pill
                            bg="success"
                            style={{ fontSize: "0.78rem" }}
                          >
                            ✅ ตรงกัน
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Bar chart visualization */}
      {room.prices.length > 0 && <PriceBarChart prices={room.prices} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

type RangeKey = "7" | "14" | "30";

export default function PricingPage() {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("7");
  const [activeTab, setActiveTab] = useState<string>("");

  /* Fetch data */
  useEffect(() => {
    setLoading(true);
    fetch("/api/hotels")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.data?.[0]) {
          setLoading(false);
          return;
        }
        const res = await fetch(
          `/api/hotels/${d.data[0].id}/prices?days=${range}`
        );
        const json: PriceData = await res.json();
        setData(json);
        if (json.roomTypes.length > 0 && !activeTab) {
          setActiveTab(json.roomTypes[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  /* Loading state */
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--rg-primary, #6366f1)" }} />
        <div className="text-muted mt-2">กำลังโหลดข้อมูลราคา...</div>
      </div>
    );
  }

  /* Empty state */
  if (!data || data.roomTypes.length === 0) {
    return (
      <>
        <h4 className="mb-4 fw-bold">ราคาและ Rate Parity</h4>
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <div style={{ fontSize: "3rem" }}>📊</div>
            <h5 className="mt-3">ยังไม่มีข้อมูลราคา</h5>
            <p className="text-muted">
              เชื่อมต่อ OTA และ sync ข้อมูลก่อนเพื่อเริ่มเปรียบเทียบราคา
            </p>
          </Card.Body>
        </Card>
      </>
    );
  }

  const activeRoom = data.roomTypes.find((rt) => rt.id === activeTab) ?? data.roomTypes[0];

  return (
    <>
      {/* ---- Page Header ---- */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1">ราคาและ Rate Parity</h4>
          <span className="text-muted small">
            เช็คราคาข้าม OTA — สแกนตาแล้วเห็นทันที
          </span>
        </div>
        <ButtonGroup size="sm">
          {(["7", "14", "30"] as RangeKey[]).map((k) => (
            <Button
              key={k}
              variant={range === k ? "primary" : "outline-secondary"}
              onClick={() => setRange(k)}
              style={
                range === k
                  ? { backgroundColor: "var(--rg-primary, #6366f1)", borderColor: "var(--rg-primary, #6366f1)" }
                  : {}
              }
            >
              {k} วัน
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {/* ---- Summary Cards ---- */}
      <SummaryCards roomTypes={data.roomTypes} />

      {/* ---- Room Type Tabs ---- */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom-0 pb-0">
          <Nav
            variant="tabs"
            activeKey={activeRoom.id}
            onSelect={(k) => k && setActiveTab(k)}
          >
            {data.roomTypes.map((rt) => {
              const mismatchCount = rt.prices.filter(
                (p) => p.hasPriceDifference
              ).length;
              return (
                <Nav.Item key={rt.id}>
                  <Nav.Link eventKey={rt.id} className="px-3">
                    {rt.name}
                    {mismatchCount > 0 && (
                      <Badge
                        pill
                        bg="danger"
                        className="ms-2"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {mismatchCount}
                      </Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              );
            })}
          </Nav>
        </Card.Header>
      </Card>

      {/* ---- Rate Table + Chart for active room ---- */}
      <RoomRateTable room={activeRoom} />

      {/* ---- Footer info ---- */}
      <div className="text-muted small text-end mb-4">
        ข้อมูลช่วง {data.dateRange.from} ถึง {data.dateRange.to} | อัปเดตอัตโนมัติ
      </div>
    </>
  );
}
