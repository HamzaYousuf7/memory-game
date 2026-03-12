import {
  Box,
  Card,
  CardActionArea,
  Typography,
  Container,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalculateIcon from "@mui/icons-material/Calculate";
import PsychologyIcon from "@mui/icons-material/Psychology";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";

export const gameModes = [
  {
    id: 1,
    title: "Remember Number",
    subtitle: "1 x 2",
    path: "/remember-number",
    icon: <CalculateIcon sx={{ fontSize: { xs: 52, sm: 64, md: 72 } }} />,
  },
  {
    id: 2,
    title: "Brain",
    subtitle: "Memory",
    path: "/brain",
    icon: <PsychologyIcon sx={{ fontSize: { xs: 52, sm: 64, md: 72 } }} />,
  },
  {
    id: 3,
    title: "Quiz",
    subtitle: "???",
    path: "/quiz",
    icon: <HelpOutlineIcon sx={{ fontSize: { xs: 52, sm: 64, md: 72 } }} />,
  },
  {
    id: 4,
    title: "Vision",
    subtitle: "Focus",
    path: "/vision",
    icon: <VisibilityIcon sx={{ fontSize: { xs: 52, sm: 64, md: 72 } }} />,
  },
];




const Home = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1b1b1b 0%, #0b0b0b 45%, #000 100%)",
        display: "flex",
        justifyContent: "center",
        py: { xs: 4, sm: 6, md: 8 },
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Typography
          variant="h4"
          sx={{
            color: "#fff",
            textAlign: "center",
            fontWeight: 700,
            mb: 4,
          }}
        >
          Memory Game
        </Typography>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {gameModes.map((item) => (
            <Grid key={item.id} size={{ xs: 6, sm: 6 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "22px",
                  overflow: "hidden",
                  background:
                    "linear-gradient(180deg, #1f5ed8 0%, #0d47c4 45%, #08358d 100%)",
                  border: "2px solid rgba(255,255,255,0.18)",
                  minHeight: { xs: 180, sm: 220, md: 250 },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(item.path)}
                  sx={{
                    height: "100%",
                    p: { xs: 2, sm: 2.5, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Typography
                    sx={{
                      position: "absolute",
                      top: 14,
                      left: 16,
                      color: "#eaf4ff",
                      fontWeight: 800,
                      fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                    }}
                  >
                    {item.subtitle}
                  </Typography>

                  <Box
                    sx={{
                      width: { xs: 88, sm: 110, md: 120 },
                      height: { xs: 88, sm: 110, md: 120 },
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "radial-gradient(circle, rgba(173,216,255,0.35) 0%, rgba(255,255,255,0.08) 65%, transparent 100%)",
                      color: "#e9f7ff",
                      mb: 2,
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: { xs: "1rem", sm: "1.08rem", md: "1.15rem" },
                      textAlign: "center",
                    }}
                  >
                    {item.title}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
