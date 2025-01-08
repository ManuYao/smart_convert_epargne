import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Box,
  Typography, 
  Container, 
  Paper, 
  Grid,
  Card,
  CardContent,
  InputAdornment,
  ThemeProvider,
  createTheme,
  Switch,
  FormControlLabel
} from '@mui/material';
import { EuroSymbol } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Configuration des couleurs de l'application
const colors = {
  darkGray: '#27272A',
  mediumGray: '#52525B',
  lightGray: '#F8FAFC',
  success: '#34D399',
  error: '#DD4425',
  darkMode: {
    background: '#18181B',
    paper: '#27272A',
    input: '#3F3F46',
    hover: '#52525B'
  }
};

// Configuration des tranches de revenus
const TRANCHES = [
  { id: 'moins-2000', label: 'Moins de 2000€', min: 0, max: 2000, tauxEpargneRecommande: 0.05 },
  { id: '2000-4000', label: 'Entre 2000€ et 4000€', min: 2000, max: 4000, tauxEpargneRecommande: 0.10 },
  { id: '4000-6000', label: 'Entre 4000€ et 6000€', min: 4000, max: 6000, tauxEpargneRecommande: 0.15 },
  { id: '6000-8000', label: 'Entre 6000€ et 8000€', min: 6000, max: 8000, tauxEpargneRecommande: 0.20 },
  { id: 'plus-8000', label: 'Plus de 8000€', min: 8000, max: 100000, tauxEpargneRecommande: 0.25 }
];

const InvestmentCalculator = () => {
  // États
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [inputs, setInputs] = useState({
    sommeInitiale: 0,
    mensualite: 120,
    tauxAnnuel: 3,
    nombreAnnees: 3,
    trancheRevenu: 'moins-2000'
  });

  const [results, setResults] = useState({
    montantTotal: 0,
    montantInvesti: 0,
    gains: 0,
    graphData: [],
    recommandation: {
      montantRecommande: 0,
      pourcentageRevenu: 0
    }
  });

  // Configuration du thème Material UI
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? colors.darkMode.background : colors.lightGray,
        paper: isDarkMode ? colors.darkMode.paper : '#fff'
      },
      text: {
        primary: isDarkMode ? '#fff' : colors.darkGray,
        secondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.mediumGray
      }
    },
    components: {
      MuiPaper: {
        defaultProps: {
          elevation: 0
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDarkMode ? colors.darkMode.paper : '#fff'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? colors.darkMode.paper : '#fff',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDarkMode ? colors.darkMode.input : '#fff'
            }
          }
        }
      }
    }
  });

  // Styles personnalisés
  const customStyles = {
    mainContainer: {
      minHeight: '100vh',
      transition: 'background-color 0.3s ease',
      backgroundColor: theme.palette.background.default,
      py: 4
    },
    paper: {
      p: 3,
      transition: 'background-color 0.3s ease',
      backgroundColor: isDarkMode ? colors.darkMode.paper : '#fff',
      border: '1px solid',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 2
    },
    resultCard: {
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
      }
    }
  };

  // Fonctions de calcul
  const calculateRecommendation = (trancheId) => {
    const tranche = TRANCHES.find(t => t.id === trancheId);
    if (!tranche) return { montantRecommande: 0, pourcentageRevenu: 0 };

    const revenuMoyen = (tranche.min + tranche.max) / 2;
    return {
      montantRecommande: Math.round(revenuMoyen * tranche.tauxEpargneRecommande),
      pourcentageRevenu: tranche.tauxEpargneRecommande * 100
    };
  };

  const calculateInvestment = () => {
    const nombreMois = inputs.nombreAnnees * 12;
    const tauxMensuel = inputs.tauxAnnuel / 100 / 12;
    let montantTotal = inputs.sommeInitiale;
    const graphData = [{
      mois: 0,
      total: montantTotal,
      investi: montantTotal
    }];

    for (let mois = 1; mois <= nombreMois; mois++) {
      montantTotal += inputs.mensualite;
      montantTotal *= (1 + tauxMensuel);
      
      graphData.push({
        mois: mois,
        total: parseFloat(montantTotal.toFixed(2)),
        investi: inputs.sommeInitiale + (inputs.mensualite * mois)
      });
    }

    const montantInvesti = inputs.sommeInitiale + (inputs.mensualite * nombreMois);
    const gains = montantTotal - montantInvesti;
    const recommandation = calculateRecommendation(inputs.trancheRevenu);

    setResults({
      montantTotal: parseFloat(montantTotal.toFixed(2)),
      montantInvesti: montantInvesti,
      gains: parseFloat(gains.toFixed(2)),
      graphData,
      recommandation
    });
  };

  useEffect(() => {
    calculateInvestment();
  }, [inputs]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={customStyles.mainContainer}>
        <Container maxWidth="lg">
          {/* En-tête */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Simulateur Épargne
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                />
              }
              label="Mode clair"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Sélection de tranche de revenus */}
            <Grid item xs={12}>
              <Paper sx={customStyles.paper}>
                <FormControl fullWidth>
                  <InputLabel>Tranche de revenus</InputLabel>
                  <Select
                    value={inputs.trancheRevenu}
                    label="Tranche de revenus"
                    onChange={(e) => setInputs({...inputs, trancheRevenu: e.target.value})}
                  >
                    {TRANCHES.map(tranche => (
                      <MenuItem key={tranche.id} value={tranche.id}>
                        {tranche.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            </Grid>

            {/* Recommandation */}
            <Grid item xs={12}>
              <Paper sx={customStyles.paper}>
                <Typography variant="subtitle1" gutterBottom>
                  Recommandation personnalisée
                </Typography>
                <Typography>
                  Pour votre niveau de revenus, nous vous recommandons d'épargner environ{' '}
                  <Box component="span" sx={{ fontWeight: 600, color: colors.success }}>
                    {results.recommandation.montantRecommande}€
                  </Box>{' '}
                  par mois ({results.recommandation.pourcentageRevenu}% de vos revenus).
                </Typography>
              </Paper>
            </Grid>

            {/* Champs de saisie */}
            <Grid item xs={12} container spacing={3}>
              {/* Capital initial */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Capital initial (€)"
                  type="number"
                  value={inputs.sommeInitiale}
                  onChange={(e) => setInputs({...inputs, sommeInitiale: parseFloat(e.target.value) || 0})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EuroSymbol /></InputAdornment>
                  }}
                />
              </Grid>

              {/* Versement mensuel */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Versement mensuel (€)"
                  type="number"
                  value={inputs.mensualite}
                  onChange={(e) => setInputs({...inputs, mensualite: parseFloat(e.target.value) || 0})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EuroSymbol /></InputAdornment>
                  }}
                />
              </Grid>

              {/* Taux annuel */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Taux annuel (%)"
                  type="number"
                  value={inputs.tauxAnnuel}
                  onChange={(e) => setInputs({...inputs, tauxAnnuel: parseFloat(e.target.value) || 0})}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />
              </Grid>

              {/* Durée */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Durée (années)"
                  type="number"
                  value={inputs.nombreAnnees}
                  onChange={(e) => setInputs({...inputs, nombreAnnees: parseInt(e.target.value) || 0})}
                />
              </Grid>
            </Grid>

            {/* Cartes de résultats */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                {/* Montant investi */}
                <Grid item xs={12} md={4}>
                  <Card sx={customStyles.resultCard}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Montant investi
                      </Typography>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {results.montantInvesti.toLocaleString('fr-FR')} €
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        dont {inputs.sommeInitiale.toLocaleString('fr-FR')}€ de capital initial
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Gains */}
                <Grid item xs={12} md={4}>
                  <Card sx={customStyles.resultCard}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Gains en intérêts
                      </Typography>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {results.gains.toLocaleString('fr-FR')} €
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Montant final */}
                <Grid item xs={12} md={4}>
                  <Card sx={customStyles.resultCard}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Montant final
                      </Typography>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {results.montantTotal.toLocaleString('fr-FR')} €
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Graphique */}
            <Grid item xs={12}>
              <Paper sx={{ ...customStyles.paper, height: 400 }}>
                <ResponsiveContainer>
                  <LineChart data={results.graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="mois"
                      label={{ value: 'Mois', position: 'bottom' }}
                    />
                    <YAxis
                      label={{ value: 'Montant (€)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR')} €`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total avec intérêts"
                      stroke={colors.error}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="investi"
                      name="Montant investi"
                      stroke={colors.success}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default InvestmentCalculator;