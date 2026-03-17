"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Table, Spinner, Nav } from "react-bootstrap";

interface CompetitorRate {
  otaName: string;
  roomType: string;
  date: string;
  price: number;
}

interface Competitor {
  name: string;
  location: string;
  starRating: number;
  rates: CompetitorRate[];
}

interface CompetitorData {
  source: string;
  competitors: Competitor[];
  ourPrices: Record<string, Record<string, number>>;
}

function formatThaiDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function CompetitorRadarPage() {
  const [data, setData] = useState<CompetitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState("Deluxe Room");

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.data?.[0]) {
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/hotels/${d.data[0].id}/competitors`);
        setData(await res.json());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--rg-primary)" }} />
      </div>
    );
  }

  if (!data || data.competitors.length === 0) {
    return (
      <>
        <h4 className="mb-4">เรดาร์คู่แข่ง</h4>
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <p className="text-muted">ยังไม่มีข้อมูลราคาคู่แข่ง</p>
          </Card.Body>
        </Card>
      </>
    );
  }

  const roomTypes = [...new Set(data.competitors.flatMap((c) => c.rates.map((r) => r.roomType)))];
  const dates = [...new Set(data.competitors.flatMap((c) => c.rates.map((r) => r.date)))].sort();
  const uniqueDates = dates.slice(0, 14);

  // Get competitor prices for selected room type on Agoda
  function getCompetitorPrice(competitor: Competitor, date: string): number | null {
    const rate = competitor.rates.find(
      (r) => r.roomType === selectedRoom && r.date === date && r.otaName === "Agoda"
    );
    return rate?.price ?? null;
  }

  // Get our price
  function getOurPrice(date: string): number | null {
    return data?.ourPrices?.[date]?.[selectedRoom] ?? null;
  }

  // Calculate market position
  function getPosition(date: string): { rank: number; total: number; avg: number } {
    const prices: number[] = [];
    for (const c of data!.competitors) {
      const p = getCompetitorPrice(c, date);
      if (p) prices.push(p);
    }
    const ourPrice = getOurPrice(date);
    if (ourPrice) prices.push(ourPrice);

    prices.sort((a, b) => a - b);
    const rank = ourPrice ? prices.indexOf(ourPrice) + 1 : 0;
    const avg = prices.length > 0 ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length) : 0;

    return { rank, total: prices.length, avg };
  }

  function priceColor(ourPrice: number | null, competitorPrice: number | null): string {
    if (!ourPrice || !competitorPrice) return "";
    if (ourPrice < competitorPrice * 0.95) return "var(--rg-success)"; // cheaper
    if (ourPrice > competitorPrice * 1.05) return "var(--rg-danger)"; // more expensive
    return "var(--rg-warning)"; // similar
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">เรดาร์คู่แข่ง</h4>
          <small className="text-muted">
            {data.source === "demo" && (
              <Badge bg="info" className="me-1">Demo Data</Badge>
            )}
            เปรียบเทียบราคากับ {data.competitors.length} โรงแรมคู่แข่ง
          </small>
        </div>
      </div>

      {/* Summary cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">คู่แข่งที่ติดตาม</div>
              <h3 className="mb-0">{data.competitors.length}</h3>
              <small className="text-muted">โรงแรมในย่านเดียวกัน</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">ตำแหน่งราคาวันนี้</div>
              {(() => {
                const pos = getPosition(uniqueDates[0]);
                return (
                  <>
                    <h3 className="mb-0">
                      อันดับ {pos.rank}/{pos.total}
                    </h3>
                    <small className="text-muted">จากถูกที่สุด ({selectedRoom})</small>
                  </>
                );
              })()}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">ราคาเฉลี่ยตลาด</div>
              {(() => {
                const pos = getPosition(uniqueDates[0]);
                return (
                  <>
                    <h3 className="mb-0 font-mono">฿{pos.avg.toLocaleString()}</h3>
                    <small className="text-muted">{selectedRoom} · Agoda</small>
                  </>
                );
              })()}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Room type tabs */}
      <Nav variant="pills" className="mb-3 nav-tabs-custom">
        {roomTypes.map((rt) => (
          <Nav.Item key={rt}>
            <Nav.Link active={selectedRoom === rt} onClick={() => setSelectedRoom(rt)}>
              {rt}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {/* Competitor price table */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0" style={{ fontSize: "0.85rem" }}>
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>วันที่</th>
                <th className="text-end" style={{ minWidth: 90 }}>
                  <span style={{ color: "var(--rg-primary)", fontWeight: 700 }}>เรา</span>
                </th>
                {data.competitors.map((c) => (
                  <th key={c.name} className="text-end" style={{ minWidth: 90 }}>
                    <span className="d-block text-truncate" style={{ maxWidth: 100 }} title={c.name}>
                      {c.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                    <small className="text-muted">{"⭐".repeat(c.starRating)}</small>
                  </th>
                ))}
                <th className="text-center" style={{ minWidth: 60 }}>อันดับ</th>
              </tr>
            </thead>
            <tbody>
              {uniqueDates.map((date) => {
                const ourPrice = getOurPrice(date);
                const pos = getPosition(date);
                const isWeekend = [0, 6].includes(new Date(date).getDay());

                return (
                  <tr
                    key={date}
                    style={{
                      backgroundColor: isWeekend ? "var(--rg-gray-100)" : undefined,
                    }}
                  >
                    <td>
                      <span className="fw-semibold">{formatThaiDate(date)}</span>
                      {isWeekend && (
                        <Badge bg="primary" className="ms-1" style={{ fontSize: "0.6rem" }}>
                          หยุด
                        </Badge>
                      )}
                    </td>
                    <td className="text-end">
                      {ourPrice ? (
                        <span className="font-mono fw-bold" style={{ color: "var(--rg-primary)" }}>
                          ฿{ourPrice.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    {data.competitors.map((c) => {
                      const cp = getCompetitorPrice(c, date);
                      const color = priceColor(ourPrice, cp);
                      return (
                        <td key={c.name} className="text-end">
                          {cp ? (
                            <span className="font-mono" style={{ color: color || undefined }}>
                              ฿{cp.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center">
                      <Badge
                        bg=""
                        style={{
                          backgroundColor:
                            pos.rank <= 2
                              ? "var(--rg-success-light)"
                              : pos.rank >= pos.total - 1
                                ? "var(--rg-danger-light)"
                                : "var(--rg-warning-light)",
                          color:
                            pos.rank <= 2
                              ? "var(--rg-success)"
                              : pos.rank >= pos.total - 1
                                ? "var(--rg-danger)"
                                : "var(--rg-warning)",
                          fontWeight: 700,
                        }}
                      >
                        {pos.rank}/{pos.total}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Legend */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex gap-4 small">
            <div className="d-flex align-items-center gap-1">
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "var(--rg-success)", display: "inline-block" }} />
              ราคาเราถูกกว่า (&gt;5%)
            </div>
            <div className="d-flex align-items-center gap-1">
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "var(--rg-warning)", display: "inline-block" }} />
              ราคาใกล้เคียง (±5%)
            </div>
            <div className="d-flex align-items-center gap-1">
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "var(--rg-danger)", display: "inline-block" }} />
              ราคาเราแพงกว่า (&gt;5%)
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
