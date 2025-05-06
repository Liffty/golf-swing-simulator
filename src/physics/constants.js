// constants.js - Physical constants and configuration
export const CONSTANTS = {
  // Physical constants
  GRAVITY: 9.81,           // m/s²
  AIR_DENSITY: 1.225,      // kg/m³ at sea level
  BALL_MASS: 0.0459,       // kg (45.9g standard golf ball)
  BALL_RADIUS: 0.02135,    // m (42.7mm diameter standard golf ball)
  BALL_AREA: Math.PI * 0.02135 * 0.02135, // m² (cross-sectional area)
  
  // Default drag coefficient (will be refined in later phases)
  DRAG_COEFFICIENT: 0.25,  // Simplified coefficient for Phase 1
  
  // Simulation settings
  TIME_STEP: 0.01,         // s (10ms for numerical integration)
  MAX_FLIGHT_TIME: 15,     // s (maximum flight time to simulate)
  
  // Conversion factors
  MPH_TO_MS: 0.44704,      // miles per hour to meters per second
  MS_TO_MPH: 2.23694,      // meters per second to miles per hour
  DEGREES_TO_RADIANS: Math.PI / 180,
  RADIANS_TO_DEGREES: 180 / Math.PI,
  METERS_TO_YARDS: 1.09361,
  YARDS_TO_METERS: 0.9144
};

