// =====================================
// Mauqifi — Smart Parking JS (Arabic Version)
// متكامل مع HTML المعدل (مدن + مولات صحيحة)
// تحسين تجربة المستخدم + توست بدلاً من alert + باركود
// =====================================

/* ===== بيانات المولات حسب المدينة ===== */
const malls = {
  khamis: ["موجان بارك", "خميس أفنيو", "أصداف مول"],
  abha: ["الراشد مول", "أبها مول", "لافندا بارك"]
};

/* ===== حالات النظام ===== */
let spots = [];
let currentReservation = null;
let timerInterval = null;

/* ===== عناصر DOM ===== */
const citySelect = document.getElementById("citySelect");
const mallSelect = document.getElementById("mallSelect");
const durationSelect = document.getElementById("duration");
const spotSelect = document.getElementById("spotSelect");
const bookBtn = document.getElementById("bookBtn");
const parkingMap = document.getElementById("parkingMap");
const parkingMapFull = document.getElementById("parkingMapFull");
const reservationDetails = document.getElementById("reservationDetails");
const toastElem = document.getElementById("toast");

/* ===== رسالة تنبيه (Toast) ===== */
function showToast(message, ms = 3000) {
  toastElem.textContent = message;
  toastElem.classList.add("show");
  clearTimeout(toastElem._timeout);
  toastElem._timeout = setTimeout(() => toastElem.classList.remove("show"), ms);
}

/* ===== إنشاء المواقف ===== */
function generateSpots() {
  spots = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name: `P-${i + 1}`,
    distance: Math.floor(Math.random() * 200) + 20,
    status: Math.random() > 0.35 ? "free" : "busy"
  }));
}

/* ===== تحديث المولات حسب المدينة ===== */
function updateMallSelect() {
  const city = citySelect.value;
  mallSelect.innerHTML = `<option value="">-- اختر المول --</option>`;
  if (city && malls[city]) {
    malls[city].forEach(mall => {
      const opt = document.createElement("option");
      opt.value = mall;
      opt.textContent = mall;
      mallSelect.appendChild(opt);
    });
  }
  evaluateBookButton();
}

/* ===== تحديث قائمة المواقف ===== */
function updateSpotSelect() {
  spotSelect.innerHTML = "";
  const free = spots.filter(s => s.status === "free");

  if (free.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "لا توجد مواقف متاحة حالياً";
    opt.disabled = true;
    spotSelect.appendChild(opt);
    bookBtn.disabled = true;
    return;
  }

  free.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} — ${s.distance} متر`;
    spotSelect.appendChild(opt);
  });
  evaluateBookButton();
}

/* ===== تحديث خريطة المواقف ===== */
function updateMap() {
  parkingMap.innerHTML = "";
  parkingMapFull.innerHTML = "";

  spots.forEach(s => {
    const node = document.createElement("div");
    node.className = `parking-spot ${s.status}`;
    node.textContent = s.name;
    node.title = `${s.name} — ${s.distance}م (${s.status === 'free' ? 'متاح' : 'مشغول'})`;
    node.tabIndex = 0;
    node.role = "button";
    node.onclick = () => selectSpot(s.id);
    node.onkeydown = e => { if (e.key === "Enter") selectSpot(s.id); };

    const clone = node.cloneNode(true);
    clone.onclick = () => selectSpot(s.id);

    parkingMap.appendChild(node);
    parkingMapFull.appendChild(clone);
  });
}

/* ===== اختيار موقف من الخريطة ===== */
function selectSpot(id) {
  spotSelect.value = id;
  spotSelect.classList.add("highlight");
  setTimeout(() => spotSelect.classList.remove("highlight"), 500);
  evaluateBookButton();
}

/* ===== التحقق من تفعيل زر الحجز ===== */
function evaluateBookButton() {
  const enabled = citySelect.value && mallSelect.value && spotSelect.value;
  bookBtn.disabled = !enabled;
}

/* ===== تنفيذ عملية الحجز ===== */
bookBtn.addEventListener("click", () => {
  const city = citySelect.value;
  const mall = mallSelect.value;
  const duration = parseInt(durationSelect.value, 10);
  const spotId = parseInt(spotSelect.value, 10);
  const spot = spots.find(s => s.id === spotId);

  if (!city || !mall) return showToast("يرجى اختيار المدينة والمول.");
  if (!spot || spot.status !== "free") return showToast("الموقف غير متاح.");

  const start = new Date();
  const end = new Date(start.getTime() + duration * 60000);
  currentReservation = { city, mall, spot, start, end, duration };

  spots = spots.map(s => s.id === spotId ? { ...s, status: 'busy' } : s);
  updateMap();
  updateSpotSelect();
  showReservation();
  showToast("✅ تم تأكيد الحجز بنجاح!");
});

/* ===== عرض تفاصيل الحجز مع QR في الجهة اليسرى ===== */
function showReservation() {
  if (!currentReservation) {
    reservationDetails.textContent = "لا يوجد حجز نشط حالياً.";
    return;
  }

  const { spot, start, end, mall, city } = currentReservation;

  const qrData = `🚗 Mauqifi Ticket
المدينة: ${city}
المول: ${mall}
رمز الموقف: ${spot.name}
انتهاء الحجز: ${end.toLocaleString()}`;

  // توليد QR باستخدام QRious
  const qr = new QRious({
    value: qrData,
    size: 220,
    background: '#0f172a',
    foreground: '#38bdf8'
  });

  reservationDetails.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 40px;">
      
      <!-- ✅ القسم الأيسر: الباركود -->
      <div style="flex: 0 0 240px; text-align:center;">
        <canvas id="qrCanvas" width="220" height="220"
          style="border-radius:16px; box-shadow:0 0 25px #0ea5e9;"></canvas>
        <p style="font-size:14px; color:#94a3b8; margin-top:8px;">رمز الحجز الخاص بك</p>
      </div>

      <!-- ✅ القسم الأيمن: تفاصيل الحجز -->
      <div style="flex: 1; direction: rtl;">
        <p>المدينة: <strong>${city}</strong></p>
        <p>المول: <strong>${mall}</strong></p>
        <p>رمز الموقف: <strong>${spot.name}</strong></p>
        <p>المسافة من البوابة: <strong>${spot.distance} متر</strong></p>
        <p>بداية الحجز: <strong>${start.toLocaleTimeString()}</strong></p>
        <p>نهاية الحجز: <strong>${end.toLocaleTimeString()}</strong></p>
        <p id="timer" style="margin-top: 10px;"></p>
        <button onclick="cancelReservation()" class="btn primary" style="margin-top: 10px;">إلغاء الحجز</button>
      </div>

    </div>
  `;

  const qrCanvas = document.getElementById("qrCanvas");
  qrCanvas.getContext("2d").drawImage(qr.canvas, 0, 0);

  startTimer();
}

/* ===== مؤقت العد التنازلي ===== */
function startTimer() {
  const timerElem = document.getElementById("timer");
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!currentReservation) {
      clearInterval(timerInterval);
      return;
    }

    const now = new Date();
    const remaining = currentReservation.end - now;

    if (remaining <= 0) {
      timerElem.textContent = "⏰ انتهى الوقت. تم تحرير الموقف.";
      releaseSpot(currentReservation.spot.id);
      clearInterval(timerInterval);
      showToast("انتهت مدة الحجز، الموقف أصبح متاحًا.");
    } else {
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      timerElem.textContent = `الوقت المتبقي: ${min}:${sec < 10 ? "0" + sec : sec}`;
    }
  }, 1000);
}

/* ===== تحرير الموقف ===== */
function releaseSpot(id) {
  spots = spots.map(s => s.id === id ? { ...s, status: "free" } : s);
  currentReservation = null;
  updateMap();
  updateSpotSelect();
  showReservation();
}

/* ===== إلغاء الحجز ===== */
function cancelReservation() {
  if (!currentReservation) return showToast("لا يوجد حجز لإلغائه.");
  releaseSpot(currentReservation.spot.id);
  showToast("❌ تم إلغاء الحجز بنجاح.");
}

/* ===== التنقل بين الأقسام ===== */
function showSection(id) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

/* ===== تفعيل التنقل ===== */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    showSection(btn.dataset.target);
    document.getElementById(btn.dataset.target).focus();
  });
});

/* ===== القائمة (هامبرغر) ===== */
const hamburger = document.getElementById("hamburger");
hamburger.addEventListener("click", () => {
  const nav = document.getElementById("mainNav");
  const expanded = hamburger.getAttribute("aria-expanded") === "true";
  hamburger.setAttribute("aria-expanded", String(!expanded));
  nav.style.display = expanded ? "" : "block";
});

/* ===== عند تحميل الصفحة ===== */
window.addEventListener("load", () => {
  generateSpots();
  updateMallSelect();
  updateSpotSelect();
  updateMap();
  showReservation();
});
