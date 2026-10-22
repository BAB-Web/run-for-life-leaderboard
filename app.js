// ============================================================================
// 1. ตั้งค่าแหล่งข้อมูล (Data Source Configuration)
// ============================================================================
var CONFIG = {
  // อ่านข้อมูลจากไฟล์ data/runners.json ในโปรเจกต์ (หรือใส่ URL ของ API หลังบ้านได้)
  dataUrl: "./data/runners.json",
  // รีเฟรชข้อมูลอัตโนมัติทุกๆ 60 วินาที
  refreshIntervalMs: 60000
};

// ============================================================================
// 2. ฟังก์ชันจัดเรียงลำดับ (คนที่ครบ 93 KM เรียงตามวันที่ถึงก่อนได้ที่ 1)
// ============================================================================
function sortRunners(runners) {
  var finishers = [];
  var inprogress = [];

  for (var i = 0; i < runners.length; i++) {
    var r = runners[i];
    var km = parseFloat(r.totalkm) || 0;
    if (km >= 93) {
      finishers.push(r);
    } else {
      inprogress.push(r);
    }
  }

  finishers.sort(function(a, b) {
    var timeA = a.lastupdate ? new Date(a.lastupdate).getTime() : Number.MAX_SAFE_INTEGER;
    var timeB = b.lastupdate ? new Date(b.lastupdate).getTime() : Number.MAX_SAFE_INTEGER;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return (parseFloat(b.totalkm) || 0) - (parseFloat(a.totalkm) || 0);
  });

  inprogress.sort(function(a, b) {
    var kmDiff = (parseFloat(b.totalkm) || 0) - (parseFloat(a.totalkm) || 0);
    if (kmDiff !== 0) {
      return kmDiff;
    }
    var timeA = a.lastupdate ? new Date(a.lastupdate).getTime() : Number.MAX_SAFE_INTEGER;
    var timeB = b.lastupdate ? new Date(b.lastupdate).getTime() : Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  return finishers.concat(inprogress);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================================
// 3. ฟังก์ชันวาดข้อมูลลงบนหน้าเว็บ
// ============================================================================
function renderLeaderboard(rawRunners) {
  var sortedRunners = sortRunners(rawRunners || []);
  var contentEl = document.getElementById("leaderboard-content");
  var emptyEl = document.getElementById("empty-state");
  var mapAvatarsEl = document.getElementById("map-avatars-container");
  var cardsEl = document.getElementById("cards-container");
  var donationEl = document.getElementById("donation-val");

  var totalDonation = 0;
  for (var i = 0; i < sortedRunners.length; i++) {
    var runnerKm = parseFloat(sortedRunners[i].totalkm) || 0;
    if (runnerKm > 93) runnerKm = 93;
    if (runnerKm < 0) runnerKm = 0;
    totalDonation += runnerKm * 5;
  }

  if (donationEl) {
    donationEl.innerText = totalDonation.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (sortedRunners.length === 0) {
    contentEl.style.display = "none";
    emptyEl.style.display = "block";
    return;
  }

  contentEl.style.display = "block";
  emptyEl.style.display = "none";

  var mapHtml = "";
  var cardsHtml = "";

  for (var idx = 0; idx < sortedRunners.length; idx++) {
    var runner = sortedRunners[idx];
    var rank = idx + 1;
    var posKm = parseFloat(runner.totalkm) || 0;
    if (posKm > 93) posKm = 93;
    if (posKm < 0) posKm = 0;

    var posPercent = (posKm / 93.0) * 100;
    if (posPercent > 100) posPercent = 100;

    var rClass = "";
    if (rank === 1) rClass = "rank-1";
    else if (rank === 2) rClass = "rank-2";
    else if (rank === 3) rClass = "rank-3";

    var safeName = escapeHtml(runner.name || "นักวิ่ง");
    var initials = escapeHtml((runner.name || "R").slice(0, 2));
    var safeImg = runner.profileimage ? escapeHtml(runner.profileimage) : "";

    var avatarInner = safeImg
      ? '<span class="runner-avatar-img-clip"><img src="' + safeImg + '" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" /></span>'
      : '<span class="runner-avatar-img-clip">' + initials + '</span>';

    mapHtml +=
      '<div class="runner-avatar ' + rClass + '" style="left: ' + posPercent.toFixed(2) + '%;">' +
        avatarInner +
        '<span class="tooltip-text">' + safeName + '<br />' + posKm.toFixed(2) + ' KM</span>' +
      '</div>';

    var rankBadge = "#" + rank;
    if (rank === 1) rankBadge = "🥇";
    else if (rank === 2) rankBadge = "🥈";
    else if (rank === 3) rankBadge = "🥉";

    var cardAvatarHtml = safeImg
      ? '<img src="' + safeImg + '" class="card-avatar" alt="Profile" />'
      : '<div class="card-avatar">' + initials + '</div>';

    var statusHtml = "";
    if (runner.overallstatus) {
      var safeStatus = escapeHtml(runner.overallstatus);
      if (runner.overallstatus === "Finisher") {
        statusHtml = '<span class="status-badge status-finisher">✔️ ' + safeStatus + '</span>';
      } else {
        statusHtml = '<span class="status-badge">' + safeStatus + '</span>';
      }
    }

    cardsHtml +=
      '<div class="runner-card ' + rClass + '">' +
        '<div class="rank-number">' + rankBadge + '</div>' +
        '<div class="runner-info">' +
          '<div class="runner-name-wrapper">' +
            cardAvatarHtml +
            '<div class="runner-name">' +
              safeName + ' ' + statusHtml +
            '</div>' +
          '</div>' +
          '<div class="progress-container">' +
            '<div class="progress-bar" style="width: ' + posPercent.toFixed(2) + '%;"></div>' +
          '</div>' +
        '</div>' +
        '<div class="stats-container">' +
          '<div class="total-km">' + posKm.toFixed(2) + ' KM</div>' +
          '<div class="progress-text">ความคืบหน้า ' + posPercent.toFixed(2) + '%</div>' +
        '</div>' +
      '</div>';
  }

  mapAvatarsEl.innerHTML = mapHtml;
  cardsEl.innerHTML = cardsHtml;
}

// ============================================================================
// 4. ดึงข้อมูลจากไฟล์ JSON หรือ API
// ============================================================================
function loadRunnersData() {
  var url = CONFIG.dataUrl + (CONFIG.dataUrl.indexOf("?") === -1 ? "?t=" : "&t=") + new Date().getTime();
  fetch(url)
    .then(function(res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " (" + CONFIG.dataUrl + ")");
      return res.json();
    })
    .then(function(data) {
      var errBanner = document.getElementById("error-banner");
      if (errBanner) errBanner.style.display = "none";
      renderLeaderboard(Array.isArray(data) ? data : (data.value || []));
    })
    .catch(function(err) {
      var errBanner = document.getElementById("error-banner");
      var errText = document.getElementById("error-message-text");
      if (errBanner && errText) {
        errText.innerText = err.message;
        errBanner.style.display = "block";
      }
    });
}

// ============================================================================
// 5. นาฬิกานับถอยหลัง
// ============================================================================
var countDownDate = new Date("Dec 12, 2026 23:59:59").getTime();

function updateCountdown() {
  var now = new Date().getTime();
  var distance = countDownDate - now;

  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  var dStr = days < 10 ? "0" + days : String(days);
  var hStr = hours < 10 ? "0" + hours : String(hours);
  var mStr = minutes < 10 ? "0" + minutes : String(minutes);
  var sStr = seconds < 10 ? "0" + seconds : String(seconds);

  var elDays = document.getElementById("cd-days");
  if (elDays) {
    if (distance < 0) {
      elDays.innerHTML = "00";
      document.getElementById("cd-hours").innerHTML = "00";
      document.getElementById("cd-mins").innerHTML = "00";
      document.getElementById("cd-secs").innerHTML = "00";
      var note = document.querySelector(".countdown-note");
      if (note) note.innerHTML = "<span style='color:#d32f2f; font-weight:bold;'>🚩 กิจกรรมสิ้นสุดแล้ว!</span>";
      return;
    }
    elDays.innerHTML = dStr;
    document.getElementById("cd-hours").innerHTML = hStr;
    document.getElementById("cd-mins").innerHTML = mStr;
    document.getElementById("cd-secs").innerHTML = sStr;
  }
}

window.addEventListener("DOMContentLoaded", function() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  loadRunnersData();
  if (CONFIG.refreshIntervalMs > 0) {
    setInterval(loadRunnersData, CONFIG.refreshIntervalMs);
  }
});
