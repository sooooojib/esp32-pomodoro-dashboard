#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ================= USER CONFIGURATION =================
const char* WIFI_SSID     = "sojib";
const char* WIFI_PASS     = "Sajib3296";
const char* SUPABASE_URL  = "https://ykncypzibxorhaatyqah.supabase.co";
const char* SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbmN5cHppYnhvcmhhYXR5cWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxOTE4MDgsImV4cCI6MjEwNzc2NzgwOH0.cVWlzZOw5et55NiYcp3n1g6ophDvmp-GgCHyo9Vf5sI";
// ======================================================

// --- Pin Definitions ---
#define I2C_SDA_PIN      47  // LCD SDA
#define I2C_SCL_PIN      38  // LCD SCL
#define BUTTON_PIN       21  // Start / Pause / Cancel Reset Button
#define RESET_BUTTON_PIN 14  // Reset Timer Button
#define WORK_LED_PIN     4   // Work Phase LED
#define BREAK_LED_PIN    5   // Break Phase LED
#define BUZZER_PIN       15  // Piezo Buzzer

LiquidCrystal_I2C* lcd = nullptr;

// --- Pomodoro Durations (in seconds) ---
const uint32_t DURATION_WORK        = 25 * 60; // 25 minutes
const uint32_t DURATION_SHORT_BREAK = 5 * 60;  // 5 minutes
const uint32_t DURATION_LONG_BREAK  = 15 * 60; // 15 minutes

enum PomodoroState { STATE_WORK, STATE_SHORT_BREAK, STATE_LONG_BREAK };
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
void updateDisplay();
void handleMainButton();
void handleResetButton();
void handleAlarmBuzzer();
void advanceState();
void executeReset();
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
    default:                return "UNKNOWN";
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // --- Thermal & Power Optimizations ---
  setCpuFrequencyMhz(80);     // Lowers clock from 240 MHz to 80 MHz to keep CPU cool
  WiFi.setSleep(true);        // Enables Wi-Fi modem sleep when idle

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);
  pinMode(WORK_LED_PIN, OUTPUT);
  pinMode(BREAK_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Keep built-in RGB LED on GPIO 48 turned off
  pinMode(48, OUTPUT);
  digitalWrite(48, LOW);

  // Initialize I2C Bus on GPIO 47 & 38
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

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

  // --- Visual Wi-Fi Connection Screen ---
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
    Serial.println("\n[WIFI] Connection FAILED. Check network credentials.");
    lcd->setCursor(0, 0);
    lcd->print("WiFi Failed!");
    lcd->setCursor(0, 1);
    lcd->print("Check 2.4GHz Net");
  }
  delay(1500);

  // Message queue for background Supabase synchronization
  syncQueue = xQueueCreate(10, sizeof(SyncMessage));

  // Background worker pinned to Core 0 (networking core)
  xTaskCreatePinnedToCore(
    supabaseBackgroundWorker,
    "SupabaseWorker",
    8192,
    NULL,
    1,
    NULL,
    0
  );

  // Initial cloud state sync
  queueStateSync();

  lcd->clear();
  updateOutputs();
  updateDisplay();
  Serial.println("[READY] ESP32-S3 Cool Dual-Core Pomodoro Online.");
}

void loop() {
  handleMainButton();
  handleResetButton();
  handleAlarmBuzzer();

  // 1-second countdown clock (runs only when active and not confirming reset)
  if (isRunning && !isAlarming && !isConfirmingReset) {
    uint32_t currentMillis = millis();
    if (currentMillis - lastTick >= 1000) {
      lastTick += 1000;

      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateDisplay();

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

  // Yields CPU to the FreeRTOS idle task to keep the ESP32-S3 cool
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
          Serial.println("[RESET] Cancelled.");
        } else if (isAlarming) {
          isAlarming = false;
          noTone(BUZZER_PIN);
          playButtonClickBeep();
          advanceState();
          Serial.println("[BUTTON] Alarm dismissed. Advancing phase.");
        } else {
          playButtonClickBeep();
          isRunning = !isRunning;
          if (isRunning) {
            lastTick = millis();
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
          playResetPromptBeepBeep();
          updateDisplay();
        } else {
          executeReset();
        }
      }
    }
  }

  lastResetReading = reading;
}

// Resets the active module to its starting time without losing session count
void executeReset() {
  isConfirmingReset = false;
  isAlarming = false;
  noTone(BUZZER_PIN);
  playResetConfirmedBeep();

  remainingSeconds = totalPhaseSeconds;
  isRunning = false;

  updateOutputs();
  updateDisplay();
  queueStateSync();
  Serial.println("[RESET] Confirmed! Current module restarted.");
}

void handleAlarmBuzzer() {
  if (!isAlarming || isConfirmingReset) return;

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
}

void playResetConfirmedBeep() {
  tone(BUZZER_PIN, 2000, 70);
  delay(80);
  tone(BUZZER_PIN, 1200, 120);
  delay(130);
  noTone(BUZZER_PIN);
}

void updateDisplay() {
  if (!lcd) return;

  char line1[17];
  char line2[17];

  if (isConfirmingReset) {
    snprintf(line1, sizeof(line1), "CONFIRM RESET?  ");
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

// Background Worker Task (Runs on Core 0)
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
