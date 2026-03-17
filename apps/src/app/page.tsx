"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container, Button, Row, Col, Card } from "react-bootstrap";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/overview");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (session) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--rg-white)" }}>
      {/* Hero */}
      <div
        className="text-center text-white py-5"
        style={{
          background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
        }}
      >
        <Container>
          <h1 className="display-3 fw-bold mb-3">RateGenie</h1>
          <p className="lead mb-1 opacity-75">
            AI Revenue Assistant สำหรับโรงแรมอิสระในไทย
          </p>
          <p className="fs-5 mb-4 opacity-75">
            แค่อ่านคำแนะนำ กดอนุมัติ — AI ดูแลราคาให้
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Link href="/register">
              <Button variant="light" size="lg" className="fw-bold px-4">
                เริ่มใช้งานฟรี
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline-light"
                size="lg"
                className="fw-bold px-4"
              >
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </Container>
      </div>

      {/* Features */}
      <Container className="py-5">
        <h2 className="text-center fw-bold mb-4">ทำไมต้อง RateGenie?</h2>
        <Row className="g-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 text-center p-3">
              <Card.Body>
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: "var(--rg-info-light)",
                    color: "var(--rg-info)",
                    fontSize: 28,
                  }}
                >
                  AI
                </div>
                <Card.Title>AI วิเคราะห์ราคา</Card.Title>
                <Card.Text className="text-muted">
                  วิเคราะห์ข้อมูล OTA + booking pace
                  แนะนำราคาพร้อมเหตุผลภาษาไทย
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 text-center p-3">
              <Card.Body>
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: "var(--rg-success-light)",
                    color: "var(--rg-success)",
                    fontSize: 28,
                  }}
                >
                  OTA
                </div>
                <Card.Title>เชื่อมต่อ OTA อัตโนมัติ</Card.Title>
                <Card.Text className="text-muted">
                  ดึงราคาจาก Agoda, Booking.com ทุก 5 นาที
                  ดูราคาทุก OTA ในหน้าเดียว
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 text-center p-3">
              <Card.Body>
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: "var(--rg-warning-light)",
                    color: "var(--rg-warning)",
                    fontSize: 28,
                  }}
                >
                  LINE
                </div>
                <Card.Title>แจ้งเตือนทันที</Card.Title>
                <Card.Text className="text-muted">
                  รับคำแนะนำผ่าน LINE / Telegram กดอนุมัติได้เลย
                  ไม่พลาดโอกาส
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* CTA */}
      <div
        className="text-center py-5"
        style={{ backgroundColor: "var(--rg-gray-100)" }}
      >
        <Container>
          <h3 className="fw-bold mb-3">พร้อมเพิ่ม Revenue ให้โรงแรมคุณ?</h3>
          <p className="text-muted mb-4">
            เริ่มต้นใช้งาน RateGenie วันนี้ — ไม่มีค่าใช้จ่ายช่วง pilot
          </p>
          <Link href="/register">
            <Button variant="primary" size="lg" className="fw-bold px-5">
              สมัครเลย
            </Button>
          </Link>
        </Container>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <small className="text-muted">
          RateGenie — AI Revenue Assistant for Independent Hotels in Thailand
        </small>
      </div>
    </div>
  );
}
