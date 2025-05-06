// ballFlight.js - Ball flight physics implementation
import { CONSTANTS } from './constants.js';
import { rungeKutta4 } from './integration.js';
import { ClubModel, CLUB_PRESETS } from './clubModel.js';

export class BallFlight {
  constructor() {
    // Initialize ball state
    this.reset();
    
    // Initialize default ball properties
    this.ballProperties = {
      mass: CONSTANTS.BALL_MASS,
      radius: CONSTANTS.BALL_RADIUS,
      compressionRate: 100, // Compression rate (harder = less compression)
      coreDesign: 'standard' // Affects spin generation and energy transfer
    };
  }
  
  reset() {
    // Initial position (origin)
    this.position = { x: 0, y: 0, z: 0 };
    
    // Initial velocity (will be set by launchBall)
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Initial spin (will be set by launchBall)
    this.spin = { 
      rate: 0,    // rpm
      axis: 0     // degrees (0 = pure backspin, positive = slice spin, negative = hook spin)
    };
    
    // Trajectory points for visualization
    this.trajectory = [];
    
    // Flight metrics
    this.metrics = {
      apexHeight: 0,
      apexDistance: 0,
      flightTime: 0,
      carryDistance: 0,
      totalDistance: 0,
      finalLateralDistance: 0
    };
    
    // State flags
    this.isFlightComplete = false;
    this.hasReachedApex = false;
    
    return this;
  }
  
  // Set ball properties
  setBallProperties(properties) {
    this.ballProperties = {
      ...this.ballProperties,
      ...properties
    };
    
    return this;
  }
  
  // Launch ball directly with specific launch parameters
  launchBall(launchParams) {
    this.reset();
    
    // Convert launch speed from mph to m/s
    const speedMS = launchParams.ballSpeed * CONSTANTS.MPH_TO_MS;
    
    // Convert launch angles from degrees to radians
    const launchAngleRad = launchParams.launchAngle * CONSTANTS.DEGREES_TO_RADIANS;
    const launchDirectionRad = launchParams.launchDirection * CONSTANTS.DEGREES_TO_RADIANS;
    
    // Calculate initial velocity components
    this.velocity = {
      x: speedMS * Math.cos(launchAngleRad) * Math.cos(launchDirectionRad),
      y: speedMS * Math.sin(launchAngleRad),
      z: speedMS * Math.cos(launchAngleRad) * Math.sin(launchDirectionRad)
    };
    
    // Set initial spin if provided
    if (launchParams.spinRate !== undefined) {
      this.spin.rate = launchParams.spinRate;
    }
    
    if (launchParams.spinAxis !== undefined) {
      this.spin.axis = launchParams.spinAxis;
    }
    
    // Store initial position and velocity in trajectory array
    this.trajectory.push({
      position: { ...this.position },
      velocity: { ...this.velocity },
      spin: { ...this.spin },
      time: 0
    });
    
    return this;
  }
  
  // Launch ball using club model and swing parameters
  launchWithClub(clubType, swingParams) {
    this.reset();
    
    // Get club configuration (either a preset or custom config)
    const clubConfig = typeof clubType === 'string' 
      ? CLUB_PRESETS[clubType] 
      : clubType;
    
    if (!clubConfig) {
      throw new Error(`Unknown club type: ${clubType}`);
    }
    
    // Create club model
    const club = new ClubModel(clubConfig);
    
    // Calculate impact conditions
    const impact = club.calculateImpact(swingParams);
    
    // Use impact results to launch the ball
    return this.launchBall({
      ballSpeed: impact.ballSpeed,
      launchAngle: impact.launchAngle,
      launchDirection: impact.launchDirection,
      spinRate: impact.spinRate,
      spinAxis: impact.spinAxis
    });
  }
  
  // Calculate forces acting on the ball
  calculateForces(position, velocity, spin) {
    // Calculate velocity magnitude
    const speed = Math.sqrt(
      velocity.x * velocity.x + 
      velocity.y * velocity.y + 
      velocity.z * velocity.z
    );
    
    // Calculate drag force magnitude
    const dragMagnitude = 0.5 * CONSTANTS.AIR_DENSITY * CONSTANTS.DRAG_COEFFICIENT * 
                          CONSTANTS.BALL_AREA * speed * speed;
    
    // Basic forces (gravity and drag)
    const forces = {
      // Drag force components (opposite to velocity direction)
      x: speed > 0 ? -dragMagnitude * velocity.x / speed : 0,
      y: -CONSTANTS.GRAVITY * this.ballProperties.mass + // Gravity force
         (speed > 0 ? -dragMagnitude * velocity.y / speed : 0), // Drag force
      z: speed > 0 ? -dragMagnitude * velocity.z / speed : 0
    };
    
    // Phase 2: Add Magnus force if ball has spin
    if (spin && spin.rate > 0) {
      // Calculate Magnus force (simplified in Phase 1)
      // Will be implemented properly in Phase 2
    }
    
    return forces;
  }
  
  // Calculate derivatives for numerical integration
  calculateDerivatives(state) {
    const forces = this.calculateForces(state.position, state.velocity, state.spin);
    
    return {
      // Position derivatives (= velocity)
      position: {
        x: state.velocity.x,
        y: state.velocity.y,
        z: state.velocity.z
      },
      // Velocity derivatives (= acceleration = force/mass)
      velocity: {
        x: forces.x / this.ballProperties.mass,
        y: forces.y / this.ballProperties.mass,
        z: forces.z / this.ballProperties.mass
      },
      // Spin derivatives (for now, assume constant spin)
      spin: {
        rate: 0, // rpm/s (constant spin in Phase 1)
        axis: 0  // degrees/s (constant axis in Phase 1)
      }
    };
  }
  
  // Update flight metrics as the ball flies
  updateMetrics(currentTime) {
    // Update apex height if ball is still ascending
    if (this.velocity.y > 0 && !this.hasReachedApex) {
      // Ball is still going up
      this.metrics.apexHeight = Math.max(this.metrics.apexHeight, this.position.y);
    } else if (this.velocity.y <= 0 && !this.hasReachedApex) {
      // Ball has reached apex
      this.hasReachedApex = true;
      this.metrics.apexHeight = this.position.y;
      this.metrics.apexDistance = Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z);
    }
    
    // Check if ball has hit the ground (y <= 0)
    if (this.position.y <= 0 && currentTime > 0) {
      this.isFlightComplete = true;
      this.metrics.flightTime = currentTime;
      
      // Calculate horizontal distance traveled (carry)
      this.metrics.carryDistance = Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z);
      
      // In Phase 1, we'll use a simple model for roll: 20% of carry distance
      this.metrics.totalDistance = this.metrics.carryDistance * 1.2;
      
      // Calculate lateral distance (z-component)
      this.metrics.finalLateralDistance = this.position.z;
    }
  }
  
  // Simulate the ball flight
  simulate() {
    let currentTime = 0;
    
    // Continue simulation until ball hits ground or max time is reached
    while (!this.isFlightComplete && currentTime < CONSTANTS.MAX_FLIGHT_TIME) {
      // Create current state object
      const currentState = {
        position: { ...this.position },
        velocity: { ...this.velocity },
        spin: { ...this.spin }
      };
      
      // Perform one step of numerical integration using RK4
      const newState = rungeKutta4(
        currentState,
        CONSTANTS.TIME_STEP,
        (state) => this.calculateDerivatives(state)
      );
      
      // Update position, velocity, and spin
      this.position = newState.position;
      this.velocity = newState.velocity;
      this.spin = newState.spin;
      
      // Increment time
      currentTime += CONSTANTS.TIME_STEP;
      
      // Add point to trajectory
      this.trajectory.push({
        position: { ...this.position },
        velocity: { ...this.velocity },
        spin: { ...this.spin },
        time: currentTime
      });
      
      // Update metrics
      this.updateMetrics(currentTime);
    }
    
    // Convert metrics to appropriate units for display
    return this.getResults();
  }
  
  // Get results in the appropriate units
  getResults() {
    return {
      // Convert all distances from meters to yards for display
      apexHeight: this.metrics.apexHeight * CONSTANTS.METERS_TO_YARDS,
      apexDistance: this.metrics.apexDistance * CONSTANTS.METERS_TO_YARDS,
      flightTime: this.metrics.flightTime,
      carryDistance: this.metrics.carryDistance * CONSTANTS.METERS_TO_YARDS,
      totalDistance: this.metrics.totalDistance * CONSTANTS.METERS_TO_YARDS,
      finalLateralDistance: this.metrics.finalLateralDistance * CONSTANTS.METERS_TO_YARDS,
      ballSpeed: Math.sqrt(
        this.velocity.x * this.velocity.x +
        this.velocity.y * this.velocity.y +
        this.velocity.z * this.velocity.z
      ) * CONSTANTS.MS_TO_MPH,
      launchAngle: Math.atan2(this.velocity.y, 
        Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z)
      ) * CONSTANTS.RADIANS_TO_DEGREES,
      launchDirection: Math.atan2(this.velocity.z, this.velocity.x) * CONSTANTS.RADIANS_TO_DEGREES,
      spinRate: this.spin.rate,
      spinAxis: this.spin.axis,
      trajectory: this.trajectory.map(point => ({
        position: {
          x: point.position.x * CONSTANTS.METERS_TO_YARDS,
          y: point.position.y * CONSTANTS.METERS_TO_YARDS,
          z: point.position.z * CONSTANTS.METERS_TO_YARDS
        },
        velocity: {
          x: point.velocity.x * CONSTANTS.MS_TO_MPH,
          y: point.velocity.y * CONSTANTS.MS_TO_MPH,
          z: point.velocity.z * CONSTANTS.MS_TO_MPH
        },
        spin: point.spin,
        time: point.time
      }))
    };
  }
}