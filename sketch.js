// 儲存 CSV 題庫資料。
let questionTable = null;

// 儲存隨機抽出的五道題目。
let quizQuestions = [];

// 儲存目前題目索引值。
let currentQuestion = 0;

// 儲存答對題數。
let score = 0;

// 儲存目前題目是否已作答。
let hasAnswered = false;

// 儲存使用者選擇的選項索引值。
let selectedOption = -1;

// 儲存使用者答案是否正確。
let selectedAnswerIsCorrect = false;

// 儲存下一題按鈕。
let nextButton;

// 儲存重新開始按鈕。
let restartButton;

// 儲存程式目前狀態。
let gameState = "loading";

// 儲存選項寬度。
let optionWidth;

// 儲存選項高度。
let optionHeight;

// 儲存選項間距。
let optionGap;

// 儲存選項起始位置。
let optionStartY;

// 儲存畫面邊界距離。
let pagePadding;

// 宣告 Google 字型名稱。
const googleFont = "Noto Sans TC";

// p5.js 在 setup() 前載入 CSV。
function preload() {
  // 載入與 index.html 位於同一資料夾的 questions.csv。
  questionTable = loadTable("questions.csv", "csv", "header");
}

// p5.js 初始化函式。
function setup() {
  // 建立全螢幕畫布。
  createCanvas(windowWidth, windowHeight);

  // 設定畫布使用 Google 字型。
  textFont(googleFont);

  // 設定文字置中。
  textAlign(CENTER, CENTER);

  // 設定矩形以中心點為基準。
  rectMode(CENTER);

  // 建立下一題按鈕。
  nextButton = createButton("下一題");

  // 設定下一題按鈕事件。
  nextButton.mousePressed(nextQuestion);

  // 設定下一題按鈕樣式。
  styleButton(nextButton);

  // 隱藏下一題按鈕。
  nextButton.hide();

  // 建立重新開始按鈕。
  restartButton = createButton("重新開始");

  // 設定重新開始按鈕事件。
  restartButton.mousePressed(restartQuiz);

  // 設定重新開始按鈕樣式。
  styleButton(restartButton);

  // 隱藏重新開始按鈕。
  restartButton.hide();

  // 更新響應式版面。
  updateResponsiveLayout();

  // 檢查 CSV 是否成功載入。
  if (!questionTable || questionTable.getRowCount() === 0) {
    // 設定錯誤狀態。
    gameState = "error";

    // 在主控台顯示錯誤。
    console.error("找不到 questions.csv，或 questions.csv 沒有資料。");

    // 結束 setup()。
    return;
  }

  // 建立測驗題目。
  prepareQuiz();
}

// p5.js 主要繪圖迴圈。
function draw() {
  // 設定背景顏色。
  background("#f4f4f4");

  // 顯示載入畫面。
  if (gameState === "loading") {
    // 顯示載入文字。
    drawLoadingScreen();

    // 結束本次繪圖。
    return;
  }

  // 顯示錯誤畫面。
  if (gameState === "error") {
    // 顯示錯誤訊息。
    drawErrorScreen();

    // 結束本次繪圖。
    return;
  }

  // 顯示測驗完成畫面。
  if (gameState === "finished") {
    // 顯示測驗結果。
    drawResult();

    // 更新重新開始按鈕位置。
    updateRestartButton();

    // 結束本次繪圖。
    return;
  }

  // 顯示目前題目。
  drawQuestion();

  // 顯示四個選項。
  drawOptions();

  // 更新下一題按鈕位置。
  updateNextButton();
}

// 建立測驗題目。
function prepareQuiz() {
  // 建立所有有效題目的陣列。
  let allQuestions = [];

  // 取得 CSV 所有資料列。
  let rows = questionTable.rows;

  // 逐列讀取 CSV 題目。
  for (let row of rows) {
    // 取得題目文字。
    let questionText = row.getString("question").trim();

    // 取得四個選項。
    let options = [
      row.getString("option1").trim(),
      row.getString("option2").trim(),
      row.getString("option3").trim(),
      row.getString("option4").trim()
    ];

    // 取得正確答案數字。
    let answerNumber = Number(row.getString("answer").trim());

    // 將答案由 1～4 轉成索引值 0～3。
    let answerIndex = answerNumber - 1;

    // 判斷題目文字是否為空白。
    let emptyQuestion = questionText === "";

    // 判斷選項是否有空白。
    let emptyOption = options.some((option) => option === "");

    // 判斷答案是否有效。
    let invalidAnswer = answerIndex < 0 || answerIndex > 3;

    // 跳過不完整的題目。
    if (emptyQuestion || emptyOption || invalidAnswer) {
      // 處理下一筆資料。
      continue;
    }

    // 將有效題目加入題庫。
    allQuestions.push({
      // 儲存題目編號。
      id: row.getString("id"),

      // 儲存題目文字。
      question: questionText,

      // 儲存四個選項。
      options: options,

      // 儲存正確答案索引值。
      answer: answerIndex
    });
  }

  // 判斷有效題目是否少於五題。
  if (allQuestions.length < 5) {
    // 設定錯誤狀態。
    gameState = "error";

    // 在主控台顯示錯誤。
    console.error("有效題目少於五題，目前只有：" + allQuestions.length + " 題。");

    // 結束函式。
    return;
  }

  // 複製題庫陣列。
  let shuffledQuestions = [...allQuestions];

  // 打亂題目順序。
  shuffleArray(shuffledQuestions);

  // 隨機抽出五題。
  quizQuestions = shuffledQuestions.slice(0, 5);

  // 設定目前為第一題。
  currentQuestion = 0;

  // 將分數歸零。
  score = 0;

  // 重設作答狀態。
  resetAnswerState();

  // 設定為進行中狀態。
  gameState = "playing";
}

// 使用 Fisher-Yates 演算法打亂陣列。
function shuffleArray(array) {
  // 從陣列最後一項開始往前處理。
  for (let i = array.length - 1; i > 0; i--) {
    // 隨機產生索引值。
    let randomIndex = floor(random(i + 1));

    // 暫存目前元素。
    let temporary = array[i];

    // 將隨機元素放至目前位置。
    array[i] = array[randomIndex];

    // 將暫存元素放至隨機位置。
    array[randomIndex] = temporary;
  }
}

// 顯示載入畫面。
function drawLoadingScreen() {
  // 設定文字顏色。
  fill("#333333");

  // 設定文字大小。
  textSize(getResponsiveTextSize(20, 27, 36));

  // 顯示載入文字。
  text("正在載入題庫，請稍候……", width / 2, height / 2);
}

// 顯示錯誤畫面。
function drawErrorScreen() {
  // 設定文字顏色。
  fill("#333333");

  // 設定標題文字大小。
  textSize(getResponsiveTextSize(24, 30, 38));

  // 顯示錯誤標題。
  text("題庫載入失敗", width / 2, height / 2 - 60);

  // 設定說明文字大小。
  textSize(getResponsiveTextSize(15, 20, 24));

  // 顯示錯誤說明。
  text(
    "請確認 index.html、sketch.js、questions.csv 位於同一個資料夾。",
    width / 2,
    height / 2,
    width - pagePadding * 2,
    100
  );
}

// 顯示目前題目。
function drawQuestion() {
  // 取得目前題目。
  let current = quizQuestions[currentQuestion];

  // 設定文字顏色。
  fill("#333333");

  // 設定題號文字大小。
  textSize(getResponsiveTextSize(18, 23, 28));

  // 顯示題號。
  text(
    "第 " + (currentQuestion + 1) + " 題 / 共 " + quizQuestions.length + " 題",
    width / 2,
    pagePadding
  );

  // 設定題目文字大小。
  textSize(getResponsiveTextSize(20, 27, 34));

  // 計算題目垂直位置。
  let questionY = pagePadding * 2.5;

  // 顯示題目。
  text(
    current.question,
    width / 2,
    questionY,
    width - pagePadding * 2,
    120
  );
}

// 顯示四個選項。
function drawOptions() {
  // 取得目前題目。
  let current = quizQuestions[currentQuestion];

  // 逐一繪製四個選項。
  for (let i = 0; i < current.options.length; i++) {
    // 計算選項基本位置。
    let baseY = optionStartY + i * (optionHeight + optionGap);

    // 設定左右位移。
    let offsetX = 0;

    // 設定上下位移。
    let offsetY = 0;

    // 判斷使用者是否答錯。
    if (hasAnswered && !selectedAnswerIsCorrect) {
      // 讓正確答案上下跳動。
      if (i === current.answer) {
        // 設定上下跳動動畫。
        offsetY = sin(frameCount * 0.15) * 8;
      }

      // 讓錯誤選項左右移動。
      if (i === selectedOption) {
        // 設定左右移動動畫。
        offsetX = sin(frameCount * 0.25) * 10;
      }
    }

    // 判斷是否為答錯時的正確選項。
    if (hasAnswered && !selectedAnswerIsCorrect && i === current.answer) {
      // 設定正確答案背景色。
      fill("#fdffb6");
    }

    // 判斷是否為錯誤選項。
    else if (
      hasAnswered &&
      !selectedAnswerIsCorrect &&
      i === selectedOption
    ) {
      // 設定錯誤答案背景色。
      fill("#ff4d6d");
    }

    // 判斷是否為答對選項。
    else if (
      hasAnswered &&
      selectedAnswerIsCorrect &&
      i === selectedOption
    ) {
      // 設定答對選項背景色。
      fill("#b7f7c5");
    }

    // 設定其他選項背景色。
    else {
      // 設定白色背景。
      fill("#ffffff");
    }

    // 設定選項邊框顏色。
    stroke("#777777");

    // 設定選項邊框粗細。
    strokeWeight(2);

    // 計算選項水平位置。
    let optionX = width / 2 + offsetX;

    // 計算選項垂直位置。
    let optionY = baseY + offsetY;

    // 繪製選項矩形。
    rect(optionX, optionY, optionWidth, optionHeight, 12);

    // 移除圖形邊框。
    noStroke();

    // 設定選項文字顏色。
    fill("#222222");

    // 設定選項文字大小。
    textSize(getResponsiveTextSize(15, 19, 23));

    // 顯示選項文字。
    text(current.options[i], optionX, optionY);
  }
}

// 處理滑鼠及觸控事件。
function mousePressed() {
  // 如果尚未進入測驗狀態，禁止作答。
  if (gameState !== "playing") {
    // 結束函式。
    return;
  }

  // 如果已經作答，禁止重複作答。
  if (hasAnswered) {
    // 結束函式。
    return;
  }

  // 取得目前題目。
  let current = quizQuestions[currentQuestion];

  // 逐一檢查選項。
  for (let i = 0; i < current.options.length; i++) {
    // 計算選項垂直位置。
    let optionY = optionStartY + i * (optionHeight + optionGap);

    // 計算選項左側邊界。
    let leftEdge = width / 2 - optionWidth / 2;

    // 計算選項右側邊界。
    let rightEdge = width / 2 + optionWidth / 2;

    // 計算選項上方邊界。
    let topEdge = optionY - optionHeight / 2;

    // 計算選項下方邊界。
    let bottomEdge = optionY + optionHeight / 2;

    // 判斷是否點擊選項。
    let isClicked =
      mouseX >= leftEdge &&
      mouseX <= rightEdge &&
      mouseY >= topEdge &&
      mouseY <= bottomEdge;

    // 如果使用者點擊了選項。
    if (isClicked) {
      // 記錄使用者選項。
      selectedOption = i;

      // 設定為已作答。
      hasAnswered = true;

      // 判斷答案是否正確。
      selectedAnswerIsCorrect = selectedOption === current.answer;

      // 如果答對，增加分數。
      if (selectedAnswerIsCorrect) {
        // 分數增加一分。
        score++;
      }

      // 顯示下一題按鈕。
      nextButton.show();

      // 結束迴圈。
      break;
    }
  }
}

// 前往下一題。
function nextQuestion() {
  // 如果尚未作答，禁止進入下一題。
  if (!hasAnswered) {
    // 結束函式。
    return;
  }

  // 題目索引值增加一。
  currentQuestion++;

  // 判斷是否完成全部題目。
  if (currentQuestion >= quizQuestions.length) {
    // 設定為完成狀態。
    gameState = "finished";

    // 隱藏下一題按鈕。
    nextButton.hide();

    // 顯示重新開始按鈕。
    restartButton.show();

    // 結束函式。
    return;
  }

  // 重設作答狀態。
  resetAnswerState();

  // 隱藏下一題按鈕。
  nextButton.hide();
}

// 重設作答狀態。
function resetAnswerState() {
  // 設定為尚未作答。
  hasAnswered = false;

  // 清除使用者選項。
  selectedOption = -1;

  // 清除答案正確狀態。
  selectedAnswerIsCorrect = false;
}

// 重新開始測驗。
function restartQuiz() {
  // 隱藏重新開始按鈕。
  restartButton.hide();

  // 重新隨機抽出五題。
  prepareQuiz();
}

// 設定按鈕樣式。
function styleButton(button) {
  // 設定按鈕文字大小。
  button.style("font-size", "18px");

  // 設定按鈕使用 Google 字型。
  button.style("font-family", "'Noto Sans TC', sans-serif");

  // 設定按鈕內距。
  button.style("padding", "12px 28px");

  // 設定按鈕背景色。
  button.style("background-color", "#4d96ff");

  // 設定按鈕文字顏色。
  button.style("color", "#ffffff");

  // 移除按鈕外框。
  button.style("border", "none");

  // 設定按鈕圓角。
  button.style("border-radius", "10px");

  // 設定滑鼠游標。
  button.style("cursor", "pointer");

  // 設定觸控操作方式。
  button.style("touch-action", "manipulation");
}

// 更新響應式版面。
function updateResponsiveLayout() {
  // 設定畫面左右邊界距離。
  pagePadding = constrain(width * 0.06, 18, 80);

  // 設定選項寬度。
  optionWidth = min(width - pagePadding * 2, 650);

  // 設定選項高度。
  optionHeight = constrain(width * 0.1, 54, 78);

  // 設定選項間距。
  optionGap = constrain(width * 0.025, 12, 24);

  // 設定選項起始位置。
  optionStartY = constrain(height * 0.36, 220, 390);
}

// 取得響應式文字大小。
function getResponsiveTextSize(smallSize, mediumSize, largeSize) {
  // 判斷是否為手機尺寸。
  if (width < 500) {
    // 回傳手機文字大小。
    return smallSize;
  }

  // 判斷是否為平板尺寸。
  if (width < 900) {
    // 回傳平板文字大小。
    return mediumSize;
  }

  // 回傳電腦文字大小。
  return largeSize;
}

// 更新下一題按鈕位置。
function updateNextButton() {
  // 判斷下一題按鈕是否應該顯示。
  if (hasAnswered && currentQuestion < quizQuestions.length) {
    // 取得按鈕寬度。
    let buttonWidth = nextButton.width;

    // 取得按鈕高度。
    let buttonHeight = nextButton.height;

    // 計算按鈕水平位置。
    let buttonX = width / 2 - buttonWidth / 2;

    // 計算按鈕垂直位置。
    let buttonY = height - buttonHeight - pagePadding;

    // 設定按鈕位置。
    nextButton.position(buttonX, buttonY);
  }
}

// 更新重新開始按鈕位置。
function updateRestartButton() {
  // 取得按鈕寬度。
  let buttonWidth = restartButton.width;

  // 取得按鈕高度。
  let buttonHeight = restartButton.height;

  // 計算按鈕水平位置。
  let buttonX = width / 2 - buttonWidth / 2;

  // 計算按鈕垂直位置。
  let buttonY = height / 2 + 120;

  // 設定按鈕位置。
  restartButton.position(buttonX, buttonY);
}

// 當瀏覽器視窗大小改變時執行。
function windowResized() {
  // 重新調整畫布大小。
  resizeCanvas(windowWidth, windowHeight);

  // 更新響應式版面。
  updateResponsiveLayout();

  // 更新下一題按鈕位置。
  updateNextButton();

  // 更新重新開始按鈕位置。
  updateRestartButton();
}