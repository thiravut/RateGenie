"use client";

import { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Badge, Row, Col, Spinner } from "react-bootstrap";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  notificationChannel: string | null;
  lineUserId: string | null;
  telegramChatId: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");

  // LINE/Telegram connect
  const [connectLoading, setConnectLoading] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<{ channel: string; code: string; url: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setName(d.name);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setProfile(data.user);
      setSuccess("บันทึกสำเร็จ");
    } catch { setError("เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  }

  async function handleConnectLine() {
    setConnectLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/me/notifications/line/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setVerificationInfo({ channel: "LINE", code: data.verificationCode, url: data.connectUrl });
    } catch { setError("เกิดข้อผิดพลาด"); }
    finally { setConnectLoading(false); }
  }

  async function handleConnectTelegram() {
    setConnectLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/me/notifications/telegram/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setVerificationInfo({ channel: "Telegram", code: data.verificationCode, url: data.botUrl });
    } catch { setError("เกิดข้อผิดพลาด"); }
    finally { setConnectLoading(false); }
  }

  async function handleDisconnect(channel: string) {
    try {
      const res = await fetch(`/api/users/me/notifications/${channel}/disconnect`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(data.message);
      // Refresh profile
      const r = await fetch("/api/users/me");
      setProfile(await r.json());
    } catch { setError("เกิดข้อผิดพลาด"); }
  }

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <>
      <h4 className="mb-4">ตั้งค่า</h4>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}

      <Row className="g-4">
        {/* Profile */}
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">ข้อมูลส่วนตัว</Card.Title>
              <Form onSubmit={handleSaveProfile}>
                <Form.Group className="mb-3">
                  <Form.Label>อีเมล</Form.Label>
                  <Form.Control value={profile?.email ?? ""} disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>ชื่อ</Form.Label>
                  <Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>บทบาท</Form.Label>
                  <div>
                    <Badge bg="primary">
                      {profile?.role === "OWNER" ? "เจ้าของ" : profile?.role === "REVENUE_MANAGER" ? "Revenue Manager" : profile?.role === "FRONT_DESK" ? "Front Desk" : "Admin"}
                    </Badge>
                  </div>
                </Form.Group>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Notifications */}
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">การแจ้งเตือน</Card.Title>

              {/* LINE */}
              <div className="d-flex justify-content-between align-items-center p-3 mb-2 rounded" style={{ backgroundColor: "#06C755", color: "white" }}>
                <div>
                  <strong>LINE</strong>
                  <div>
                    <small>
                      {profile?.lineUserId
                        ? `เชื่อมต่อแล้ว (${profile.lineUserId.substring(0, 10)}...)`
                        : "ยังไม่เชื่อมต่อ"}
                    </small>
                  </div>
                </div>
                {profile?.lineUserId ? (
                  <Button variant="light" size="sm" onClick={() => handleDisconnect("line")}>ยกเลิก</Button>
                ) : (
                  <Button variant="light" size="sm" onClick={handleConnectLine} disabled={connectLoading}>
                    เชื่อมต่อ
                  </Button>
                )}
              </div>

              {/* Telegram */}
              <div className="d-flex justify-content-between align-items-center p-3 mb-3 rounded" style={{ backgroundColor: "#0088cc", color: "white" }}>
                <div>
                  <strong>Telegram</strong>
                  <div>
                    <small>
                      {profile?.telegramChatId
                        ? `เชื่อมต่อแล้ว (${profile.telegramChatId})`
                        : "ยังไม่เชื่อมต่อ"}
                    </small>
                  </div>
                </div>
                {profile?.telegramChatId ? (
                  <Button variant="light" size="sm" onClick={() => handleDisconnect("telegram")}>ยกเลิก</Button>
                ) : (
                  <Button variant="light" size="sm" onClick={handleConnectTelegram} disabled={connectLoading}>
                    เชื่อมต่อ
                  </Button>
                )}
              </div>

              <small className="text-muted">
                เลือก channel เพื่อรับแจ้งเตือนคำแนะนำราคาและ OTA sync alerts
              </small>

              {/* Verification Info */}
              {verificationInfo && (
                <Alert variant="info" className="mt-3" dismissible onClose={() => setVerificationInfo(null)}>
                  <Alert.Heading className="h6">เชื่อมต่อ {verificationInfo.channel}</Alert.Heading>
                  <p className="mb-1">
                    1. เปิด{" "}
                    <a href={verificationInfo.url} target="_blank" rel="noopener noreferrer" className="alert-link">
                      {verificationInfo.channel}
                    </a>
                  </p>
                  <p className="mb-1">2. ส่งรหัสนี้:</p>
                  <h4 className="font-mono text-center my-2">{verificationInfo.code}</h4>
                  <small>รหัสหมดอายุใน 10 นาที</small>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
