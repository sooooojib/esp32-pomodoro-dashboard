#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <time.h>
#include <esp_wifi.h>
#include <esp_arduino_version.h>

// ================= USER CONFIGURATION =================
const char* WIFI_SSID     = "sojib";
const char* WIFI_PASS     = "Sajib3296";
const char* SUPABASE_URL  = "https://ykncypzibxorhaatyqah.supabase.co";
const char* SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbmN5cHppYnhvcmhhYXR5cWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxOTE4MDgsImV4cCI6MjEwNzc2NzgwOH0.cVWlzZOw5et55NiYcp3n1g6ophDvmp-GgCHyo9Vf5sI";

// Volume Duty Cycles (8-bit PWM: 128 = 100% max volume)
#define BUZZER_CLICK_DUTY         24      // ~30% loudness for button clicks & prompts
#define BUZZER_ALARM_DUTY         64      // ~40% louder for the continuous finish alarm

// Timeouts (in milliseconds)
#define RESET_PROMPT_TIMEOUT_MS   6000UL  // Auto-cancel reset prompt after 6 seconds
#define ALARM_SILENCE_TIMEOUT_MS  90000UL // Auto-silence finish buzzer after 90 seconds

// Bangladesh Standard Time (BST = UTC+6, POSIX string "BST-6")
const char* TZ_INFO       = "BST-6";
const char* NTP_SERVER_1  = "bd.pool.ntp.org";
const char* NTP_SERVER_2  = "time.google.com";
const char* NTP_SERVER_3  = "pool.ntp.org";

// ---------- Power / heat tuning ----------
#define CPU_MHZ                 80
#define WIFI_TX_POWER           WIFI_POWER_17dBm
#define LOOP_DELAY_MS           20
#define CLOUD_HEARTBEAT_SECS    60
#define CONTRAST_NORMAL         120
#define DEBUG_SERIAL            0
// ======================================================

#if DEBUG_SERIAL
  #define LOGF(...) Serial.printf(__VA_ARGS__)
#else
  #define LOGF(...) do {} while (0)
#endif

// --- Pin Definitions (30-Pin ESP32-WROOM-32) ---
#define OLED_SDA_PIN     21
#define OLED_SCL_PIN     22
#define START_BTN_PIN    18
#define RESET_BTN_PIN    19
#define MODE_BTN_PIN     23
#define BUZZER_PIN       27
#define WORK_LED_PIN     4
#define BREAK_LED_PIN    5

Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);
Preferences prefs;

// --- System Operational Modes ---
enum DisplayMode { MODE_POMODORO, MODE_CLOCK, MODE_SPECIAL };
DisplayMode currentDisplayMode = MODE_CLOCK;

// --- Pomodoro Durations (in seconds) ---
const uint32_t DURATION_WORK        = 25 * 60;
const uint32_t DURATION_SHORT_BREAK = 5 * 60;
const uint32_t DURATION_LONG_BREAK  = 15 * 60;

enum PomodoroState { STATE_WORK = 0, STATE_SHORT_BREAK = 1, STATE_LONG_BREAK = 2 };
PomodoroState currentState = STATE_WORK;

// --- Normal Pomodoro State Variables ---
bool isRunning = false;
bool isAlarming = false;
bool isAlarmSilenced = false;
bool isConfirmingReset = false;
uint32_t remainingSeconds = DURATION_WORK;
uint32_t totalPhaseSeconds = DURATION_WORK;
uint8_t pomodoroCount = 0;

// --- Special Session (5-60m in 5m steps) State Variables ---
bool activeTimerIsSpecial = false;
bool isSpecialSetting     = false;
uint8_t specialMinutes    = 25;
uint32_t specialRemainingSeconds = 25 * 60;
uint32_t specialTotalSeconds     = 25 * 60;
bool specialDialDirty     = false;
uint32_t lastDialChange   = 0;

// --- Timing & Auto-Timeout Trackers ---
uint32_t lastTick = 0;
uint32_t resetPromptStartMillis = 0;
uint32_t alarmStartMillis = 0;
int lastDrawnSecond = -1;
uint32_t lastClockSyncRetry = 0;

// --- Non-Blocking Buzzer Sequencer ---
struct ToneStep {
  uint16_t freq;
  uint8_t  duty;
  uint16_t durationMs;
};

const uint8_t MAX_TONE_STEPS = 4;
ToneStep toneSeq[MAX_TONE_STEPS];
uint8_t toneStepCount = 0;
uint8_t toneStepIndex = 0;
uint32_t toneStepStart = 0;
bool toneSeqActive = false;

// --- Unified Button Debouncer ---
enum { BTN_START = 0, BTN_RESET = 1, BTN_MODE = 2 };
const uint32_t debounceDelay = 50;

struct Button {
  uint8_t  pin;
  int      lastReading;
  int      state;
  uint32_t lastChange;
};

Button buttons[3] = {
  { START_BTN_PIN, HIGH, HIGH, 0 },
  { RESET_BTN_PIN, HIGH, HIGH, 0 },
  { MODE_BTN_PIN,  HIGH, HIGH, 0 }
};

// --- Background Sync Queue & Structures ---
enum SyncAction { ACTION_UPDATE_STATE, ACTION_LOG_SESSION };

struct SyncMessage {
  SyncAction action;
  char phase[16];
  bool running;
  uint32_t remaining;
  uint32_t total;
  uint8_t count;
  uint32_t durationMins;
  char completedAt[24]; // ISO-8601 UTC timestamp ("YYYY-MM-DDTHH:MM:SSZ")
};

QueueHandle_t syncQueue = nullptr;

static WiFiClientSecure secureClient;
static HTTPClient httpClient;

// --- Function Prototypes ---
void initBuzzerPWM();
void setBuzzerTone(unsigned int freq, uint8_t duty = BUZZER_CLICK_DUTY);
void stopBuzzer();
void startToneSequence(const ToneStep* steps, uint8_t count);
void updateBuzzerSequencer();
void saveCheckpoint();
void loadCheckpoint();
void drawCentered(const char* text, int y, uint8_t size = 1);
void safeDisplayFlush();
void renderBootScreen(const char* line1, const char* line2);
void updateOledDisplay();
void renderClockDisplay();
void renderSpecialDisplay();
void drawProgressLine(int xStart, int y, int maxWidth, float progress);
bool wasPressed(uint8_t idx);
void handleMainButton();
void handleResetButton();
void handleModeButton();
void handleAlarmBuzzer();
void handleTimeouts();
void advanceState();
void executeReset();
void skipBreakToWork();
void updateOutputs();
void playButtonClickBeep();
void playResetPromptBeepBeep();
void playResetConfirmedBeep();
void queueStateSync();
void queueSessionLog(const char* phaseName, uint32_t mins);
void supabaseBackgroundWorker(void* parameter);
bool getClock(struct tm* out);
void getUtcIsoTimestamp(char* buf, size_t len);

const char* getPhaseName(PomodoroState state) {
  switch (state) {
    case STATE_WORK:        return "WORK";
    case STATE_SHORT_BREAK: return "SHORT_BREAK";
    case STATE_LONG_BREAK:  return "LONG_BREAK";
    default:                return "WORK";
  }
}

uint32_t getDurationForState(PomodoroState state) {
  switch (state) {
    case STATE_WORK:        return DURATION_WORK;
    case STATE_SHORT_BREAK: return DURATION_SHORT_BREAK;
    case STATE_LONG_BREAK:  return DURATION_LONG_BREAK;
    default:                return DURATION_WORK;
  }
}

bool getClock(struct tm* out) {
  time_t now = time(nullptr);
  if (now < 1700000000L) return false;
  localtime_r(&now, out);
  return true;
}

void getUtcIsoTimestamp(char* buf, size_t len) {
  time_t now = time(nullptr);
  if (now < 1700000000L) {
    buf[0] = '\0'; // NTP not synced yet; let Supabase default to now()
    return;
  }
  struct tm utcTm;
  gmtime_r(&now, &utcTm);
  strftime(buf, len, "%Y-%m-%dT%H:%M:%SZ", &utcTm);
}

// --- Dual-Level PWM Tone Engine & Non-Blocking Sequencer ---
void initBuzzerPWM() {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
  ledcAttach(BUZZER_PIN, 2000, 8);
  ledcWrite(BUZZER_PIN, 0);
#else
  ledcSetup(0, 2000, 8);
  ledcAttachPin(BUZZER_PIN, 0);
  ledcWrite(0, 0);
#endif
}

void setBuzzerTone(unsigned int freq, uint8_t duty) {
  if (freq == 0) {
    stopBuzzer();
    return;
  }
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
  ledcChangeFrequency(BUZZER_PIN, freq, 8);
  ledcWrite(BUZZER_PIN, duty);
#else
  ledcWriteTone(0, freq);
  ledcWrite(0, duty);
#endif
}

void stopBuzzer() {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
  ledcWrite(BUZZER_PIN, 0);
#else
  ledcWrite(0, 0);
#endif
}

void startToneSequence(const ToneStep* steps, uint8_t count) {
  if (count == 0 || count > MAX_TONE_STEPS) return;
  for (uint8_t i = 0; i < count; i++) {
    toneSeq[i] = steps[i];
  }
  toneStepCount = count;
  toneStepIndex = 0;
  toneStepStart = millis();
  toneSeqActive = true;

  if (toneSeq[0].freq > 0) {
    setBuzzerTone(toneSeq[0].freq, toneSeq[0].duty);
  } else {
    stopBuzzer();
  }
}

void updateBuzzerSequencer() {
  if (!toneSeqActive) return;

  if (millis() - toneStepStart >= toneSeq[toneStepIndex].durationMs) {
    toneStepIndex++;
    if (toneStepIndex >= toneStepCount) {
      stopBuzzer();
      toneSeqActive = false;
    } else {
      toneStepStart = millis();
      if (toneSeq[toneStepIndex].freq > 0) {
        setBuzzerTone(toneSeq[toneStepIndex].freq, toneSeq[toneStepIndex].duty);
      } else {
        stopBuzzer();
      }
    }
  }
}

void playButtonClickBeep() {
  static const ToneStep seq[] = {
    { 2400, BUZZER_CLICK_DUTY, 45 }
  };
  startToneSequence(seq, 1);
}

void playResetPromptBeepBeep() {
  static const ToneStep seq[] = {
    { 2000, BUZZER_CLICK_DUTY, 70 },
    { 0,    0,                 70 },
    { 2000, BUZZER_CLICK_DUTY, 70 }
  };
  startToneSequence(seq, 3);
}

void playResetConfirmedBeep() {
  static const ToneStep seq[] = {
    { 2000, BUZZER_CLICK_DUTY, 65 },
    { 1200, BUZZER_CLICK_DUTY, 95 }
  };
  startToneSequence(seq, 2);
}

void saveCheckpoint() {
  prefs.putUChar("state", (uint8_t)currentState);
  prefs.putUChar("count", pomodoroCount);
  prefs.putUInt("rem", remainingSeconds);
  prefs.putUChar("spec_min", specialMinutes);
  prefs.putUInt("spec_rem", specialRemainingSeconds);
  prefs.putBool("in_spec", activeTimerIsSpecial && !isSpecialSetting);
}

void loadCheckpoint() {
  uint8_t savedState = prefs.getUChar("state", (uint8_t)STATE_WORK);
  if (savedState > 2) savedState = 0;

  currentState = (PomodoroState)savedState;
  totalPhaseSeconds = getDurationForState(currentState);

  pomodoroCount = prefs.getUChar("count", 0);
  if (currentState == STATE_LONG_BREAK) {
    if (pomodoroCount > 4) pomodoroCount = 4;
  } else {
    if (pomodoroCount >= 4) pomodoroCount = 0;
  }

  remainingSeconds = prefs.getUInt("rem", totalPhaseSeconds);
  if (remainingSeconds > totalPhaseSeconds || remainingSeconds == 0) {
    remainingSeconds = totalPhaseSeconds;
  }

  specialMinutes = prefs.getUChar("spec_min", 25);
  if (specialMinutes < 5 || specialMinutes > 60 || (specialMinutes % 5 != 0)) {
    specialMinutes = 25;
  }
  specialTotalSeconds = (uint32_t)specialMinutes * 60;

  specialRemainingSeconds = prefs.getUInt("spec_rem", specialTotalSeconds);
  if (specialRemainingSeconds > specialTotalSeconds || specialRemainingSeconds == 0) {
    specialRemainingSeconds = specialTotalSeconds;
  }

  bool wasInSpecial = prefs.getBool("in_spec", false);
  activeTimerIsSpecial = wasInSpecial;
  isSpecialSetting = false;

  currentDisplayMode = MODE_CLOCK;
  isAlarming = false;
  isAlarmSilenced = false;
  isConfirmingReset = false;
  isRunning = false;
}

// Centers text horizontally within the visible 124px glass area (center = 63)
void drawCentered(const char* text, int y, uint8_t size) {
  int len = strlen(text);
  int pxWidth = (len * 6 * size) - size;
  int x = (126 - pxWidth) / 2;
  if (x < 2) x = 2;
  display.setTextSize(size);
  display.setCursor(x, y);
  display.print(text);
}

// Prevents SH1106 vertical/horizontal hardware shift from Wi-Fi/breadboard noise
void safeDisplayFlush() {
  display.oled_command(0x40); // Lock display start line to 0
  display.oled_command(0xD3); // Set display vertical offset
  display.oled_command(0x00); // Offset = 0
  display.display();
}

// Fixed-position boot screen so header & line never jump during startup
void renderBootScreen(const char* line1, const char* line2) {
  display.clearDisplay();
  drawCentered("FOCUS HUD", 10, 1);
  display.drawFastHLine(14, 22, 98, SH110X_WHITE);
  drawCentered(line1, 30, 1);
  if (line2 && strlen(line2) > 0) {
    drawCentered(line2, 43, 1);
  }
  safeDisplayFlush();
}

void setup() {
  setCpuFrequencyMhz(CPU_MHZ);
#if DEBUG_SERIAL
  Serial.begin(115200);
  delay(200);
#endif

  initBuzzerPWM();

  pinMode(WORK_LED_PIN, OUTPUT);
  digitalWrite(WORK_LED_PIN, LOW);
  pinMode(BREAK_LED_PIN, OUTPUT);
  digitalWrite(BREAK_LED_PIN, LOW);

  pinMode(START_BTN_PIN, INPUT_PULLUP);
  pinMode(RESET_BTN_PIN, INPUT_PULLUP);
  pinMode(MODE_BTN_PIN, INPUT_PULLUP);

  prefs.begin("pomodoro", false);
  loadCheckpoint();

  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  Wire.setClock(100000);
  Wire.setTimeOut(50);
  delay(50);

  if (!display.begin(0x3C, true)) {
    LOGF("[ERROR] SH1106 OLED not found at 0x3C!\n");
    for (int i = 0; i < 3; i++) {
      digitalWrite(WORK_LED_PIN, HIGH);
      delay(100);
      digitalWrite(WORK_LED_PIN, LOW);
      digitalWrite(BREAK_LED_PIN, HIGH);
      delay(100);
      digitalWrite(BREAK_LED_PIN, LOW);
    }
  }

  display.setRotation(2);
  display.setContrast(CONTRAST_NORMAL);
  display.setTextColor(SH110X_WHITE);

  // Boot Step 1: Show Wi-Fi Connecting Screen (capped at 5s max wait)
  renderBootScreen("CONNECTING WIFI", WIFI_SSID);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  WiFi.setTxPower(WIFI_TX_POWER);
  esp_wifi_set_ps(WIFI_PS_MIN_MODEM);
  configTzTime(TZ_INFO, NTP_SERVER_1, NTP_SERVER_2, NTP_SERVER_3);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    attempts++;
  }

  // Boot Step 2: Show Wi-Fi Confirmation Screen
  if (WiFi.status() == WL_CONNECTED) {
    String ipStr = WiFi.localIP().toString();
    renderBootScreen("WIFI CONNECTED", ipStr.c_str());
  } else {
    renderBootScreen("WIFI SYNCING...", "NVS ACTIVE");
  }
  delay(1000);

  syncQueue = xQueueCreate(15, sizeof(SyncMessage));

  xTaskCreatePinnedToCore(
    supabaseBackgroundWorker,
    "SupabaseWorker",
    8192,
    NULL,
    1,
    NULL,
    0
  );

  queueStateSync();
  updateOutputs();

  // Boot Step 3: Land directly on the 12-Hour BD Time Clock
  currentDisplayMode = MODE_CLOCK;
  lastDrawnSecond = -1;
  renderClockDisplay();
}

void loop() {
  updateBuzzerSequencer();
  handleMainButton();
  handleResetButton();
  handleModeButton();
  handleTimeouts();
  handleAlarmBuzzer();

  // Debounced cloud sync when stepping +5M on the SPECIAL SET screen
  if (specialDialDirty && (millis() - lastDialChange >= 800)) {
    specialDialDirty = false;
    queueStateSync();
  }

  // 1-Second Countdown Engine (Zero-drift catch-up loop)
  if (isRunning && !isAlarming && !isConfirmingReset) {
    uint32_t currentMillis = millis();

    // Safety cap if millis() ever jumped vastly
    if (currentMillis - lastTick > 10000UL) {
      lastTick = currentMillis - 1000UL;
    }

    bool displayNeedsUpdate = false;
    while (currentMillis - lastTick >= 1000UL) {
      lastTick += 1000UL;

      uint32_t &activeRem = activeTimerIsSpecial ? specialRemainingSeconds : remainingSeconds;
      uint32_t activeTot  = activeTimerIsSpecial ? specialTotalSeconds : totalPhaseSeconds;

      if (activeRem > 0) {
        activeRem--;
        displayNeedsUpdate = true;

        if (activeRem > 0 && (activeRem % 60 == 0)) {
          saveCheckpoint();
          if (activeRem % CLOUD_HEARTBEAT_SECS == 0) {
            queueStateSync();
          }
        }

        // Timer Hit 00:00
        if (activeRem == 0) {
          isRunning = false;
          isAlarming = true;
          isAlarmSilenced = false;
          alarmStartMillis = millis();
          currentDisplayMode = activeTimerIsSpecial ? MODE_SPECIAL : MODE_POMODORO;
          updateOutputs();
          displayNeedsUpdate = true;

          if (activeTimerIsSpecial) {
            queueSessionLog("SPECIAL", specialMinutes);
          } else {
            queueSessionLog(getPhaseName(currentState), activeTot / 60);
          }
          queueStateSync();
          break;
        }
      }
    }

    if (displayNeedsUpdate && (currentDisplayMode == MODE_POMODORO || currentDisplayMode == MODE_SPECIAL)) {
      updateOledDisplay();
    }
  }

  // Live Clock Refresh (1fps)
  if (currentDisplayMode == MODE_CLOCK) {
    struct tm timeinfo;
    if (getClock(&timeinfo)) {
      if (timeinfo.tm_sec != lastDrawnSecond) {
        lastDrawnSecond = timeinfo.tm_sec;
        renderClockDisplay();
      }
    } else {
      if (millis() - lastClockSyncRetry > 1000) {
        lastClockSyncRetry = millis();
        renderClockDisplay();
      }
    }
  }

  delay(LOOP_DELAY_MS);
}

// Auto-cancels reset confirmation after 6s & auto-silences alarm buzzer after 90s
void handleTimeouts() {
  uint32_t now = millis();

  if (isConfirmingReset && (now - resetPromptStartMillis >= RESET_PROMPT_TIMEOUT_MS)) {
    isConfirmingReset = false;
    lastTick = now;
    playButtonClickBeep();
    updateOutputs();
    updateOledDisplay();
    queueStateSync();
  }

  if (isAlarming && !isAlarmSilenced && (now - alarmStartMillis >= ALARM_SILENCE_TIMEOUT_MS)) {
    isAlarmSilenced = true;
    stopBuzzer();
  }
}

bool wasPressed(uint8_t idx) {
  Button &b = buttons[idx];
  int reading = digitalRead(b.pin);
  bool pressed = false;

  if (reading != b.lastReading) {
    b.lastChange = millis();
  }
  if ((millis() - b.lastChange) > debounceDelay && reading != b.state) {
    b.state = reading;
    if (b.state == LOW) pressed = true;
  }
  b.lastReading = reading;
  return pressed;
}

// Handles MODE Button (D23):
// - When Running (RUN): Toggles strictly between Active Timer (Pomo OR Special) <-> CLOCK
// - When Paused (HOLD):
//     If a Special Session is paused mid-countdown, Clock -> Special -> Pomodoro -> Clock
//     Otherwise normal cycle: Clock -> Pomodoro -> Special (SET) -> Clock
void handleModeButton() {
  if (!wasPressed(BTN_MODE)) return;
  if (isAlarming || isConfirmingReset) return;

  playButtonClickBeep();

  // CASE 1: Timer is actively RUNNING (Lock out switching between Pomo and Special)
  if (isRunning) {
    if (currentDisplayMode == MODE_CLOCK) {
      currentDisplayMode = activeTimerIsSpecial ? MODE_SPECIAL : MODE_POMODORO;
      updateOledDisplay();
    } else {
      currentDisplayMode = MODE_CLOCK;
      lastDrawnSecond = -1;
      renderClockDisplay();
    }
    return;
  }

  // CASE 2: Timer is PAUSED / IDLE (HOLD)
  bool specialPausedMidRun = (specialRemainingSeconds < specialTotalSeconds && specialRemainingSeconds > 0);

  if (currentDisplayMode == MODE_CLOCK) {
    if (specialPausedMidRun) {
      // Resume viewing the paused Special Session directly
      activeTimerIsSpecial = true;
      isSpecialSetting = false;
      currentDisplayMode = MODE_SPECIAL;
    } else {
      // Normal 1st Toggle from Clock -> Normal Pomodoro (HOLD)
      specialDialDirty = false;
      activeTimerIsSpecial = false;
      isSpecialSetting = false;
      currentDisplayMode = MODE_POMODORO;
    }
    updateOutputs();
    updateOledDisplay();
    queueStateSync();
  }
  else if (currentDisplayMode == MODE_POMODORO) {
    if (specialPausedMidRun) {
      currentDisplayMode = MODE_CLOCK;
      lastDrawnSecond = -1;
      renderClockDisplay();
    } else {
      // 2nd Toggle -> Special Session (SET screen)
      activeTimerIsSpecial = true;
      isSpecialSetting = true;
      specialTotalSeconds = (uint32_t)specialMinutes * 60;
      specialRemainingSeconds = specialTotalSeconds;
      currentDisplayMode = MODE_SPECIAL;
      updateOutputs();
      updateOledDisplay();
      queueStateSync();
    }
  }
  else if (currentDisplayMode == MODE_SPECIAL) {
    specialDialDirty = false;
    if (specialPausedMidRun) {
      // Allow switching to Pomodoro (HOLD) if user wants normal Pomodoro instead
      activeTimerIsSpecial = false;
      isSpecialSetting = false;
      currentDisplayMode = MODE_POMODORO;
      updateOutputs();
      updateOledDisplay();
      queueStateSync();
    } else {
      // 3rd Toggle -> Return to Clock
      currentDisplayMode = MODE_CLOCK;
      lastDrawnSecond = -1;
      renderClockDisplay();
    }
  }
}

void handleMainButton() {
  if (!wasPressed(BTN_START)) return;

  // If viewing Clock, return to active/last timer view without toggling pause
  if (currentDisplayMode == MODE_CLOCK) {
    playButtonClickBeep();
    currentDisplayMode = activeTimerIsSpecial ? MODE_SPECIAL : MODE_POMODORO;
    updateOledDisplay();
    return;
  }

  // If in SPECIAL SET screen: Lock in time and START countdown!
  if (currentDisplayMode == MODE_SPECIAL && isSpecialSetting) {
    playButtonClickBeep();
    specialDialDirty = false;
    isSpecialSetting = false;
    activeTimerIsSpecial = true;
    specialTotalSeconds = (uint32_t)specialMinutes * 60;
    specialRemainingSeconds = specialTotalSeconds;
    isRunning = true;
    lastTick = millis();
    saveCheckpoint();
    updateOutputs();
    updateOledDisplay();
    queueStateSync();
    return;
  }

  if (isConfirmingReset) {
    isConfirmingReset = false;
    playButtonClickBeep();
    lastTick = millis();
    updateOutputs();
    updateOledDisplay();
    queueStateSync();
  }
  else if (isAlarming) {
    isAlarming = false;
    isAlarmSilenced = false;
    stopBuzzer();
    playButtonClickBeep();
    advanceState();
  }
  else {
    playButtonClickBeep();
    isRunning = !isRunning;
    if (isRunning) {
      lastTick = millis();
    } else {
      saveCheckpoint();
    }
    updateOutputs();
    updateOledDisplay();
    queueStateSync();
  }
}

void handleResetButton() {
  if (!wasPressed(BTN_RESET)) return;

  // Lock Reset button when WORK DONE / BREAK DONE / SPECIAL DONE alarm is active
  if (isAlarming) return;

  if (currentDisplayMode == MODE_CLOCK) {
    playButtonClickBeep();
    currentDisplayMode = activeTimerIsSpecial ? MODE_SPECIAL : MODE_POMODORO;
    updateOledDisplay();
    return;
  }

  // In SPECIAL SET screen: Step +5 Minutes per click (5 -> 10 ... 60 -> 5)
  if (currentDisplayMode == MODE_SPECIAL && isSpecialSetting) {
    playButtonClickBeep();
    specialMinutes += 5;
    if (specialMinutes > 60) {
      specialMinutes = 5;
    }
    specialTotalSeconds = (uint32_t)specialMinutes * 60;
    specialRemainingSeconds = specialTotalSeconds;
    specialDialDirty = true;
    lastDialChange = millis();
    updateOledDisplay();
    return;
  }

  if (!isConfirmingReset) {
    isConfirmingReset = true;
    resetPromptStartMillis = millis();
    stopBuzzer();
    playResetPromptBeepBeep();
    updateOledDisplay();
    queueStateSync();
  } else {
    if (!activeTimerIsSpecial && (currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK)) {
      skipBreakToWork();
    } else {
      executeReset();
    }
  }
}

void executeReset() {
  isConfirmingReset = false;
  isAlarming = false;
  isAlarmSilenced = false;
  stopBuzzer();
  playResetConfirmedBeep();

  if (activeTimerIsSpecial) {
    isRunning = false;
    isSpecialSetting = true;
    specialTotalSeconds = (uint32_t)specialMinutes * 60;
    specialRemainingSeconds = specialTotalSeconds;
  } else {
    remainingSeconds = totalPhaseSeconds;
    isRunning = false;
  }

  saveCheckpoint();
  updateOutputs();
  updateOledDisplay();
  queueStateSync();
}

void skipBreakToWork() {
  isConfirmingReset = false;
  isAlarming = false;
  isAlarmSilenced = false;
  stopBuzzer();
  playResetConfirmedBeep();

  if (currentState == STATE_LONG_BREAK || pomodoroCount >= 4) {
    pomodoroCount = 0;
  }

  currentState = STATE_WORK;
  totalPhaseSeconds = DURATION_WORK;
  remainingSeconds = DURATION_WORK;
  isRunning = false;
  lastTick = millis();

  saveCheckpoint();
  updateOutputs();
  updateOledDisplay();
  queueStateSync();
}

// Continuous finish alarm: uses boosted BUZZER_ALARM_DUTY (40% louder) & yields to short beeps
void handleAlarmBuzzer() {
  static uint32_t lastToggle = 0;
  static bool soundState = false;

  if (!isAlarming || isAlarmSilenced || isConfirmingReset || toneSeqActive) {
    soundState = false;
    return;
  }

  uint32_t currentMillis = millis();
  uint32_t interval = soundState ? 250 : 200;

  if (currentMillis - lastToggle >= interval) {
    lastToggle = currentMillis;
    soundState = !soundState;

    if (soundState) {
      setBuzzerTone(2200, BUZZER_ALARM_DUTY);
    } else {
      stopBuzzer();
    }
  }
}

void advanceState() {
  if (activeTimerIsSpecial) {
    isRunning = false;
    isSpecialSetting = true;
    specialTotalSeconds = (uint32_t)specialMinutes * 60;
    specialRemainingSeconds = specialTotalSeconds;
    currentDisplayMode = MODE_SPECIAL;

    saveCheckpoint();
    updateOutputs();
    updateOledDisplay();
    queueStateSync();
    return;
  }

  if (currentState == STATE_WORK) {
    pomodoroCount++;
    if (pomodoroCount >= 4) {
      currentState = STATE_LONG_BREAK;
      totalPhaseSeconds = DURATION_LONG_BREAK;
    } else {
      currentState = STATE_SHORT_BREAK;
      totalPhaseSeconds = DURATION_SHORT_BREAK;
    }
  } else {
    if (currentState == STATE_LONG_BREAK || pomodoroCount >= 4) {
      pomodoroCount = 0;
    }
    currentState = STATE_WORK;
    totalPhaseSeconds = DURATION_WORK;
  }

  remainingSeconds = totalPhaseSeconds;
  isRunning = true;
  lastTick = millis();

  saveCheckpoint();
  updateOutputs();
  updateOledDisplay();
  queueStateSync();
}

void updateOutputs() {
  bool active = isRunning || isAlarming;
  bool isWorkOrSpec = activeTimerIsSpecial || (currentState == STATE_WORK);
  bool isBreak = !activeTimerIsSpecial && (currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK);

  digitalWrite(WORK_LED_PIN,  (isWorkOrSpec && active) ? HIGH : LOW);
  digitalWrite(BREAK_LED_PIN, (isBreak && active) ? HIGH : LOW);
}

// Helper: Draws a 2px solid progress bar with a 1px dotted remainder track
void drawProgressLine(int xStart, int y, int maxWidth, float progress) {
  if (progress < 0.0f) progress = 0.0f;
  if (progress > 1.0f) progress = 1.0f;

  int solidWidth = (int)(progress * maxWidth);
  if (solidWidth > 0) {
    display.fillRect(xStart, y, solidWidth, 2, SH110X_WHITE);
  }
  for (int x = xStart + solidWidth + 3; x <= xStart + maxWidth; x += 4) {
    display.drawPixel(x, y, SH110X_WHITE);
  }
}

// --- OLED: Clock Mode (Option B — Dynamic "Pomo:XX" / "Special:XX" / Blank) ---
void renderClockDisplay() {
  struct tm timeinfo;
  if (!getClock(&timeinfo)) {
    renderBootScreen("BD STANDARD TIME", "SYNCING CLOCK...");
    return;
  }

  display.clearDisplay();

  // 1. Top Row: Day of Week (x = 4) & Date (right-aligned to x = 120)
  display.setTextSize(1);
  display.setCursor(4, 4);
  const char* daysOfWeek[] = { "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY" };
  display.print(daysOfWeek[timeinfo.tm_wday]);

  const char* months[] = { "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" };
  char topDate[12];
  snprintf(topDate, sizeof(topDate), "%s %02d", months[timeinfo.tm_mon], timeinfo.tm_mday);
  display.setCursor(85, 4);
  display.print(topDate);

  // 2. Center Row: "06:11" (with slim colon) + ":39 PM" ending at x = 120
  int hour12 = timeinfo.tm_hour % 12;
  if (hour12 == 0) hour12 = 12;
  const char* ampm = (timeinfo.tm_hour >= 12) ? "PM" : "AM";

  char hhStr[4], mmStr[4];
  snprintf(hhStr, sizeof(hhStr), "%02d", hour12);
  snprintf(mmStr, sizeof(mmStr), "%02d", timeinfo.tm_min);

  display.setTextSize(3);
  display.setCursor(4, 22);
  display.print(hhStr);

  display.fillRect(41, 27, 3, 3, SH110X_WHITE);
  display.fillRect(41, 37, 3, 3, SH110X_WHITE);

  display.setCursor(48, 22);
  display.print(mmStr);

  display.setTextSize(1);
  display.setCursor(85, 35);
  display.printf(":%02d %s", timeinfo.tm_sec, ampm);

  // 3. Bottom Row: Dynamic Status ("Pomo:22", "Special:23", or Blank if idle)
  float secProgress = (float)timeinfo.tm_sec / 59.0f;

  if (isRunning) {
    char statusStr[16];
    if (activeTimerIsSpecial) {
      uint32_t mins = (specialRemainingSeconds + 59) / 60;
      snprintf(statusStr, sizeof(statusStr), "Special:%02u", (unsigned int)mins);
    } else {
      uint32_t mins = (remainingSeconds + 59) / 60;
      snprintf(statusStr, sizeof(statusStr), "Pomo:%02u", (unsigned int)mins);
    }

    int textPx = strlen(statusStr) * 6;
    int textX  = 121 - textPx; // Right-aligned to x = 120 safe margin
    int barMax = textX - 10;   // Clean gap between progress bar and text

    drawProgressLine(4, 57, barMax, secProgress);
    display.setTextSize(1);
    display.setCursor(textX, 54);
    display.print(statusStr);
  } else {
    // Nothing is running: leave text blank and draw full-width second line
    drawProgressLine(4, 57, 116, secProgress);
  }

  safeDisplayFlush();
}

// --- OLED: Ultra-Minimal Special Session Mode ---
void renderSpecialDisplay() {
  display.clearDisplay();

  // 1. Time Dial Screen ("SPECIAL" / "< 25:00 >" / "RST:+5M    BTN:START")
  if (isSpecialSetting) {
    display.setTextSize(1);
    display.setCursor(4, 4);
    display.print("SPECIAL");
    display.setCursor(103, 4);
    display.print("SET");

    char timeStr[6];
    snprintf(timeStr, sizeof(timeStr), "%02u:00", (unsigned int)specialMinutes);
    drawCentered(timeStr, 22, 3);

    display.setTextSize(2);
    display.setCursor(6, 26);
    display.print("<");
    display.setCursor(110, 26);
    display.print(">");

    drawCentered("RST:+5M   BTN:START", 54, 1);
  }
  // 2. Reset Special Confirmation Screen
  else if (isConfirmingReset) {
    drawCentered("RESET SPECIAL?", 12, 1);
    display.drawFastHLine(14, 25, 98, SH110X_WHITE);
    drawCentered("RST:YES   BTN:NO", 38, 1);
  }
  // 3. Special Session Complete / Alarm Screen
  else if (isAlarming) {
    char doneHeader[22];
    snprintf(doneHeader, sizeof(doneHeader), "SPECIAL %uM DONE", (unsigned int)specialMinutes);
    drawCentered(doneHeader, 4, 1);
    drawCentered("00:00", 21, 3);
    drawCentered("MOVE TO NEXT PHASE", 54, 1);
  }
  // 4. Active / Paused Special Session Countdown
  else {
    display.setTextSize(1);
    display.setCursor(4, 4);
    display.printf("SPECIAL %uM", (unsigned int)specialMinutes);

    display.fillCircle(80, 7, 2, SH110X_WHITE);

    display.setCursor(isRunning ? 103 : 97, 4);
    display.print(isRunning ? "RUN" : "HOLD");

    uint32_t mins = specialRemainingSeconds / 60;
    uint32_t secs = specialRemainingSeconds % 60;
    char timeStr[6];
    snprintf(timeStr, sizeof(timeStr), "%02u:%02u", (unsigned int)mins, (unsigned int)secs);
    drawCentered(timeStr, 22, 3);

    float progress = (float)(specialTotalSeconds - specialRemainingSeconds) / (float)specialTotalSeconds;
    drawProgressLine(4, 57, 116, progress);
  }

  safeDisplayFlush();
}

// --- OLED: Master Display Router ---
void updateOledDisplay() {
  if (currentDisplayMode == MODE_CLOCK) return;
  if (currentDisplayMode == MODE_SPECIAL) {
    renderSpecialDisplay();
    return;
  }

  display.clearDisplay();
  uint8_t displayCycle = (pomodoroCount >= 4) ? 4 : (pomodoroCount + 1);

  if (isConfirmingReset) {
    if (currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK) {
      drawCentered("CANCEL BREAK?", 12, 1);
    } else {
      drawCentered("CONFIRM RESET?", 12, 1);
    }
    display.drawFastHLine(14, 25, 98, SH110X_WHITE);
    drawCentered("RST:YES   BTN:NO", 38, 1);
  }
  else if (isAlarming) {
    char doneHeader[22];
    switch (currentState) {
      case STATE_WORK:
        snprintf(doneHeader, sizeof(doneHeader), "WORK %d/4 DONE", displayCycle);
        break;
      case STATE_SHORT_BREAK:
        snprintf(doneHeader, sizeof(doneHeader), "SHORT BREAK DONE");
        break;
      case STATE_LONG_BREAK:
        snprintf(doneHeader, sizeof(doneHeader), "LONG BREAK DONE");
        break;
    }
    drawCentered(doneHeader, 4, 1);
    drawCentered("00:00", 21, 3);
    drawCentered("MOVE TO NEXT PHASE", 54, 1);
  }
  else {
    display.setTextSize(1);
    display.setCursor(4, 4);
    if (currentState == STATE_WORK) {
      display.printf("WORK %d/4", displayCycle);

      int dotX = 62;
      int dotY = 7;
      for (int i = 0; i < 4; i++) {
        if (i < displayCycle) {
          display.fillCircle(dotX + (i * 8), dotY, 2, SH110X_WHITE);
        } else {
          display.drawCircle(dotX + (i * 8), dotY, 2, SH110X_WHITE);
        }
      }
    } else if (currentState == STATE_SHORT_BREAK) {
      display.print("BREAK 5M");
    } else {
      display.print("LONG BREAK");
    }

    display.setCursor(isRunning ? 103 : 97, 4);
    display.print(isRunning ? "RUN" : "HOLD");

    uint32_t mins = remainingSeconds / 60;
    uint32_t secs = remainingSeconds % 60;
    char timeStr[6];
    snprintf(timeStr, sizeof(timeStr), "%02u:%02u", (unsigned int)mins, (unsigned int)secs);
    drawCentered(timeStr, 22, 3);

    float progress = (float)(totalPhaseSeconds - remainingSeconds) / (float)totalPhaseSeconds;
    drawProgressLine(4, 57, 116, progress);
  }

  safeDisplayFlush();
}

void queueStateSync() {
  if (!syncQueue) return;

  SyncMessage msg;
  memset(&msg, 0, sizeof(msg));
  msg.action = ACTION_UPDATE_STATE;

  if (activeTimerIsSpecial) {
    strncpy(msg.phase, "SPECIAL", sizeof(msg.phase) - 1);
    msg.running = (isConfirmingReset || isAlarming || isSpecialSetting) ? false : isRunning;
    msg.remaining = specialRemainingSeconds;
    msg.total = specialTotalSeconds;
  } else {
    strncpy(msg.phase, getPhaseName(currentState), sizeof(msg.phase) - 1);
    msg.running = (isConfirmingReset || isAlarming) ? false : isRunning;
    msg.remaining = remainingSeconds;
    msg.total = totalPhaseSeconds;
  }

  msg.count = pomodoroCount;
  xQueueSend(syncQueue, &msg, 0);
}

void queueSessionLog(const char* phaseName, uint32_t mins) {
  if (!syncQueue) return;

  SyncMessage msg;
  memset(&msg, 0, sizeof(msg));
  msg.action = ACTION_LOG_SESSION;
  strncpy(msg.phase, phaseName, sizeof(msg.phase) - 1);
  msg.durationMins = mins;
  getUtcIsoTimestamp(msg.completedAt, sizeof(msg.completedAt));
  xQueueSend(syncQueue, &msg, 0);
}

static int sendToSupabase(const char* path, const char* payload, const char* authHeader, bool isPost) {
  char url[160];
  snprintf(url, sizeof(url), "%s%s", SUPABASE_URL, path);

  int code = -1;
  for (int attempt = 0; attempt < 2; attempt++) {
    httpClient.begin(secureClient, url);
    httpClient.addHeader("apikey", SUPABASE_KEY);
    httpClient.addHeader("Authorization", authHeader);
    httpClient.addHeader("Content-Type", "application/json");

    size_t len = strlen(payload);
    code = isPost ? httpClient.POST((uint8_t*)payload, len)
                  : httpClient.PATCH((uint8_t*)payload, len);
    httpClient.end();

    if (code > 0) break;
    secureClient.stop();
  }
  return code;
}

static bool sendState(const SyncMessage& m, const char* authHeader) {
  char payload[200];
  snprintf(payload, sizeof(payload),
    "{\"phase\":\"%s\",\"is_running\":%s,\"remaining_seconds\":%u,\"total_phase_seconds\":%u,\"pomodoro_count\":%u}",
    m.phase, m.running ? "true" : "false", (unsigned)m.remaining, (unsigned)m.total, (unsigned)m.count);
  int code = sendToSupabase("/rest/v1/device_state?id=eq.1", payload, authHeader, false);
  LOGF("[SUPABASE] State sync HTTP %d\n", code);
  return code >= 200 && code < 300;
}

static bool sendLog(const SyncMessage& m, const char* authHeader) {
  char payload[160];
  if (m.completedAt[0] != '\0') {
    snprintf(payload, sizeof(payload),
      "{\"phase\":\"%s\",\"duration_minutes\":%u,\"completed_at\":\"%s\"}",
      m.phase, (unsigned)m.durationMins, m.completedAt);
  } else {
    snprintf(payload, sizeof(payload),
      "{\"phase\":\"%s\",\"duration_minutes\":%u}",
      m.phase, (unsigned)m.durationMins);
  }
  int code = sendToSupabase("/rest/v1/session_logs", payload, authHeader, true);
  LOGF("[SUPABASE] Session log HTTP %d\n", code);
  return code >= 200 && code < 300;
}

void supabaseBackgroundWorker(void* parameter) {
  static char authHeader[260];
  snprintf(authHeader, sizeof(authHeader), "Bearer %s", SUPABASE_KEY);

  SyncMessage msg, nextMsg;
  const uint8_t MAX_PENDING_LOGS = 8;
  SyncMessage pendingLogs[MAX_PENDING_LOGS];
  uint8_t pendingCount = 0;
  uint8_t pendingTries = 0;
  uint32_t lastReconnect = 0;

  secureClient.setInsecure();
  httpClient.setReuse(true);
  httpClient.setConnectTimeout(5000);
  httpClient.setTimeout(5000);

  for (;;) {
    TickType_t wait = (pendingCount > 0) ? pdMS_TO_TICKS(20000) : portMAX_DELAY;
    bool got = (xQueueReceive(syncQueue, &msg, wait) == pdTRUE);

    if (got) {
      while (msg.action == ACTION_UPDATE_STATE && uxQueueMessagesWaiting(syncQueue) > 0) {
        if (xQueuePeek(syncQueue, &nextMsg, 0) == pdTRUE && nextMsg.action == ACTION_UPDATE_STATE) {
          xQueueReceive(syncQueue, &msg, 0);
        } else {
          break;
        }
      }
    }

    if (WiFi.status() != WL_CONNECTED) {
      if (got && msg.action == ACTION_LOG_SESSION && pendingCount < MAX_PENDING_LOGS) {
        pendingLogs[pendingCount++] = msg;
        pendingTries = 0;
      }
      if (millis() - lastReconnect > 30000) {
        lastReconnect = millis();
        WiFi.reconnect();
      }
      continue;
    }

    esp_wifi_set_ps(WIFI_PS_MIN_MODEM);

    // Flush queued offline logs in chronological order
    while (pendingCount > 0) {
      if (sendLog(pendingLogs[0], authHeader) || ++pendingTries >= 10) {
        for (uint8_t i = 1; i < pendingCount; i++) {
          pendingLogs[i - 1] = pendingLogs[i];
        }
        pendingCount--;
        pendingTries = 0;
      } else {
        break;
      }
    }

    if (got) {
      if (msg.action == ACTION_UPDATE_STATE) {
        sendState(msg, authHeader);
      } else if (!sendLog(msg, authHeader)) {
        if (pendingCount < MAX_PENDING_LOGS) {
          pendingLogs[pendingCount++] = msg;
          pendingTries = 0;
        }
      }
    }
  }
}
