// clubModel.js - Club physics model
import { CONSTANTS } from './constants.js';

export class ClubModel {
  constructor(clubConfig) {
    // Club configuration
    this.config = {
      // Basic club properties
      type: clubConfig.type || 'driver',       // driver, iron, wedge, etc.
      loft: clubConfig.loft || 10.5,           // degrees
      lie: clubConfig.lie || 56,               // degrees
      
      // Advanced club properties
      headWeight: clubConfig.headWeight || 200, // grams
      cg: clubConfig.cg || {                   // Center of gravity location
        x: 0,                                  // mm from center (heel to toe)
        y: 0,                                  // mm from center (sole to crown)
        z: 0                                   // mm from center (face to back)
      },
      moi: clubConfig.moi || {                 // Moment of inertia
        x: 4500,                               // g·cm² (around x-axis)
        y: 2500,                               // g·cm² (around y-axis)
        z: 5000                                // g·cm² (around z-axis)
      },
      
      // Club design (affects energy transfer and spin generation)
      design: clubConfig.design || 'blade',    // 'blade', 'cavity_back', 'hybrid', etc.
      faceThickness: clubConfig.faceThickness || 2.8, // mm
      smashFactor: clubConfig.smashFactor || 1.48, // Maximum energy transfer coefficient
      spinFactorCoefficient: clubConfig.spinFactorCoefficient || 1.0, // Higher for more spin-generating clubs
      
      // Sweet spot size (affects gear effect)
      sweetSpotSize: clubConfig.sweetSpotSize || 1.0 // Relative size, larger = more forgiving
    };
  }
  
  // Calculate impact conditions based on swing parameters
  calculateImpact(swingParams) {
    // Validate swing parameters
    this._validateSwingParams(swingParams);
    
    // Calculate effective loft at impact
    const effectiveLoft = this._calculateEffectiveLoft(swingParams);
    
    // Calculate impact location relative to sweet spot (center of face)
    const impactLocation = this._normalizeImpactLocation(swingParams.impactLocation);
    
    // Calculate gear effect based on impact location and club properties
    const gearEffect = this._calculateGearEffect(impactLocation);
    
    // Calculate energy transfer (ball speed)
    const ballSpeed = this._calculateBallSpeed(swingParams.clubSpeed, impactLocation);
    
    // Calculate launch angle
    const launchAngle = this._calculateLaunchAngle(effectiveLoft, impactLocation, swingParams.attackAngle);
    
    // Calculate launch direction
    const launchDirection = this._calculateLaunchDirection(swingParams.faceAngle, swingParams.clubPath);
    
    // Calculate spin rate and axis
    const spin = this._calculateSpin(swingParams, effectiveLoft, impactLocation, gearEffect);
    
    // Return complete impact results
    return {
      ballSpeed,
      launchAngle,
      launchDirection,
      spinRate: spin.rate,
      spinAxis: spin.axis,
      efficiency: spin.efficiency,
      compression: this._calculateBallCompression(ballSpeed),
      smashFactor: ballSpeed / swingParams.clubSpeed
    };
  }
  
  // Validate swing parameters
  _validateSwingParams(params) {
    // Required parameters
    const required = ['clubSpeed', 'attackAngle', 'clubPath', 'faceAngle', 'impactLocation'];
    
    for (const param of required) {
      if (params[param] === undefined) {
        throw new Error(`Missing required swing parameter: ${param}`);
      }
    }
    
    // Set defaults for optional parameters
    params.faceToPath = params.faceToPath || (params.faceAngle - params.clubPath);
    params.dynamicLoft = params.dynamicLoft || (this.config.loft + params.attackAngle);
    
    return params;
  }
  
  // Calculate effective loft at impact (combines static loft, attack angle, and shaft lean)
  _calculateEffectiveLoft(swingParams) {
    // Base loft is the club's static loft
    let effectiveLoft = this.config.loft;
    
    // Add attack angle contribution (positive attack angle adds loft)
    effectiveLoft += swingParams.attackAngle;
    
    // Add shaft lean contribution (forward shaft lean decreases loft)
    if (swingParams.shaftLean) {
      effectiveLoft -= swingParams.shaftLean;
    }
    
    // Dynamic loft override if provided
    if (swingParams.dynamicLoft !== undefined) {
      effectiveLoft = swingParams.dynamicLoft;
    }
    
    // Different club designs may affect effective loft differently
    if (this.config.design === 'cavity_back') {
      // Cavity backs tend to create slightly higher launch
      effectiveLoft *= 1.02;
    }
    
    return effectiveLoft;
  }
  
  // Normalize impact location to a standard coordinate system
  _normalizeImpactLocation(impactLocation) {
    // If no impact location provided, assume center of face
    if (!impactLocation) {
      return { x: 0, y: 0 };
    }
    
    // Return normalized location (mm from center)
    return {
      x: impactLocation.x || 0, // Heel (-) to toe (+) in mm
      y: impactLocation.y || 0  // Low (-) to high (+) in mm
    };
  }
  
  // Calculate gear effect based on impact location
  _calculateGearEffect(impactLocation) {
    // Distance from center of face affects gear effect strength
    const distanceFromCenter = Math.sqrt(
      impactLocation.x * impactLocation.x + 
      impactLocation.y * impactLocation.y
    );
    
    // Different club designs have different gear effect properties
    let gearEffectCoefficient;
    
    switch (this.config.design) {
      case 'blade':
        // Blades typically have more pronounced gear effect
        gearEffectCoefficient = 1.2;
        break;
      case 'cavity_back':
        // Cavity backs typically have reduced gear effect
        gearEffectCoefficient = 0.8;
        break;
      case 'game_improvement':
        // Game improvement irons have even less gear effect
        gearEffectCoefficient = 0.6;
        break;
      default:
        gearEffectCoefficient = 1.0;
    }
    
    // Sweet spot size affects gear effect (larger sweet spot = less gear effect)
    gearEffectCoefficient /= this.config.sweetSpotSize;
    
    // Horizontal gear effect (impact toward toe = hook spin, impact toward heel = slice spin)
    const horizontalGearEffect = -impactLocation.x * 0.15 * gearEffectCoefficient;
    
    // Vertical gear effect (impact high = more backspin, impact low = less backspin)
    const verticalGearEffect = impactLocation.y * 0.1 * gearEffectCoefficient;
    
    return {
      horizontal: horizontalGearEffect, // Degrees of spin axis change
      vertical: verticalGearEffect      // Percentage of spin rate change
    };
  }
  
  // Calculate ball speed based on club speed and impact location
  _calculateBallSpeed(clubSpeed, impactLocation) {
    // Base calculation using smash factor
    let ballSpeed = clubSpeed * this.config.smashFactor;
    
    // Adjust for off-center hits
    const distanceFromCenter = Math.sqrt(
      impactLocation.x * impactLocation.x + 
      impactLocation.y * impactLocation.y
    );
    
    // Energy transfer efficiency drops with distance from sweet spot
    // Rate of drop depends on club design (MOI)
    let efficiencyLoss;
    
    switch (this.config.design) {
      case 'blade':
        // Blades are less forgiving on off-center hits
        efficiencyLoss = 0.08 * distanceFromCenter;
        break;
      case 'cavity_back':
        // Cavity backs are more forgiving
        efficiencyLoss = 0.05 * distanceFromCenter;
        break;
      case 'game_improvement':
        // Game improvement irons are most forgiving
        efficiencyLoss = 0.03 * distanceFromCenter;
        break;
      default:
        efficiencyLoss = 0.06 * distanceFromCenter;
    }
    
    // Larger MOI means less speed loss on off-center hits
    efficiencyLoss /= Math.sqrt(this.config.moi.y / 3000);
    
    // Apply efficiency loss capped at a maximum value
    const maxEfficiencyLoss = 0.3; // 30% maximum loss
    const actualEfficiencyLoss = Math.min(efficiencyLoss, maxEfficiencyLoss);
    
    // Apply efficiency loss to ball speed
    ballSpeed *= (1 - actualEfficiencyLoss);
    
    return ballSpeed;
  }
  
  // Calculate launch angle based on effective loft and impact location
  _calculateLaunchAngle(effectiveLoft, impactLocation, attackAngle) {
    // Base launch angle from effective loft (typically about 75-85% of effective loft)
    let launchAngle = effectiveLoft * 0.8;
    
    // Vertical impact location affects launch angle
    // Higher impacts increase launch angle (vertical gear effect)
    launchAngle += impactLocation.y * 0.2;
    
    // Club design can affect launch angle
    if (this.config.design === 'blade') {
      // Blades typically launch lower
      launchAngle *= 0.95;
    } else if (this.config.design === 'game_improvement') {
      // Game improvement irons typically launch higher
      launchAngle *= 1.05;
    }
    
    // Return launch angle
    return launchAngle;
  }
  
  // Calculate launch direction based on face angle and club path
  _calculateLaunchDirection(faceAngle, clubPath) {
    // New ball flight laws: initial direction is ~85% face angle, ~15% club path
    return faceAngle * 0.85 + clubPath * 0.15;
  }
  
  // Calculate spin rate and axis
  _calculateSpin(swingParams, effectiveLoft, impactLocation, gearEffect) {
    // Base spin calculation
    // Spin loft = effective loft - attack angle
    const spinLoft = effectiveLoft - swingParams.attackAngle;
    
    // Base spin rate calculation (simplified model)
    // Higher spin loft = more spin
    let spinRate = 50 * spinLoft * swingParams.clubSpeed;
    
    // Adjust for club design
    spinRate *= this.config.spinFactorCoefficient;
    
    // Adjust for vertical impact location (gear effect)
    const verticalAdjustment = 1 + gearEffect.vertical;
    spinRate *= verticalAdjustment;
    
    // Calculate spin axis from face-to-path difference
    // 0 = pure backspin, positive = slice spin, negative = hook spin
    let spinAxis = swingParams.faceToPath;
    
    // Adjust for horizontal gear effect
    spinAxis += gearEffect.horizontal;
    
    // Calculate spin efficiency (how much of the spin is "useful" backspin vs. side spin)
    const spinEfficiency = Math.cos(spinAxis * CONSTANTS.DEGREES_TO_RADIANS);
    
    return {
      rate: spinRate,
      axis: spinAxis,
      efficiency: spinEfficiency
    };
  }
  
  // Calculate ball compression at impact
  _calculateBallCompression(ballSpeed) {
    // Simple linear model for ball compression
    // Higher ball speeds create more compression
    return 0.2 * ballSpeed;
  }
}

// Define preset club models
export const CLUB_PRESETS = {
  // Drivers
  DRIVER_STANDARD: {
    type: 'driver',
    loft: 10.5,
    design: 'modern',
    headWeight: 200,
    moi: { x: 5200, y: 3000, z: 5500 },
    smashFactor: 1.48,
    spinFactorCoefficient: 0.9
  },
  
  // Irons - Blades
  BLADE_7IRON: {
    type: 'iron',
    loft: 34,
    design: 'blade',
    headWeight: 268,
    cg: { x: 0, y: -5, z: 0 },
    moi: { x: 2800, y: 1500, z: 2500 },
    smashFactor: 1.38,
    spinFactorCoefficient: 1.1,
    sweetSpotSize: 0.8
  },
  
  // Irons - Cavity Back
  CAVITY_BACK_7IRON: {
    type: 'iron',
    loft: 31, // Modern cavity backs often have stronger lofts
    design: 'cavity_back',
    headWeight: 272,
    cg: { x: 0, y: -3, z: 4 }, // CG further back
    moi: { x: 3200, y: 1800, z: 3000 }, // Higher MOI
    smashFactor: 1.4,
    spinFactorCoefficient: 0.95,
    sweetSpotSize: 1.2
  },
  
  // Game Improvement Irons
  GAME_IMPROVEMENT_7IRON: {
    type: 'iron',
    loft: 28, // Even stronger lofts
    design: 'game_improvement',
    headWeight: 280,
    cg: { x: 0, y: -2, z: 8 }, // CG much further back
    moi: { x: 4000, y: 2200, z: 3800 }, // Much higher MOI
    smashFactor: 1.42,
    spinFactorCoefficient: 0.85,
    sweetSpotSize: 1.6
  },
  
  // Wedges
  WEDGE_PITCHING: {
    type: 'wedge',
    loft: 46,
    design: 'blade',
    headWeight: 284,
    cg: { x: 0, y: -4, z: 2 },
    moi: { x: 2400, y: 1300, z: 2200 },
    smashFactor: 1.3,
    spinFactorCoefficient: 1.2,
    sweetSpotSize: 0.9
  }
};