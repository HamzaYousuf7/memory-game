import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { useNavigate } from "react-router-dom";

type GamePhase = "idle" | "showing" | "input" | "feedback";

const CORRECT_TO_LEVEL_UP = 3;
const FEEDBACK_DELAY_MS = 800;

const getPreviewDurationMs = (digits: number) => {
  // 2 digits -> 4 sec
  // then reduce slowly
  return Math.max(1800, 4000 - (digits - 2) * 250);
};

const getInputDurationMs = (digits: number) => {
  // answer time also reduces slowly
  return Math.max(3500, 7000 - (digits - 2) * 300);
};

const generateRandomNumber = (digits: number) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const formatClock = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const seconds = totalSeconds.toString().padStart(2, "0");
  return `00:${seconds}`;
};

const RememberNumber = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("remember-number-high-score");
    return saved ? Number(saved) : 0;
  });

  const [digits, setDigits] = useState(6);
  const [correctCount, setCorrectCount] = useState(0);

  const [targetNumber, setTargetNumber] = useState("");
  const [userInput, setUserInput] = useState("");
  const [message, setMessage] = useState("Press start to begin");

  const [roundDurationMs, setRoundDurationMs] = useState(1);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  const nextRoundTimeoutRef = useRef<number | null>(null);

  const progressValue = useMemo(() => {
    return (correctCount / CORRECT_TO_LEVEL_UP) * 100;
  }, [correctCount]);

  const clearNextRoundTimeout = () => {
    if (nextRoundTimeoutRef.current) {
      window.clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
  };

  const startRound = (nextDigits: number) => {
    const newNumber = generateRandomNumber(nextDigits);
    const previewMs = getPreviewDurationMs(nextDigits);

    setDigits(nextDigits);
    setTargetNumber(newNumber);
    setUserInput("");
    setMessage(`Memorize this ${nextDigits}-digit number`);
    setRoundDurationMs(previewMs);
    setTimeLeftMs(previewMs);
    setPhase("showing");
  };

  const startGame = () => {
    clearNextRoundTimeout();
    setScore(0);
    setDigits(2);
    setCorrectCount(0);
    setTargetNumber("");
    setUserInput("");
    setMessage("Get ready...");
    startRound(2);
  };

  const scheduleNextRound = (nextDigits: number) => {
    clearNextRoundTimeout();
    nextRoundTimeoutRef.current = window.setTimeout(() => {
      startRound(nextDigits);
    }, FEEDBACK_DELAY_MS);
  };

  const finishRound = (isCorrect: boolean, feedbackText?: string) => {
    if (isCorrect) {
      const nextCorrect = correctCount + 1;
      const shouldLevelUp = nextCorrect >= CORRECT_TO_LEVEL_UP;
      const nextDigits = shouldLevelUp ? digits + 1 : digits;

      setScore((prev) => prev + digits * 100);
      setCorrectCount(shouldLevelUp ? 0 : nextCorrect);
      setPhase("feedback");
      setMessage(
        shouldLevelUp
          ? `Correct! Moving to ${nextDigits} digits`
          : "Correct! Get ready for the next number"
      );

      scheduleNextRound(nextDigits);
    } else {
      setPhase("feedback");
      setMessage(feedbackText || `Wrong! The correct number was ${targetNumber}`);
      scheduleNextRound(digits);
    }
  };

  const handleValidate = () => {
    if (phase !== "input") return;

    if (userInput.length !== digits) {
      setMessage(`Please enter all ${digits} digits first`);
      return;
    }

    const isCorrect = userInput === targetNumber;
    finishRound(
      isCorrect,
      isCorrect ? "Correct!" : `Wrong! The correct number was ${targetNumber}`
    );
  };

  const handleDigitPress = (value: string) => {
    if (phase !== "input") return;

    setUserInput((prev) => {
      if (prev.length >= digits) return prev;
      return prev + value;
    });
  };

  const handleClear = () => {
    if (phase !== "input") return;
    setUserInput("");
  };

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  useEffect(() => {
    localStorage.setItem("remember-number-high-score", String(highScore));
  }, [highScore]);

  useEffect(() => {
    if (phase !== "showing" && phase !== "input") return;

    const endTime = Date.now() + roundDurationMs;

    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeftMs(remaining);
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [phase, roundDurationMs]);

  useEffect(() => {
    if (phase === "showing" && timeLeftMs <= 0) {
      const inputMs = getInputDurationMs(digits);
      setPhase("input");
      setMessage(`Enter the ${digits}-digit number`);
      setRoundDurationMs(inputMs);
      setTimeLeftMs(inputMs);
      setUserInput("");
    }
  }, [phase, timeLeftMs, digits]);

  useEffect(() => {
    if (phase === "input" && timeLeftMs <= 0) {
      finishRound(false, `Time's up! The correct number was ${targetNumber}`);
    }
  }, [phase, timeLeftMs, targetNumber]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== "input") return;

      if (/^\d$/.test(event.key)) {
        handleDigitPress(event.key);
      } else if (event.key === "Backspace") {
        setUserInput((prev) => prev.slice(0, -1));
      } else if (event.key === "Enter") {
        handleValidate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, userInput, digits, targetNumber]);

  useEffect(() => {
    return () => {
      clearNextRoundTimeout();
    };
  }, []);

  const displayValue =
    phase === "showing"
      ? targetNumber
      : phase === "input"
      ? userInput || "•".repeat(digits)
      : phase === "feedback"
      ? message
      : "";

  const timerLabel =
    phase === "showing"
      ? "Memorize"
      : phase === "input"
      ? "Answer"
      : "Time";

  const keypadDisabled = phase !== "input";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at center, #2a2a2a 0%, #111 45%, #000 100%)",
        py: { xs: 2, sm: 3, md: 4 },
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: "14px",
              border: "3px solid rgba(255,255,255,0.85)",
              background: "linear-gradient(180deg, #005da8 0%, #17a2f2 100%)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
            }}
          >
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size="grow">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    onClick={() => navigate("/")}
                    variant="contained"
                    size="small"
                    sx={{
                      minWidth: 0,
                      width: 38,
                      height: 38,
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.16)",
                      boxShadow: "none",
                    }}
                  >
                    <HomeRoundedIcon />
                  </Button>

                  <Box>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: { xs: "1rem", sm: "1.2rem" },
                        textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                      }}
                    >
                      {timerLabel}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#ff2f2f",
                        fontWeight: 900,
                        fontSize: { xs: "1.15rem", sm: "1.4rem" },
                        textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                      }}
                    >
                      {phase === "idle" ? "--:--" : formatClock(timeLeftMs)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid>
                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: { xs: "1.1rem", sm: "1.6rem" },
                    textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                  }}
                >
                  Score: {score}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {phase !== "idle" && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    minWidth: 58,
                    minHeight: 58,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid #64b5ff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: "1.8rem",
                      color: "#111",
                    }}
                  >
                    {digits}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    sx={{
                      height: 28,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.35)",
                      border: "2px solid rgba(100,181,255,0.55)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        background: "linear-gradient(90deg, #9fff28 0%, #5fe53f 100%)",
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      mt: 0.7,
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                    }}
                  >
                    {correctCount}/{CORRECT_TO_LEVEL_UP} correct answers to level up
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          )}

          {phase === "idle" ? (
            <Stack spacing={3} alignItems="center">
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  borderRadius: "18px",
                  p: { xs: 3, sm: 4 },
                  background:
                    "linear-gradient(180deg, rgba(24,128,116,0.98) 0%, rgba(14,102,92,0.98) 100%)",
                  border: "10px solid #d7a866",
                  boxShadow:
                    "0 14px 34px rgba(0,0,0,0.45), inset 0 0 18px rgba(0,0,0,0.25)",
                }}
              >
                <Stack spacing={2.2}>
                  <Typography
                    sx={{
                      color: "#f7f7f7",
                      fontWeight: 800,
                      fontSize: { xs: "1.15rem", sm: "1.35rem" },
                    }}
                  >
                    Remember Number
                  </Typography>

                  <Grid container rowSpacing={1.4}>
                    <Grid size={7}>
                      <Typography sx={{ color: "#f4f4f4", fontSize: "1.1rem" }}>
                        Score
                      </Typography>
                    </Grid>
                    <Grid size={5}>
                      <Typography
                        sx={{
                          color: "#ffd84a",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        0
                      </Typography>
                    </Grid>

                    <Grid size={7}>
                      <Typography sx={{ color: "#f4f4f4", fontSize: "1.1rem" }}>
                        Start digits
                      </Typography>
                    </Grid>
                    <Grid size={5}>
                      <Typography
                        sx={{
                          color: "#ffd84a",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        2
                      </Typography>
                    </Grid>

                    <Grid size={7}>
                      <Typography sx={{ color: "#f4f4f4", fontSize: "1.1rem" }}>
                        Correct to level up
                      </Typography>
                    </Grid>
                    <Grid size={5}>
                      <Typography
                        sx={{
                          color: "#ffd84a",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        3
                      </Typography>
                    </Grid>

                    <Grid size={7}>
                      <Typography sx={{ color: "#f4f4f4", fontSize: "1.1rem" }}>
                        Preview time
                      </Typography>
                    </Grid>
                    <Grid size={5}>
                      <Typography
                        sx={{
                          color: "#ffd84a",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        4 sec
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>

              <Typography
                sx={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                  textAlign: "center",
                  textShadow: "0 2px 8px rgba(0,0,0,0.45)",
                }}
              >
                High score: {highScore}
              </Typography>

              <Button
                onClick={startGame}
                variant="contained"
                sx={{
                  width: { xs: "100%", sm: 320 },
                  py: 2,
                  borderRadius: "16px",
                  fontSize: { xs: "1.2rem", sm: "1.5rem" },
                  fontWeight: 900,
                  letterSpacing: 1,
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.55)",
                  background: "linear-gradient(180deg, #0b3e9c 0%, #40a7f6 100%)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.38)",
                }}
              >
                START
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <Paper
                elevation={0}
                sx={{
                  minHeight: { xs: 150, sm: 170, md: 190 },
                  borderRadius: "16px",
                  border: "4px solid rgba(255,255,255,0.88)",
                  background:
                    phase === "feedback" && message.toLowerCase().includes("wrong")
                      ? "linear-gradient(180deg, #efd3d3 0%, #d9aaaa 100%)"
                      : "linear-gradient(180deg, #c1c7ad 0%, #b2b8a0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                  textAlign: "center",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
                }}
              >
                <Typography
                  sx={{
                    color: phase === "feedback" ? "#222" : "#fff",
                    fontWeight: 900,
                    fontSize: {
                      xs: phase === "feedback" ? "1.4rem" : "2.6rem",
                      sm: phase === "feedback" ? "1.6rem" : "3.4rem",
                    },
                    letterSpacing: phase === "input" ? 8 : 2,
                    textShadow:
                      phase === "feedback"
                        ? "none"
                        : "0 2px 6px rgba(0,0,0,0.45)",
                    wordBreak: "break-word",
                  }}
                >
                  {displayValue}
                </Typography>
              </Paper>

              <Box
                sx={{
                  height: 10,
                  borderRadius: 999,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(90,90,90,0.85) 100%)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
                }}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gridTemplateAreas: `
                    "one two three clear"
                    "four five six clear"
                    "seven eight nine zero"
                  `,
                  gap: 1.4,
                }}
              >
                {[
                  { label: "1", area: "one" },
                  { label: "2", area: "two" },
                  { label: "3", area: "three" },
                  { label: "4", area: "four" },
                  { label: "5", area: "five" },
                  { label: "6", area: "six" },
                  { label: "7", area: "seven" },
                  { label: "8", area: "eight" },
                  { label: "9", area: "nine" },
                  { label: "0", area: "zero" },
                ].map((item) => (
                  <Button
                    key={item.label}
                    disabled={keypadDisabled}
                    onClick={() => handleDigitPress(item.label)}
                    sx={{
                      gridArea: item.area,
                      minHeight: { xs: 92, sm: 110 },
                      borderRadius: "14px",
                      fontSize: { xs: "2rem", sm: "2.5rem" },
                      fontWeight: 900,
                      color: "#fff",
                      border: "2px solid rgba(43,120,255,0.75)",
                      background:
                        "linear-gradient(180deg, #113f97 0%, #3d9ce7 100%)",
                      textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.28)",
                    }}
                  >
                    {item.label}
                  </Button>
                ))}

                <Button
                  disabled={keypadDisabled}
                  onClick={handleClear}
                  sx={{
                    gridArea: "clear",
                    minHeight: { xs: 190, sm: 230 },
                    borderRadius: "14px",
                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                    fontWeight: 900,
                    color: "#fff",
                    border: "2px solid rgba(43,120,255,0.75)",
                    background:
                      "linear-gradient(180deg, #113f97 0%, #3d9ce7 100%)",
                    textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.28)",
                  }}
                >
                  CLEAR
                </Button>
              </Box>

              <Button
                onClick={handleValidate}
                disabled={phase !== "input"}
                variant="contained"
                sx={{
                  minHeight: 78,
                  borderRadius: "16px",
                  fontSize: { xs: "1.7rem", sm: "2rem" },
                  fontWeight: 900,
                  letterSpacing: 1,
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.55)",
                  background: "linear-gradient(180deg, #173d89 0%, #1e3f93 100%)",
                  textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                }}
              >
                VALIDATE
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default RememberNumber;