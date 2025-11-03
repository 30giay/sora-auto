// Veo3 Text Batch v5.0 – 80vh, auto prompt + Enter (Advanced), quét & click tải (720p/Original)
(function () {
  const old = document.getElementById("veo3-scene-batch-runner");
  if (old) old.remove();

  // --- UI SETUP (Giữ nguyên phần HTML/CSS để giữ giao diện) ---
  const ui = document.createElement("div");
  ui.id = "veo3-scene-batch-runner";
  ui.style.cssText = `
    position: fixed; right: 16px; bottom: 16px; z-index: 999999; width: 440px;
    background: #111; color: #fff; border: 1px solid #444; border-radius: 10px;
    padding: 8px 10px 6px; font-family: system-ui,-apple-system,BlinkMacSystemFont,sans-serif;
    font-size: 13px; max-height: 80vh; display: flex; flex-direction: column;
  `;

  ui.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <div style="font-weight:700;">Veo3 Text Batch v5.0 (Cải tiến)</div>
      <div style="display:flex;gap:4px;">
        <button id="vr-toggle" style="width:22px;height:22px;border-radius:50%;border:1px solid #555; background:#222;color:#fff;cursor:pointer;font-size:11px;line-height:1;">▾</button>
        <button id="vr-close" style="width:22px;height:22px;border-radius:50%;border:1px solid #555; background:#222;color:#fff;cursor:pointer;font-size:11px;line-height:1;">✕</button>
      </div>
    </div>
    <div style="font-size:11px;opacity:0.8;margin-bottom:4px;">
      👉 Trước khi bấm <b>Run</b>, hãy click chuột vào ô prompt của Flow một lần.
    </div>
    <div id="vr-body" style="flex:1;overflow-y:auto;padding-right:2px;">
      <textarea id="vr-scenes-input" rows="6"
        style="width:100%;box-sizing:border-box;background:#000;color:#0f0;
               border:1px solid #444;border-radius:6px;padding:6px;"
        placeholder="Dán kịch bản dạng 1. ..., 2. ..., 3. ... ở đây"></textarea>
      <div style="margin:6px 0;display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <label>Delay (ms):
          <input id="vr-delay" type="number" value="15000"
                style="width:90px;background:#000;color:#fff;
                       border:1px solid #444;border-radius:4px;padding:2px 4px;">
        </label>
        <button id="vr-parse"
          style="background:#555;border:none;border-radius:4px;
                 padding:4px 8px;cursor:pointer;">Parse scenes</button>
      </div>
      <div id="vr-scenes-list"
          style="max-height:140px;overflow:auto;border:1px solid #333;
                 border-radius:6px;padding:4px;margin-bottom:6px;background:#050505;"></div>
      <div style="display:flex;gap:8px;margin-bottom:6px;">
        <button id="vr-run"
          style="flex:1;background:#4caf50;border:none;border-radius:4px;
                 padding:6px 0;cursor:pointer;">Run (auto text)</button>
        <button id="vr-stop"
          style="flex:1;background:#e53935;border:none;border-radius:4px;
                 padding:6px 0;cursor:pointer;">Stop</button>
      </div>
      <div style="border-top:1px solid #333;margin:6px 0;padding-top:4px;font-weight:600;">
        Tải video hàng loạt (chỉ click nút tải + chọn 720p/Original)
      </div>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        <button id="vr-scan-videos"
          style="flex:1;background:#555;border:none;border-radius:4px;
                 padding:5px 0;cursor:pointer;">Quét video trên trang</button>
        <button id="vr-download-all"
          style="flex:1;background:#1976d2;border:none;border-radius:4px;
                 padding:5px 0;cursor:pointer;">Tải tất cả video</button>
      </div>
      <div id="vr-video-list"
          style="max-height:100px;overflow:auto;border:1px solid #333;
                 border-radius:6px;padding:4px;margin-bottom:4px;
                 background:#050505;font-size:11px;"></div>
    </div>
    <div id="vr-log"
          style="margin-top:2px;font-size:11px;max-height:90px;overflow:auto;
                 border-top:1px solid #222;padding-top:3px;"></div>
  `;
  document.body.appendChild(ui);

  // --- VARIABLES & SELECTORS (Giữ nguyên) ---
  const bodyEl = ui.querySelector("#vr-body");
  const toggleBtn = ui.querySelector("#vr-toggle");
  const closeBtn = ui.querySelector("#vr-close");
  const scenesInput = ui.querySelector("#vr-scenes-input");
  const scenesList = ui.querySelector("#vr-scenes-list");
  const delayInput = ui.querySelector("#vr-delay");
  const logEl = ui.querySelector("#vr-log");
  const videoListEl = ui.querySelector("#vr-video-list");

  let scenes = [];
  let running = false;
  let timer = null;
  let downloadBtns = [];
  let collapsed = false;

  function log(msg) {
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML += `[${time}] ${msg}<br>`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  toggleBtn.onclick = () => {
    collapsed = !collapsed;
    bodyEl.style.display = collapsed ? "none" : "block";
    toggleBtn.textContent = collapsed ? "▴" : "▾";
  };

  closeBtn.onclick = () => {
    running = false;
    if (timer) clearTimeout(timer);
    ui.remove();
  };

  function parseScenes() {
    // Logic parse scenes (Giữ nguyên)
    const text = scenesInput.value.trim();
    scenes = [];
    scenesList.innerHTML = "";
    if (!text) { log("⚠️ Chưa có kịch bản."); return; }

    const matches = text.match(/\d+\.\s*[\s\S]*?(?=\n\s*\d+\.\s*|$)/g) || [];
    matches.forEach((block, idx) => {
      const cleaned = block.replace(/^\d+\.\s*/, "").trim();
      scenes.push({ id: idx + 1, prompt: cleaned });
      const row = document.createElement("div");
      row.style.borderBottom = "1px solid #222";
      row.style.padding = "3px 0";
      row.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px;">Cảnh ${idx + 1}</div>
        <div style="font-size:11px;opacity:0.8;max-height:40px;overflow:hidden;">${cleaned}</div>`;
      scenesList.appendChild(row);
    });
    log(`✅ Đã tách được ${scenes.length} cảnh.`);
  }

  // --- Cải tiến Logic Prompt Input ---

  // Tăng cường tìm kiếm ô prompt
  function findPromptBox() {
    // 1. Ô đang active
    let el = document.activeElement;
    if (el && (el.isContentEditable || el.tagName === "TEXTAREA" || el.tagName === "INPUT")) return el;
    
    // 2. Các selector cụ thể cho prompt/input box
    const candidates = document.querySelectorAll(
      '[contenteditable="true"], [contenteditable="plaintext-only"], textarea, input[type="text"],' +
      'div[role="textbox"],[data-testid*="prompt"],[data-testid*="composer"],[aria-label*="video"],[aria-label*="prompt"],[aria-label*="nhập"]'
    );
    // Ưu tiên các box nằm gần cuối trang/dưới cùng (thường là ô chat)
    const sortedCandidates = Array.from(candidates).sort((a, b) => {
      return b.getBoundingClientRect().y - a.getBoundingClientRect().y;
    });

    // Chỉ lấy 1-2 ứng viên cuối cùng
    if (sortedCandidates.length > 0) return sortedCandidates[0];
    
    return null;
  }

  // Mô phỏng dán (paste) cho contenteditable, ổn định hơn execCommand("insertText")
  function simulatePaste(el, text) {
      el.focus();
      // Xóa nội dung cũ
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("delete", false, null);

      // Mô phỏng dán
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);
      const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true
      });
      el.dispatchEvent(pasteEvent);
      el.dispatchEvent(new Event("input", { bubbles: true })); // Đảm bảo event input được kích hoạt
  }
  
  // Thiết lập giá trị cho input/textarea (Giữ nguyên logic cũ cho input/textarea)
  function setReactValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const desc  = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
  }

  function simulateTextarea(el, text) {
    el.focus();
    setReactValue(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    setReactValue(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function setPrompt(text) {
    let box = findPromptBox();
    if (!box) { log("❌ Không tìm thấy ô nhập prompt. Hãy click vào ô prompt rồi bấm Run."); return false; }

    if (box.isContentEditable) {
        simulatePaste(box, text); // Sử dụng Paste API cho contenteditable
    }
    else if (box.tagName === "TEXTAREA" || box.tagName === "INPUT") {
        simulateTextarea(box, text);
    }
    else {
        // Fallback cho các div không có contenteditable
        box.textContent = text;
        box.dispatchEvent(new Event("input", { bubbles:true }));
    }

    log("✅ Đã nhập prompt, chuẩn bị gửi bằng Enter.");
    return true;
  }

  // Logic gửi Enter (Giữ nguyên)
  function sendByEnter() {
    const box = findPromptBox();
    if (!box) { log("❌ Không tìm thấy ô prompt để gửi Enter."); return false; }
    box.focus();
    const opts = { key:"Enter", code:"Enter", keyCode:13, which:13, bubbles:true, cancelable:true };
    ["keydown","keypress","keyup"].forEach(type => {
      const ev = new KeyboardEvent(type, opts);
      box.dispatchEvent(ev);
      // document.dispatchEvent(new KeyboardEvent(type, opts)); // Đã tắt dispatch lên document
    });
    log("🔼 Đã gửi phím Enter (auto).");
    return true;
  }

  // Logic chạy Batch (Giữ nguyên)
  async function runBatch() {
    if (!scenes.length) { parseScenes(); if (!scenes.length) return; }
    const delay = parseInt(delayInput.value, 10) || 15000;
    running = true;
    log(`▶️ Bắt đầu chạy ${scenes.length} cảnh. Delay mỗi cảnh: ${delay}ms`);
    for (let i = 0; i < scenes.length; i++) {
      if (!running) { log("⏹ Đã dừng."); break; }
      const scene = scenes[i];
      log(`⏱ Chuẩn bị cảnh ${scene.id}/${scenes.length}`);
      if (!setPrompt(scene.prompt)) { running = false; break; }
      if (!sendByEnter())          { running = false; break; }
      log(`✅ Đã gửi cảnh ${scene.id}, chờ ${delay}ms trước cảnh tiếp theo...`);
      await new Promise(res => (timer = setTimeout(res, delay)));
    }
    running = false;
    log("🏁 Hoàn tất batch prompt.");
  }

  // ---------- QUÉT & CLICK TẢI ----------

  // Logic quét video (Giữ nguyên)
  function scanVideos() {
    downloadBtns = [];
    videoListEl.innerHTML = "";

    const allBtns = Array.from(document.querySelectorAll("button,a"));
    // Thêm các từ khóa như 'save'
    const keywords = /(tải|download|save)/i; 
    downloadBtns = allBtns.filter(el => {
      if (ui.contains(el)) return false;
      const txt  = (el.textContent || "").trim().toLowerCase();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase();
      // Loại bỏ các nút tải của chính userscript UI
      if (el.id === 'vr-download-all') return false; 
      
      // Kiểm tra cả role
      const role = el.getAttribute('role');

      return (keywords.test(txt) || keywords.test(aria)) && role !== 'menuitem';
    });

    if (downloadBtns.length) {
      videoListEl.innerHTML = downloadBtns.map((btn,i)=>{
        const txt  = (btn.textContent || "").trim() || "(không có text)";
        const aria = (btn.getAttribute("aria-label") || "").trim();
        return `<div style="margin-bottom:2px;">
          Nút ${i+1}: <span style="opacity:.9;">${txt}</span>
          ${aria ? `<span style="opacity:.6;"> [aria: ${aria}]</span>` : ""}
        </div>`;
      }).join("");
      log(`✅ Tìm được ${downloadBtns.length} nút "Tải xuống" trên trang Flow.`);
    } else {
      videoListEl.innerHTML = `<div>⚠️ Không tìm thấy nút tải video.</div>`;
      log("⚠️ Không tìm thấy nút tải video. Hãy đảm bảo video đã render xong.");
    }
  }

  // Tăng cường logic tìm 720p/Original/Best
  function clickBestResolutionMenu() {
    // Chờ một chút để menu hiện ra hoàn toàn
    return new Promise(resolve => {
        setTimeout(() => {
            const items = Array.from(document.querySelectorAll(
                '[role="menuitem"], div[role="menuitem"], li[role="menuitem"], button[role="menuitem"], [data-testid="download-option"]'
            ));
            
            let target = items.find(el => 
                /(kích thước gốc|original|best|720p|1080p)/i.test(el.textContent || "")
            );

            // Nếu không tìm thấy, thử tìm mục thứ 2 (thường là 720p nếu mục 1 là 480p)
            if (!target && items.length >= 2) target = items[1]; 
            
            if (target) {
                target.click();
                log('✅ Đã chọn "Kích thước gốc / 720p / Best" trong menu (nếu có).');
                resolve(true);
            } else {
                log("⚠️ Không tìm thấy mục 720p / Kích thước gốc sau khi bấm tải.");
                resolve(false);
            }
        }, 300); // Tăng thời gian chờ lên 300ms
    });
  }

  async function downloadAllVideos() {
    if (!downloadBtns.length) {
      log("⚠️ Chưa có nút tải nào. Hãy bấm Quét video trước.");
      return;
    }
    log(`⬇️ Sẽ lần lượt click ${downloadBtns.length} nút 'Tải xuống' + chọn 'Kích thước gốc (720p)'.`);

    let i = 0;
    for (const btn of downloadBtns) {
      i++;
      try {
        btn.click(); // mở menu tải
        await new Promise(res => setTimeout(res, 500)); // Chờ lâu hơn
        await clickBestResolutionMenu(); // Đã bao gồm chờ 300ms bên trong
        await new Promise(res => setTimeout(res, 1000)); // Chờ 1 giây để hành động tải bắt đầu

        // Đóng menu nếu nó vẫn còn (bằng cách click ra ngoài, nhưng khó – nên tiếp tục)
        log(`✅ Đã xử lý nút tải video ${i}. (Trình duyệt có thể mở tab xem/tải.)`);

      } catch (e) {
        log(`❌ Lỗi khi click nút ${i}: ${e.message}`);
      }
    }
    log("🏁 Đã click xong tất cả nút tải + chọn 720p/Original (nếu tìm thấy).");
  }

  // --- EVENTS (Giữ nguyên) ---
  ui.querySelector("#vr-parse").onclick        = parseScenes;
  ui.querySelector("#vr-run").onclick          = () => { if (!running) runBatch(); };
  ui.querySelector("#vr-stop").onclick         = () => { running = false; if (timer) clearTimeout(timer); log("⏹ Đã yêu cầu dừng."); };
  ui.querySelector("#vr-scan-videos").onclick  = scanVideos;
  ui.querySelector("#vr-download-all").onclick = downloadAllVideos;
})();
