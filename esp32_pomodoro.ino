#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>

// ================= USER CONFIGURATION =================
const char* WIFI_SSID     = "sojib";
const char* WIFI_PASS     = "Sajib 3296";
const char* SUPABASE_URL  = "https://ykncypzibxorhaatyqah.supabase.co";
const char* SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbmN5cHppYnhvcmhhYXR5cWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxOTE4MDgsImV4cCI6MjEwNzc2NzgwOH0.cVWlzZOw5et55NiYcp3n1g6ophDvmp-GgCHyo9Vf5sI";
// ======================================================

// --- Camera & PSRAM Safe Pin Definitions ---
#define I2C_SDA_PIN      47  // LCD SDA (Left Header - Pin 5 from top)
#define I2C_SCL_PIN      38  // LCD SCL (Left Header - Pin 12 from top)
#define BUTTON_PIN       21  // Main Button (Left Header - Pin 4 from top)
#define RESET_BUTTON_PIN 14  // Reset Work / Cancel Break (Right Header - Pin 2 from top)
#define BUZZER_PIN       39  // Buzzer (Left Header - Pin 13 from top) [Directly below 38]
#define WORK_LED_PIN     41  // Work Phase Red LED (Left Header - Pin 15 from top)
#define BREAK_LED_PIN    42  // Break Phase Green LED (Left Header - Pin 16 from top)

LiquidCrystal_I2C* lcd = nullptr;
Preferences prefs;

// --- Pomodoro Durations (in seconds) ---
const uint32_t DURATION_WORK        = 25 * 60; // 25 minutes
const uint32_t DURATION_SHORT_BREAK = 5 * 60;  // 5 minutes
const uint32_t DURATION_LONG_BREAK  = 15 * 60; // 15 minutes

enum PomodoroState { STATE_WORK = 0, STATE_SHORT_BREAK = 1, STATE_LONG_BREAK = 2 };
PomodoroState currentState = STATE_WORK;

bool isRunning = false;
bool isAlarming = false;
bool isConfirmingReset = false;
uint32_t remainingSeconds = DURATION_WORK;
uint32_t totalPhaseSeconds = DURATION_WORK;
uint8_t pomodoroCount = 0;

// --- Timing & Debounce Variables ---
uint32_t lastTick = 0;
int lastBtnReading = HIGH;
int btnState = HIGH;
uint32_t lastBtnDebounceTime = 0;

int lastResetReading = HIGH;
int resetBtnState = HIGH;
uint32_t lastResetDebounceTime = 0;
const uint32_t debounceDelay = 50;

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
};

QueueHandle_t syncQueue;

// --- Function Prototypes ---
void saveCheckpoint();
void loadCheckpoint();
void updateDisplay();
void handleMainButton();
void handleResetButton();
void handleAlarmBuzzer();
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

void saveCheckpoint() {
  prefs.putUChar("state", (uint8_t)currentState);
  prefs.putUChar("count", pomodoroCount);
  prefs.putUInt("rem", remainingSeconds);
  prefs.putBool("alarm", false); // Never persist active alarm across reboots
  Serial.printf("[NVS] Checkpoint saved -> Phase: %s [%d/4], Remaining: %u sec\n",
                getPhaseName(currentState), pomodoroCount + 1, remainingSeconds);
}

void loadCheckpoint() {
  uint8_t savedState = prefs.getUChar("state", (uint8_t)STATE_WORK);
  if (savedState > 2) savedState = 0;

  currentState = (PomodoroState)savedState;
  totalPhaseSeconds = getDurationForState(currentState);

  pomodoroCount = prefs.getUChar("count", 0);
  if (pomodoroCount >= 4) pomodoroCount = 0;

  remainingSeconds = prefs.getUInt("rem", totalPhaseSeconds);
  if (remainingSeconds > totalPhaseSeconds || remainingSeconds == 0) {
    remainingSeconds = totalPhaseSeconds;
  }

  // Always force alarms to false on boot
  isAlarming = false;
  isRunning = false;

  Serial.printf("[NVS] Restored -> Phase: %s [%d/4], Remaining: %u sec\n",
                getPhaseName(currentState), pomodoroCount + 1, remainingSeconds);
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // Power optimizations
  setCpuFrequencyMhz(80);
  WiFi.setSleep(true);

  // Configure pins and guarantee buzzer and LEDs start completely silent/off
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  noTone(BUZZER_PIN);

  pinMode(WORK_LED_PIN, OUTPUT);
  digitalWrite(WORK_LED_PIN, LOW);

  pinMode(BREAK_LED_PIN, OUTPUT);
  digitalWrite(BREAK_LED_PIN, LOW);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);

  // Turn off built-in RGB LED on GPIO 48
  pinMode(48, OUTPUT);
  digitalWrite(48, LOW);

  // Restore NVS state
  prefs.begin("pomodoro", false);
  loadCheckpoint();

  // Initialize I2C Bus with timeout protection
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setTimeOut(50);

  byte lcdAddress = 0x27;
  for (byte i = 1; i < 127; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      lcdAddress = i;
      break;
    }
  }

  lcd = new LiquidCrystal_I2C(lcdAddress, 16, 2);
  lcd->init();
  lcd->backlight();
  lcd->clear();

  // Wi-Fi Connection Screen
  lcd->setCursor(0, 0);
  lcd->print("WiFi Connecting");
  lcd->setCursor(0, 1);
  lcd->print(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("\n[WIFI] Connecting to %s...\n", WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  lcd->clear();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    lcd->setCursor(0, 0);
    lcd->print("WiFi Connected!");
    lcd->setCursor(0, 1);
    lcd->print(WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] Connection FAILED. Operating offline with NVS.");
    lcd->setCursor(0, 0);
    lcd->print("Offline Mode");
    lcd->setCursor(0, 1);
    lcd->print("NVS Active");
  }
  delay(1500);

  syncQueue = xQueueCreate(10, sizeof(SyncMessage));

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

  lcd->clear();
  updateOutputs();
  updateDisplay();
  Serial.println("[READY] ESP32-S3 Camera-Safe Pomodoro Online.");
}

void loop() {
  handleMainButton();
  handleResetButton();
  handleAlarmBuzzer();

  if (isRunning && !isAlarming && !isConfirmingReset) {
    uint32_t currentMillis = millis();
    if (currentMillis - lastTick >= 1000) {
      lastTick += 1000;

      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateDisplay();

        if (remainingSeconds > 0 && (remainingSeconds % 60 == 0)) {
          saveCheckpoint();
          queueStateSync();
        }

        if (remainingSeconds == 0) {
          isRunning = false;
          isAlarming = true;
          updateOutputs();
          updateDisplay();

          queueSessionLog(getPhaseName(currentState), totalPhaseSeconds / 60);
          queueStateSync();
          Serial.println("[ALARM] Phase complete! Session logged to Supabase.");
        }
      }
    }
  }

  delay(10);
}

void handleMainButton() {
  int reading = digitalRead(BUTTON_PIN);

  if (reading != lastBtnReading) {
    lastBtnDebounceTime = millis();
  }

  if ((millis() - lastBtnDebounceTime) > debounceDelay) {
    if (reading != btnState) {
      btnState = reading;

      if (btnState == LOW) {
        if (isConfirmingReset) {
          isConfirmingReset = false;
          playButtonClickBeep();
          lastTick = millis();
          updateOutputs();
          updateDisplay();
          queueStateSync();
          Serial.println("[PROMPT] Canceled by user.");
        } else if (isAlarming) {
          isAlarming = false;
          noTone(BUZZER_PIN);
          digitalWrite(BUZZER_PIN, LOW);
          playButtonClickBeep();
          advanceState();
          Serial.println("[BUTTON] Alarm dismissed. Advancing phase.");
        } else {
          playButtonClickBeep();
          isRunning = !isRunning;
          if (isRunning) {
            lastTick = millis();
          } else {
            saveCheckpoint();
          }
          updateOutputs();
          updateDisplay();
          queueStateSync();
          Serial.printf("[BUTTON] Timer: %s\n", isRunning ? "RUNNING" : "PAUSED");
        }
      }
    }
  }

  lastBtnReading = reading;
}

void handleResetButton() {
  int reading = digitalRead(RESET_BUTTON_PIN);

  if (reading != lastResetReading) {
    lastResetDebounceTime = millis();
  }

  if ((millis() - lastResetDebounceTime) > debounceDelay) {
    if (reading != resetBtnState) {
      resetBtnState = reading;

      if (resetBtnState == LOW) {
        if (!isConfirmingReset) {
          isConfirmingReset = true;
          noTone(BUZZER_PIN);
          digitalWrite(BUZZER_PIN, LOW);
          playResetPromptBeepBeep();
          updateDisplay();
          if (currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK) {
            Serial.println("[PROMPT] Cancel Break? (RST=Yes, BTN=No)");
          } else {
            Serial.println("[PROMPT] Confirm Reset? (RST=Yes, BTN=No)");
          }
        } else {
          if (currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK) {
            skipBreakToWork();
          } else {
            executeReset();
          }
        }
      }
    }
  }

  lastResetReading = reading;
}

void executeReset() {
  isConfirmingReset = false;
  isAlarming = false;
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
  playResetConfirmedBeep();

  remainingSeconds = totalPhaseSeconds;
  isRunning = false;

  saveCheckpoint();
  updateOutputs();
  updateDisplay();
  queueStateSync();
  Serial.println("[RESET] Confirmed! Work module restarted.");
}

void skipBreakToWork() {
  isConfirmingReset = false;
  isAlarming = false;
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
  playResetConfirmedBeep();

  if (currentState == STATE_LONG_BREAK) {
    pomodoroCount = 0;
  }

  currentState = STATE_WORK;
  totalPhaseSeconds = DURATION_WORK;
  remainingSeconds = DURATION_WORK;
  isRunning = false;
  lastTick = millis();

  saveCheckpoint();
  updateOutputs();
  updateDisplay();
  queueStateSync();
  Serial.printf("[BREAK CANCELED] Advanced to WORK [%d/4] (HOLD).\n", pomodoroCount + 1);
}

void handleAlarmBuzzer() {
  if (!isAlarming || isConfirmingReset) {
    return;
  }

  static uint32_t lastToggle = 0;
  static bool soundState = false;
  uint32_t currentMillis = millis();

  uint32_t interval = soundState ? 250 : 200;
  if (currentMillis - lastToggle >= interval) {
    lastToggle = currentMillis;
    soundState = !soundState;

    if (soundState) {
      tone(BUZZER_PIN, 2200);
    } else {
      noTone(BUZZER_PIN);
      digitalWrite(BUZZER_PIN, LOW);
    }
  }
}

void advanceState() {
  if (currentState == STATE_WORK) {
    pomodoroCount++;
    if (pomodoroCount >= 4) {
      currentState = STATE_LONG_BREAK;
      totalPhaseSeconds = DURATION_LONG_BREAK;
      pomodoroCount = 0;
    } else {
      currentState = STATE_SHORT_BREAK;
      totalPhaseSeconds = DURATION_SHORT_BREAK;
    }
  } else {
    currentState = STATE_WORK;
    totalPhaseSeconds = DURATION_WORK;
  }

  remainingSeconds = totalPhaseSeconds;
  isRunning = true;
  lastTick = millis();

  saveCheckpoint();
  updateOutputs();
  updateDisplay();
  queueStateSync();
}

void updateOutputs() {
  if ((currentState == STATE_WORK && isRunning) || (currentState == STATE_WORK && isAlarming)) {
    digitalWrite(WORK_LED_PIN, HIGH);
  } else {
    digitalWrite(WORK_LED_PIN, LOW);
  }

  if (((currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK) && isRunning) ||
      ((currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK) && isAlarming)) {
    digitalWrite(BREAK_LED_PIN, HIGH);
  } else {
    digitalWrite(BREAK_LED_PIN, LOW);
  }
}

void playButtonClickBeep() {
  tone(BUZZER_PIN, 2400, 50);
}

void playResetPromptBeepBeep() {
  tone(BUZZER_PIN, 2000, 90);
  delay(130);
  tone(BUZZER_PIN, 2000, 90);
  delay(100);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

void playResetConfirmedBeep() {
  tone(BUZZER_PIN, 2000, 70);
  delay(80);
  tone(BUZZER_PIN, 1200, 120);
  delay(130);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);
}

void updateDisplay() {
  if (!lcd) return;

  char line1[17];
  char line2[17];

  if (isConfirmingReset) {
    if (currentState == STATE_SHORT_BREAK || currentState == STATE_LONG_BREAK) {
      snprintf(line1, sizeof(line1), "CANCEL BREAK?   ");
    } else {
      snprintf(line1, sizeof(line1), "CONFIRM RESET?  ");
    }
    snprintf(line2, sizeof(line2), "RST:YES  BTN:NO ");
  } else if (isAlarming) {
    switch (currentState) {
      case STATE_WORK:
        snprintf(line1, sizeof(line1), "WORK [%d/4]  DONE", pomodoroCount + 1);
        break;
      case STATE_SHORT_BREAK:
        snprintf(line1, sizeof(line1), "BREAK       DONE");
        break;
      case STATE_LONG_BREAK:
        snprintf(line1, sizeof(line1), "LONG BREAK  DONE");
        break;
    }
    snprintf(line2, sizeof(line2), "00:00  PRESS BTN");
  } else {
    switch (currentState) {
      case STATE_WORK:
        snprintf(line1, sizeof(line1), "WORK [%d/4]  %s", pomodoroCount + 1, isRunning ? "RUN " : "HOLD");
        break;
      case STATE_SHORT_BREAK:
        snprintf(line1, sizeof(line1), "BREAK       %s", isRunning ? "RUN " : "HOLD");
        break;
      case STATE_LONG_BREAK:
        snprintf(line1, sizeof(line1), "LONG BREAK  %s", isRunning ? "RUN " : "HOLD");
        break;
    }

    uint32_t mins = remainingSeconds / 60;
    uint32_t secs = remainingSeconds % 60;

    int totalSegments = 8;
    float progress = (float)(totalPhaseSeconds - remainingSeconds) / (float)totalPhaseSeconds;
    int filled = (int)(progress * totalSegments);

    char bar[9];
    for (int i = 0; i < totalSegments; i++) {
      if (i < filled) bar[i] = '=';
      else if (i == filled) bar[i] = '>';
      else bar[i] = ' ';
    }
    bar[8] = '\0';

    snprintf(line2, sizeof(line2), "%02u:%02u [%s]", (unsigned int)mins, (unsigned int)secs, bar);
  }

  lcd->setCursor(0, 0);
  lcd->print(line1);
  lcd->setCursor(0, 1);
  lcd->print(line2);
}

void queueStateSync() {
  SyncMessage msg;
  msg.action = ACTION_UPDATE_STATE;
  strncpy(msg.phase, getPhaseName(currentState), sizeof(msg.phase));
  msg.running = isRunning;
  msg.remaining = remainingSeconds;
  msg.total = totalPhaseSeconds;
  msg.count = pomodoroCount;
  msg.durationMins = 0;
  xQueueSend(syncQueue, &msg, 0);
}

void queueSessionLog(const char* phaseName, uint32_t mins) {
  SyncMessage msg;
  msg.action = ACTION_LOG_SESSION;
  strncpy(msg.phase, phaseName, sizeof(msg.phase));
  msg.durationMins = mins;
  xQueueSend(syncQueue, &msg, 0);
}

void supabaseBackgroundWorker(void* parameter) {
  WiFiClientSecure client;
  client.setInsecure();

  SyncMessage msg;

  for (;;) {
    if (xQueueReceive(syncQueue, &msg, portMAX_DELAY) == pdTRUE) {
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[SUPABASE] Wi-Fi disconnected. Reconnecting...");
        WiFi.reconnect();
        continue;
      }

      HTTPClient http;

      if (msg.action == ACTION_UPDATE_STATE) {
        char url[256];
        snprintf(url, sizeof(url), "%s/rest/v1/device_state?id=eq.1", SUPABASE_URL);

        http.begin(client, url);
        http.addHeader("apikey", SUPABASE_KEY);
        http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
        http.addHeader("Content-Type", "application/json");

        char payload[256];
        snprintf(payload, sizeof(payload),
          "{\"phase\":\"%s\",\"is_running\":%s,\"remaining_seconds\":%u,\"total_phase_seconds\":%u,\"pomodoro_count\":%u}",
          msg.phase, msg.running ? "true" : "false", msg.remaining, msg.total, msg.count
        );

        int httpResponseCode = http.PATCH(payload);
        Serial.printf("[SUPABASE] State sync HTTP %d\n", httpResponseCode);
        if (httpResponseCode < 0) {
          Serial.printf("[SUPABASE] HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
      } 
      else if (msg.action == ACTION_LOG_SESSION) {
        char url[256];
        snprintf(url, sizeof(url), "%s/rest/v1/session_logs", SUPABASE_URL);

        http.begin(client, url);
        http.addHeader("apikey", SUPABASE_KEY);
        http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
        http.addHeader("Content-Type", "application/json");

        char payload[128];
        snprintf(payload, sizeof(payload),
          "{\"phase\":\"%s\",\"duration_minutes\":%u}",
          msg.phase, msg.durationMins
        );

        int httpResponseCode = http.POST(payload);
        Serial.printf("[SUPABASE] Session logged HTTP %d\n", httpResponseCode);
        if (httpResponseCode < 0) {
          Serial.printf("[SUPABASE] HTTP error: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
      }
    }
  }
}
