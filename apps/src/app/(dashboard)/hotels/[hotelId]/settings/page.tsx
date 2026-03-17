"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Table,
  Badge,
  Row,
  Col,
  Spinner,
  Tabs,
  Tab,
} from "react-bootstrap";

interface OtaConnection {
  id: string;
  otaName: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
}

interface RoomType {
  id: string;
  name: string;
  otaMappings: Record<string, { otaRoomTypeId: string; otaRoomName: string | null }>;
  pricingBoundaries: { minPrice: number | null; maxPrice: number | null; maxDiscountPercent: number | null };
  currentPrices: Record<string, { price: number; currency: string; syncedAt: string }>;
}

export default function HotelSettingsPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;

  const [hotel, setHotel] = useState<{ id: string; name: string; location: string | null; totalRooms: number } | null>(null);
  const [connections, setConnections] = useState<OtaConnection[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTA connect modal
  const [showOtaModal, setShowOtaModal] = useState(false);
  const [otaName, setOtaName] = useState("agoda");
  const [channexPropId, setChannexPropId] = useState("mock-prop-001");
  const [otaLoading, setOtaLoading] = useState(false);

  // Boundaries modal
  const [boundaryRt, setBoundaryRt] = useState<RoomType | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [boundaryLoading, setBoundaryLoading] = useState(false);

  // Sync
  const [syncLoading, setSyncLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [hotelRes, connRes, rtRes] = await Promise.all([
        fetch(`/api/hotels/${hotelId}`),
        fetch(`/api/hotels/${hotelId}/ota-connections`),
        fetch(`/api/hotels/${hotelId}/room-types`),
      ]);
      const hotelData = await hotelRes.json();
      const connData = await connRes.json();
      const rtData = await rtRes.json();

      setHotel(hotelData);
      setConnections(connData.data ?? []);
      setRoomTypes(rtData.data ?? []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleConnectOta(e: React.FormEvent) {
    e.preventDefault();
    setOtaLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hotels/${hotelId}/ota-connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otaName, channexPropertyId: channexPropId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(data.message);
      setShowOtaModal(false);
      fetchData();
    } catch { setError("เกิดข้อผิดพลาด"); }
    finally { setOtaLoading(false); }
  }

  async function handleDisconnectOta(connId: string) {
    if (!confirm("ยืนยันยกเลิกการเชื่อมต่อ?")) return;
    try {
      const res = await fetch(`/api/hotels/${hotelId}/ota-connections/${connId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(data.message);
      fetchData();
    } catch { setError("เกิดข้อผิดพลาด"); }
  }

  async function handleTriggerSync() {
    setSyncLoading(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/sync/trigger`, { method: "POST" });
      const data = await res.json();
      setSuccess(data.message ?? "กำลัง sync...");
      setTimeout(fetchData, 3000);
    } catch { setError("เกิดข้อผิดพลาด"); }
    finally { setSyncLoading(false); }
  }

  async function handleSaveBoundaries(e: React.FormEvent) {
    e.preventDefault();
    if (!boundaryRt) return;
    setBoundaryLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hotels/${hotelId}/room-types/${boundaryRt.id}/boundaries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minPrice: parseFloat(minPrice),
          maxPrice: parseFloat(maxPrice),
          maxDiscountPercent: maxDiscount ? parseInt(maxDiscount) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(data.message);
      setBoundaryRt(null);
      fetchData();
    } catch { setError("เกิดข้อผิดพลาด"); }
    finally { setBoundaryLoading(false); }
  }

  function openBoundaryModal(rt: RoomType) {
    setBoundaryRt(rt);
    setMinPrice(rt.pricingBoundaries.minPrice?.toString() ?? "");
    setMaxPrice(rt.pricingBoundaries.maxPrice?.toString() ?? "");
    setMaxDiscount(rt.pricingBoundaries.maxDiscountPercent?.toString() ?? "");
  }

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">จัดการ: {hotel?.name}</h4>
          <small className="text-muted">{hotel?.location} · {hotel?.totalRooms} ห้อง</small>
        </div>
        <Button variant="outline-primary" size="sm" onClick={handleTriggerSync} disabled={syncLoading}>
          {syncLoading ? "กำลัง sync..." : "Sync ข้อมูล OTA"}
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      <Tabs defaultActiveKey="ota" className="mb-4">
        {/* === OTA Connections Tab === */}
        <Tab eventKey="ota" title="เชื่อมต่อ OTA">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">การเชื่อมต่อ OTA</h5>
            <Button variant="primary" size="sm" onClick={() => setShowOtaModal(true)}>
              + เชื่อมต่อ OTA
            </Button>
          </div>

          {connections.length === 0 ? (
            <Card className="border-0 shadow-sm text-center py-4">
              <Card.Body>
                <p className="text-muted mb-3">ยังไม่ได้เชื่อมต่อ OTA</p>
                <Button variant="primary" onClick={() => setShowOtaModal(true)}>เชื่อมต่อ OTA แรก</Button>
              </Card.Body>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <Table responsive className="mb-0">
                <thead><tr><th>OTA</th><th>สถานะ</th><th>Sync ล่าสุด</th><th>Error</th><th></th></tr></thead>
                <tbody>
                  {connections.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.otaName === "agoda" ? "Agoda" : "Booking.com"}</td>
                      <td>
                        <Badge bg={c.status === "CONNECTED" ? "success" : c.status === "ERROR" ? "danger" : "secondary"}>
                          {c.status === "CONNECTED" ? "เชื่อมต่อแล้ว" : c.status === "ERROR" ? "มีปัญหา" : "ยกเลิก"}
                        </Badge>
                      </td>
                      <td>{c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString("th-TH") : "ยังไม่เคย"}</td>
                      <td><small className="text-danger">{c.lastError ?? "—"}</small></td>
                      <td>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDisconnectOta(c.id)}>ยกเลิก</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </Tab>

        {/* === Room Types Tab === */}
        <Tab eventKey="rooms" title="ห้องพัก & กรอบราคา">
          <h5 className="mb-3">ห้องพักและกรอบราคา</h5>
          {roomTypes.length === 0 ? (
            <Card className="border-0 shadow-sm text-center py-4">
              <Card.Body>
                <p className="text-muted">ยังไม่มี room type — Sync OTA เพื่อดึงข้อมูลห้องพัก</p>
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-3">
              {roomTypes.map((rt) => (
                <Col key={rt.id} md={6} lg={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <Card.Title>{rt.name}</Card.Title>

                      {/* OTA Mappings */}
                      <div className="mb-3">
                        <small className="text-muted fw-bold">OTA Mapping:</small>
                        {Object.entries(rt.otaMappings).map(([ota, m]) => (
                          <div key={ota}>
                            <small>{ota === "agoda" ? "Agoda" : "Booking"}: {m.otaRoomName ?? m.otaRoomTypeId}</small>
                          </div>
                        ))}
                        {Object.keys(rt.otaMappings).length === 0 && (
                          <div><small className="text-warning">ยังไม่ได้ map</small></div>
                        )}
                      </div>

                      {/* Current Prices */}
                      <div className="mb-3">
                        <small className="text-muted fw-bold">ราคาปัจจุบัน:</small>
                        {Object.entries(rt.currentPrices).map(([ota, p]) => (
                          <div key={ota}>
                            <small>{ota === "agoda" ? "Agoda" : "Booking"}: <span className="font-mono fw-bold">{p.price.toLocaleString()} ฿</span></small>
                          </div>
                        ))}
                        {Object.keys(rt.currentPrices).length === 0 && (
                          <div><small className="text-muted">ไม่พบข้อมูลราคา</small></div>
                        )}
                      </div>

                      {/* Boundaries */}
                      <div className="mb-3">
                        <small className="text-muted fw-bold">กรอบราคา:</small>
                        <div>
                          <small>
                            {rt.pricingBoundaries.minPrice != null
                              ? `${rt.pricingBoundaries.minPrice.toLocaleString()} - ${rt.pricingBoundaries.maxPrice?.toLocaleString() ?? "∞"} ฿`
                              : "ยังไม่ได้ตั้ง"}
                            {rt.pricingBoundaries.maxDiscountPercent != null && ` (ลดสูงสุด ${rt.pricingBoundaries.maxDiscountPercent}%)`}
                          </small>
                        </div>
                      </div>

                      <Button variant="outline-primary" size="sm" onClick={() => openBoundaryModal(rt)}>
                        ตั้งกรอบราคา
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab>
      </Tabs>

      {/* === OTA Connect Modal === */}
      <Modal show={showOtaModal} onHide={() => setShowOtaModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>เชื่อมต่อ OTA</Modal.Title></Modal.Header>
        <Form onSubmit={handleConnectOta}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>OTA *</Form.Label>
              <Form.Select value={otaName} onChange={(e) => setOtaName(e.target.value)}>
                <option value="agoda">Agoda</option>
                <option value="booking">Booking.com</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Channex Property ID *</Form.Label>
              <Form.Control value={channexPropId} onChange={(e) => setChannexPropId(e.target.value)} placeholder="channex-prop-xxx" required />
              <Form.Text className="text-muted">ใส่ mock-prop-001 สำหรับทดสอบ</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOtaModal(false)}>ยกเลิก</Button>
            <Button type="submit" variant="primary" disabled={otaLoading}>
              {otaLoading ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อ"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* === Boundaries Modal === */}
      <Modal show={!!boundaryRt} onHide={() => setBoundaryRt(null)} centered>
        <Modal.Header closeButton><Modal.Title>กรอบราคา: {boundaryRt?.name}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSaveBoundaries}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>ราคาต่ำสุด (บาท) *</Form.Label>
              <Form.Control type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} required min={0} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>ราคาสูงสุด (บาท) *</Form.Label>
              <Form.Control type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} required min={0} />
            </Form.Group>
            <Form.Group>
              <Form.Label>ส่วนลดสูงสุด (%)</Form.Label>
              <Form.Control type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} min={0} max={100} placeholder="20" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setBoundaryRt(null)}>ยกเลิก</Button>
            <Button type="submit" variant="primary" disabled={boundaryLoading}>
              {boundaryLoading ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
