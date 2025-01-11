import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
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

// Configuration des couleurs et styles
const colors = {
  darkGray: '#27272A',
  mediumGray: '#52525B',
  lightGray: '#F8FAFC',
  success: '#34D399',
  error: '#DD4425',
  darkMode: {
    paper: '#323238',
    input: '#2A2A2F',
    border: 'rgba(255, 255, 255, 0.08)',
    hover: '#3F3F46'
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [errors, setErrors] = useState({});
  
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

  // Validation des entrées
  const validateInput = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'sommeInitiale':
        if (value < 0) {
          newErrors.sommeInitiale = "Le montant doit être positif";
        } else {
          delete newErrors.sommeInitiale;
        }
        return { value: Math.max(0, value), errors: newErrors };
        
      case 'mensualite':
        if (value < 0) {
          newErrors.mensualite = "Le versement doit être positif";
        } else {
          delete newErrors.mensualite;
        }
        return { value: Math.max(0, value), errors: newErrors };
        
      case 'tauxAnnuel':
        if (value < 0 || value > 100) {
          newErrors.tauxAnnuel = "Le taux doit être entre 0 et 100%";
        } else {
          delete newErrors.tauxAnnuel;
        }
        return { value: Math.min(100, Math.max(0, value)), errors: newErrors };
        
      case 'nombreAnnees':
        if (value < 1 || value > 50) {
          newErrors.nombreAnnees = "La durée doit être entre 1 et 50 ans";
        } else {
          delete newErrors.nombreAnnees;
        }
        return { value: Math.min(50, Math.max(1, value)), errors: newErrors };
        
      default:
        return { value, errors: newErrors };
    }
  };

  // Création du thème
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? colors.darkGray : colors.lightGray,
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
            backgroundColor: isDarkMode ? colors.darkMode.paper : '#fff',
            backgroundImage: 'none'
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
    container: {
      minHeight: '100vh',
      py: 4,
      backgroundColor: theme.palette.background.default,
      transition: 'background-color 0.3s ease'
    },
    paper: {
      p: 3,
      backgroundColor: isDarkMode ? colors.darkMode.paper : '#fff',
      border: '1px solid',
      borderColor: isDarkMode ? colors.darkMode.border : 'rgba(0, 0, 0, 0.08)',
      borderRadius: 2,
      transition: 'background-color 0.3s ease'
    },
    resultCard: {
      height: '100%',
      transition: 'all 0.3s ease',
      backgroundColor: isDarkMode ? colors.darkMode.paper : '#fff',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
      }
    }
  };

  // Calcul des recommandations
  const calculateRecommendation = useCallback((trancheId) => {
    try {
      const tranche = TRANCHES.find(t => t.id === trancheId);
      if (!tranche) {
        console.warn(`Tranche non trouvée: ${trancheId}`);
        return { montantRecommande: 0, pourcentageRevenu: 0 };
      }

      const revenuMoyen = (tranche.min + tranche.max) / 2;
      return {
        montantRecommande: Math.round(revenuMoyen * tranche.tauxEpargneRecommande),
        pourcentageRevenu: tranche.tauxEpargneRecommande * 100
      };
    } catch (error) {
      console.error('Erreur dans le calcul de recommandation:', error);
      return { montantRecommande: 0, pourcentageRevenu: 0 };
    }
  }, []);

  // Calcul de l'investissement avec debounce
  const calculateInvestment = useCallback(
    debounce(() => {
      try {
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
      } catch (error) {
        console.error('Erreur dans le calcul:', error);
      }
    }, 300),
    [inputs, calculateRecommendation]
  );

  useEffect(() => {
    calculateInvestment();
    return () => {
      calculateInvestment.cancel();
    };
  }, [calculateInvestment]);

  // Formatage des mois pour le graphique
  const formatMois = (mois) => {
    if (mois === 0) return 'Début';
    if (mois % 12 === 0) return `${mois/12} an${mois > 12 ? 's' : ''}`;
    return `${mois} mois`;
  };

  const handleInputChange = (name, value) => {
    const { value: validatedValue, errors: newErrors } = validateInput(name, value);
    setInputs(prev => ({ ...prev, [name]: validatedValue }));
    setErrors(newErrors);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={customStyles.container}>
        <Container maxWidth="lg">
          {/* En-tête */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 600,
              color: isDarkMode ? '#fff' : colors.darkGray
            }}>
              Simulateur d'Investissement
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                />
              }
              label={isDarkMode ? "Mode clair" : "Mode sombre"}
            />
          </Box>

          <Grid container spacing={3}>
            {/* Sélection de la tranche de revenus */}
            <Grid item xs={12}>
              <Paper sx={customStyles.paper}>
                <FormControl fullWidth>
                  <InputLabel>Tranche de revenus</InputLabel>
                  <Select
                    value={inputs.trancheRevenu}
                    label="Tranche de revenus"
                    onChange={(e) => handleInputChange('trancheRevenu', e.target.value)}
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

            {/* Recommandation personnalisée */}
            <Grid item xs={12}>
              <Paper sx={customStyles.paper}>
                <Typography variant="h6" gutterBottom>
                  Recommandation personnalisée
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
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
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Capital initial (€)"
                  type="number"
                  value={inputs.sommeInitiale}
                  onChange={(e) => handleInputChange('sommeInitiale', parseFloat(e.target.value))}
                  error={!!errors.sommeInitiale}
                  helperText={errors.sommeInitiale}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EuroSymbol /></InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Versement mensuel (€)"
                  type="number"
                  value={inputs.mensualite}
                  onChange={(e) => handleInputChange('mensualite', parseFloat(e.target.value))}
                  error={!!errors.mensualite}
                  helperText={errors.mensualite}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EuroSymbol /></InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Taux annuel (%)"
                  type="number"
                  value={inputs.tauxAnnuel}
                  onChange={(e) => handleInputChange('tauxAnnuel', parseFloat(e.target.value))}
                  error={!!errors.tauxAnnuel}
                  helperText={errors.tauxAnnuel}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, max: 100, step: "0.1" }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Durée (années)"
                  type="number"
                  value={inputs.nombreAnnees}
                  onChange={(e) => handleInputChange('nombreAnnees', parseInt(e.target.value))}
                  error={!!errors.nombreAnnees}
                  helperText={errors.nombreAnnees}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>
            </Grid>

            {/* Résultats */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={customStyles.resultCard}>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
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

                <Grid item xs={12} md={4}>
                  <Card sx={{ ...customStyles.resultCard, borderLeft: `4px solid ${colors.success}` }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Gains en intérêts
                      </Typography>
                      <Typography variant="h4" sx={{ my: 1, color: colors.success }}>
                        {results.gains.toLocaleString('fr-FR')} €
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={customStyles.resultCard}>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
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
              <Paper sx={{ 
                ...customStyles.paper,
                '& .recharts-responsive-container': {
                  minHeight: {
                    xs: 300, // hauteur pour mobile
                    sm: 400  // hauteur pour desktop
                  }
                }
              }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Évolution de votre investissement
                </Typography>
                
                <Box sx={{ 
                  width: '100%',
                  '& .recharts-tooltip-wrapper': {
                    outline: 'none'
                  }
                }}>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart 
                      data={results.graphData}
                      margin={{ 
                        top: 5, 
                        right: 10, 
                        left: 0, 
                        bottom: 5 
                      }}
                      onMouseMove={(e) => {
                        if (e && e.isTooltipActive) {
                          // Logique pour le suivi tactile si nécessaire
                        }
                      }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
                      />
                      <XAxis
                        dataKey="mois"
                        tickFormatter={formatMois}
                        stroke={isDarkMode ? '#fff' : '#666'}
                        tick={{ fontSize: '0.75rem' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}k€`}
                        stroke={isDarkMode ? '#fff' : '#666'}
                        tick={{ fontSize: '0.75rem' }}
                        width={45}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value.toLocaleString('fr-FR')} €`,
                          name === 'total' ? '💰 Total' : '💶 Capital'
                        ]}
                        labelFormatter={(mois) => formatMois(mois)}
                        contentStyle={{
                          backgroundColor: isDarkMode ? colors.darkMode.paper : '#fff',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '0.875rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                        wrapperStyle={{
                          outline: 'none',
                          zIndex: 100
                        }}
                        cursor={{ strokeWidth: 1 }}
                        active
                      />
                      <Legend 
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => {
                          const labels = {
                            total: "💰 Total avec intérêts",
                            investi: "💶 Capital investi"
                          };
                          return labels[value] || value;
                        }}
                        wrapperStyle={{
                          fontSize: '0.875rem',
                          paddingBottom: '10px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="total"
                        stroke={colors.success}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ 
                          r: 6, 
                          fill: colors.success,
                          strokeWidth: 0 
                        }}
                        isAnimationActive={false} // Améliore les performances sur mobile
                      />
                      <Line
                        type="monotone"
                        dataKey="investi"
                        name="investi"
                        stroke={colors.error}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ 
                          r: 6, 
                          fill: colors.error,
                          strokeWidth: 0 
                        }}
                        isAnimationActive={false} // Améliore les performances sur mobile
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default InvestmentCalculator;