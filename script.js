const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxhkha3Um3hocQMUNmNQocRxNkff96tMOxDyB5-DOSiah75Vg8889fbcBfR61A5CcyZ1w/exec";

// Update scores summary when radio buttons change
document.addEventListener("change", function (e) {
  if (e.target.type === "radio") {
    updateScoresSummary();
  }
});

function updateScoresSummary() {
  const sections = [
    { name: "คุณธรรม จริยธรรม", prefix: "s1q", count: 4 },
    { name: "ความรู้", prefix: "s2q", count: 3 },
    { name: "ทักษะทางปัญญา", prefix: "s3q", count: 3 },
    { name: "ทักษะความสัมพันธ์ระหว่างบุคคลและความรับผิดชอบ", prefix: "s4q", count: 3 },
    { name: "ทักษะการวิเคราะห์เชิงตัวเลข การสื่อสาร และการใช้เทคโนโลยีสารสนเทศ", prefix: "s5q", count: 3 },
    { name: "ทักษะการปฏิบัติงาน", prefix: "s6q", count: 3 },
  ];

  let hasScores = false;
  let scoresHtml = "";

  sections.forEach((section) => {
    let sectionTotal = 0;
    let questionsAnswered = 0;

    for (let i = 1; i <= section.count; i++) {
      const radioName = `${section.prefix}${i}`;
      const checkedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
      if (checkedRadio) {
        sectionTotal += parseInt(checkedRadio.value);
        questionsAnswered++;
      }
    }

    if (questionsAnswered > 0) {
      hasScores = true;
      scoresHtml += `
                        <div class="score-item">
                            <span style="font-weight: bold;">${section.name}:</span>
                            <span>${sectionTotal} คะแนน (จาก ${section.count * 5} คะแนน)</span>
                        </div>
                    `;
    }
  });

  const summaryDiv = document.getElementById("scoresSummary");
  const scoresDisplay = document.getElementById("scoresDisplay");

  if (hasScores) {
    scoresDisplay.innerHTML = scoresHtml;
    summaryDiv.style.display = "block";
  } else {
    summaryDiv.style.display = "none";
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function calculateSectionScore(prefix, count) {
  let total = 0;
  for (let i = 1; i <= count; i++) {
    const radioName = `${prefix}${i}`;
    const checkedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
    if (checkedRadio) {
      total += parseInt(checkedRadio.value);
    }
  }
  return total;
}

function validateForm() {
  const requiredFields = ["workplace", "fullName", "position", "phoneNumber", "email", "internId", "internFullName"];

  for (const field of requiredFields) {
    const element = document.getElementById(field);
    if (!element.value.trim()) {
      showToast(`กรุณากรอก${element.previousElementSibling.textContent}`, "error");
      element.focus();
      return false;
    }
  }

  // Validate email format
  const email = document.getElementById("email").value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("กรุณากรอกอีเมลให้ถูกต้อง", "error");
    document.getElementById("email").focus();
    return false;
  }

  // Check if all rating questions are answered
  const sections = [
    { prefix: "s1q", count: 4 },
    { prefix: "s2q", count: 3 },
    { prefix: "s3q", count: 3 },
    { prefix: "s4q", count: 3 },
    { prefix: "s5q", count: 3 },
    { prefix: "s6q", count: 3 },
  ];

  for (const section of sections) {
    for (let i = 1; i <= section.count; i++) {
      const radioName = `${section.prefix}${i}`;
      const checkedRadio = document.querySelector(`input[name="${radioName}"]:checked`);
      if (!checkedRadio) {
        showToast(`กรุณาประเมินคะแนนให้ครบทุกข้อ`, "error");
        return false;
      }
    }
  }

  return true;
}

async function submitToGoogleSheets(data) {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error submitting to Google Sheets:", error);
    throw error;
  }
}

document.getElementById("evaluationForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังบันทึก...";

  try {
    const formData = new FormData(this);
    const data = {
      workplace: formData.get("workplace"),
      fullName: formData.get("fullName"),
      position: formData.get("position"),
      phoneNumber: formData.get("phoneNumber"),
      email: formData.get("email"),
      internId: formData.get("internId"),
      internFullName: formData.get("internFullName"),
      s1Score: calculateSectionScore("s1q", 4),
      s2Score: calculateSectionScore("s2q", 3),
      s3Score: calculateSectionScore("s3q", 3),
      s4Score: calculateSectionScore("s4q", 3),
      s5Score: calculateSectionScore("s5q", 3),
      s6Score: calculateSectionScore("s6q", 3),
      strengths: formData.get("strengths") || "",
      improvements: formData.get("improvements") || "",
      additionalComments: formData.get("additionalComments") || "",
      timestamp: new Date().toISOString(),
    };

    await submitToGoogleSheets(data);

    showToast("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
    setTimeout(() => {
      this.reset();
      updateScoresSummary();
    }, 1500);
  } catch (error) {
    showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองอีกครั้ง", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "บันทึกข้อมูล";
  }
});

// Initialize scores summary on page load
updateScoresSummary();
