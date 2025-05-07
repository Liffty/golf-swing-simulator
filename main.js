// main.js - Main application code for Golf Swing Simulator
import { CONSTANTS } from './src/physics/constants.js';
import { BallFlight } from './src/physics/ballFlight.js';
import { CLUB_PRESETS } from './src/physics/clubModel.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Golf Swing Simulator initializing...');
  
  // DOM Elements - Club Settings
  const clubTypeSelect = document.getElementById('club-type');
  const enableCustomClubCheckbox = document.getElementById('enable-custom-club');
  const customClubSettingsDiv = document.getElementById('custom-club-settings');
  const clubLoftInput = document.getElementById('club-loft');
  const clubLoftValue = document.getElementById('club-loft-value');
  const clubDesignSelect = document.getElementById('club-design');
  const sweetSpotSizeInput = document.getElementById('sweet-spot-size');
  const sweetSpotSizeValue = document.getElementById('sweet-spot-size-value');
  
  // DOM Elements - Swing Settings
  const clubSpeedInput = document.getElementById('club-speed');
  const clubSpeedValue = document.getElementById('club-speed-value');
  const attackAngleInput = document.getElementById('attack-angle');
  const attackAngleValue = document.getElementById('attack-angle-value');
  const clubPathInput = document.getElementById('club-path');
  const clubPathValue = document.getElementById('club-path-value');
  const faceAngleInput = document.getElementById('face-angle');
  const faceAngleValue = document.getElementById('face-angle-value');
  
  // DOM Elements - Impact Settings
  const impactPoint = document.getElementById('impact-point');
  const impactXValue = document.getElementById('impact-x-value');
  const impactYValue = document.getElementById('impact-y-value');
  
  // DOM Elements - Buttons and Results
  const simulateButton = document.getElementById('simulate-button');
  const compareButton = document.getElementById('compare-button');
  const viewTypeSelect = document.getElementById('view-type');
  const canvas = document.getElementById('trajectory-canvas');
  const ctx = canvas.getContext('2d');
  
  // DOM Elements - Results
  const ballSpeedResult = document.getElementById('ball-speed-result');
  const launchAngleResult = document.getElementById('launch-angle-result');
  const launchDirectionResult = document.getElementById('launch-direction-result');
  const spinRateResult = document.getElementById('spin-rate-result');
  const spinAxisResult = document.getElementById('spin-axis-result');
  const carryDistanceResult = document.getElementById('carry-distance-result');
  const totalDistanceResult = document.getElementById('total-distance-result');
  const maxHeightResult = document.getElementById('max-height-result');
  const lateralDistanceResult = document.getElementById('lateral-distance-result');
  const flightTimeResult = document.getElementById('flight-time-result');
  const shotShapeContainer = document.getElementById('shot-shape-container');
  const shotShapeDescription = document.getElementById('shot-shape-description');
  
  // DOM Elements - Comparison Results
  const comparisonResults = document.getElementById('comparison-results');
  const compBallSpeedBlade = document.getElementById('comp-ball-speed-blade');
  const compBallSpeedCavity = document.getElementById('comp-ball-speed-cavity');
  const compBallSpeedGI = document.getElementById('comp-ball-speed-gi');
  const compLaunchBlade = document.getElementById('comp-launch-blade');
  const compLaunchCavity = document.getElementById('comp-launch-cavity');
  const compLaunchGI = document.getElementById('comp-launch-gi');
  const compSpinBlade = document.getElementById('comp-spin-blade');
  const compSpinCavity = document.getElementById('comp-spin-cavity');
  const compSpinGI = document.getElementById('comp-spin-gi');
  const compCarryBlade = document.getElementById('comp-carry-blade');
  const compCarryCavity = document.getElementById('comp-carry-cavity');
  const compCarryGI = document.getElementById('comp-carry-gi');
  const compHeightBlade = document.getElementById('comp-height-blade');
  const compHeightCavity = document.getElementById('comp-height-cavity');
  const compHeightGI = document.getElementById('comp-height-gi');
  
  // Variables for trajectory visualization
  let currentTrajectories = [];
  let trajectoryColors = ['#2196F3', '#FF5722', '#4CAF50'];
  
  // Variables for impact point dragging
  let isDragging = false;
  let impactX = 0; // mm from center (positive = toe)
  let impactY = 0; // mm from center (positive = crown)
  
  // Debug logging for initialization
  console.log('DOM elements initialized');
  
  // Resize canvas to fit container
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Redraw trajectory if exists
    if (currentTrajectories.length > 0) {
      drawTrajectories(currentTrajectories, viewTypeSelect.value);
    }
    
    console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
  }
  
  // Initialize canvas
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log(`Tab clicked: ${button.getAttribute('data-tab')}`);
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Update input value displays
  clubLoftInput.addEventListener('input', () => {
    clubLoftValue.textContent = `${parseFloat(clubLoftInput.value).toFixed(1)}°`;
  });
  
  sweetSpotSizeInput.addEventListener('input', () => {
    sweetSpotSizeValue.textContent = parseFloat(sweetSpotSizeInput.value).toFixed(1);
  });
  
  clubSpeedInput.addEventListener('input', () => {
    clubSpeedValue.textContent = `${clubSpeedInput.value} mph`;
  });
  
  attackAngleInput.addEventListener('input', () => {
    attackAngleValue.textContent = `${parseFloat(attackAngleInput.value).toFixed(1)}°`;
  });
  
  clubPathInput.addEventListener('input', () => {
    clubPathValue.textContent = `${parseFloat(clubPathInput.value).toFixed(1)}°`;
  });
  
  faceAngleInput.addEventListener('input', () => {
    faceAngleValue.textContent = `${parseFloat(faceAngleInput.value).toFixed(1)}°`;
  });
  
  // Handle custom club settings toggle
  enableCustomClubCheckbox.addEventListener('change', () => {
    console.log(`Custom club settings: ${enableCustomClubCheckbox.checked}`);
    customClubSettingsDiv.style.display = enableCustomClubCheckbox.checked ? 'block' : 'none';
  });
  
  // Handle club type selection
  clubTypeSelect.addEventListener('change', () => {
    const selectedClubType = clubTypeSelect.value;
    console.log(`Club type selected: ${selectedClubType}`);
    
    const clubConfig = CLUB_PRESETS[selectedClubType];
    
    if (clubConfig) {
      // Update club loft
      clubLoftInput.value = clubConfig.loft;
      clubLoftValue.textContent = `${clubConfig.loft.toFixed(1)}°`;
      
      // Update club design
      clubDesignSelect.value = clubConfig.design;
      
      // Update sweet spot size
      sweetSpotSizeInput.value = clubConfig.sweetSpotSize;
      sweetSpotSizeValue.textContent = clubConfig.sweetSpotSize.toFixed(1);
      
      // Update attack angle based on club type
      if (selectedClubType.includes('DRIVER')) {
        attackAngleInput.value = 0;
        attackAngleValue.textContent = '0.0°';
      } else {
        attackAngleInput.value = -4;
        attackAngleValue.textContent = '-4.0°';
      }
    }
  });
  
  // Handle impact point dragging
  impactPoint.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
    console.log('Impact point drag started');
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const container = impactPoint.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Calculate relative position within container
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    
    // Convert to percentage (0-100%)
    const percentX = Math.max(0, Math.min(100, (relX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (relY / rect.height) * 100));
    
    // Update impact point position
    impactPoint.style.left = `${percentX}%`;
    impactPoint.style.top = `${percentY}%`;
    
    // Convert to mm from center (-15 to 15mm range)
    impactX = ((percentX / 100) * 30) - 15;
    impactY = 15 - ((percentY / 100) * 30);
    
    // Update display values
    impactXValue.textContent = `${impactX.toFixed(1)} mm`;
    impactYValue.textContent = `${impactY.toFixed(1)} mm`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      console.log('Impact point drag ended');
      isDragging = false;
    }
  });
  
  // Simulate button handler
  simulateButton.addEventListener('click', () => {
    console.log('Simulate button clicked');
    
    try {
      // Get club settings
      const clubType = enableCustomClubCheckbox.checked 
        ? {
            type: 'custom',
            loft: parseFloat(clubLoftInput.value),
            design: clubDesignSelect.value,
            sweetSpotSize: parseFloat(sweetSpotSizeInput.value),
            // Add other custom properties based on design
            ...(clubDesignSelect.value === 'blade' 
              ? { spinFactorCoefficient: 1.1, smashFactor: 1.38 } 
              : clubDesignSelect.value === 'cavity_back' 
                ? { spinFactorCoefficient: 0.95, smashFactor: 1.4 } 
                : { spinFactorCoefficient: 0.85, smashFactor: 1.42 })
          }
        : clubTypeSelect.value;
      
      // Get swing settings
      const swingParams = {
        clubSpeed: parseFloat(clubSpeedInput.value),
        attackAngle: parseFloat(attackAngleInput.value),
        clubPath: parseFloat(clubPathInput.value),
        faceAngle: parseFloat(faceAngleInput.value),
        impactLocation: {
          x: impactX,
          y: impactY
        }
      };
      
      console.log('Club settings:', clubType);
      console.log('Swing parameters:', swingParams);

      // Create ball flight instance and simulate shot
      const ballFlight = new BallFlight();
      const results = ballFlight.launchWithClub(clubType, swingParams).simulate();
      
      console.log('Shot results:', results);
      
      // Update results display
      updateResultsDisplay(results);
      
      // Update trajectory visualization
      currentTrajectories = [results.trajectory];
      drawTrajectories(currentTrajectories, viewTypeSelect.value);
      
      // Show shot shape description
      updateShotShapeDescription(results);
    } catch (error) {
      console.error('Error simulating shot:', error);
      alert(`Error simulating shot: ${error.message}`);
    }
  });

  // Compare button handler
  compareButton.addEventListener('click', () => {
    console.log('Compare button clicked');
    
    try {
      // Get swing settings (same for all clubs)
      const swingParams = {
        clubSpeed: parseFloat(clubSpeedInput.value),
        attackAngle: parseFloat(attackAngleInput.value),
        clubPath: parseFloat(clubPathInput.value),
        faceAngle: parseFloat(faceAngleInput.value),
        impactLocation: {
          x: impactX,
          y: impactY
        }
      };
      
      console.log('Comparing clubs with swing parameters:', swingParams);
      
      // Create results for each club type
      const bladeResults = new BallFlight()
        .launchWithClub('BLADE_7IRON', swingParams)
        .simulate();
      
      const cavityResults = new BallFlight()
        .launchWithClub('CAVITY_BACK_7IRON', swingParams)
        .simulate();
      
      const giResults = new BallFlight()
        .launchWithClub('GAME_IMPROVEMENT_7IRON', swingParams)
        .simulate();
      
      // Update comparison results display
      updateComparisonDisplay(bladeResults, cavityResults, giResults);
      
      // Show all trajectories
      currentTrajectories = [
        bladeResults.trajectory,
        cavityResults.trajectory,
        giResults.trajectory
      ];
      
      drawTrajectories(currentTrajectories, viewTypeSelect.value);
    } catch (error) {
      console.error('Error comparing clubs:', error);
      alert(`Error comparing clubs: ${error.message}`);
    }
  });

  // View type change handler
  viewTypeSelect.addEventListener('change', () => {
    console.log(`View type changed to: ${viewTypeSelect.value}`);
    if (currentTrajectories.length > 0) {
      drawTrajectories(currentTrajectories, viewTypeSelect.value);
    }
  });

  // Helper functions
  function updateResultsDisplay(results) {
    // Update all result fields
    ballSpeedResult.textContent = `${results.ballSpeed.toFixed(1)} mph`;
    launchAngleResult.textContent = `${results.launchAngle.toFixed(1)}°`;
    launchDirectionResult.textContent = `${results.launchDirection.toFixed(1)}°`;
    spinRateResult.textContent = `${results.spinRate.toFixed(0)} rpm`;
    spinAxisResult.textContent = `${results.spinAxis.toFixed(1)}°`;
    carryDistanceResult.textContent = `${results.carryDistance.toFixed(1)} yards`;
    totalDistanceResult.textContent = `${results.totalDistance.toFixed(1)} yards`;
    maxHeightResult.textContent = `${results.apexHeight.toFixed(1)} yards`;
    lateralDistanceResult.textContent = `${results.finalLateralDistance.toFixed(1)} yards`;
    flightTimeResult.textContent = `${results.flightTime.toFixed(2)} s`;
    
    // Show shot shape container
    shotShapeContainer.style.display = 'block';
  }

  function updateShotShapeDescription(results) {
    // Determine shot shape based on launch direction and spin axis
    let shotShape = '';
    
    if (Math.abs(results.launchDirection) < 1 && Math.abs(results.spinAxis) < 2) {
      shotShape = 'Straight';
    } else if (results.spinAxis > 5) {
      shotShape = 'Slice';
    } else if (results.spinAxis > 2) {
      shotShape = 'Fade';
    } else if (results.spinAxis < -5) {
      shotShape = 'Hook';
    } else if (results.spinAxis < -2) {
      shotShape = 'Draw';
    } else {
      shotShape = 'Slight Push/Pull';
    }
    
    shotShapeDescription.textContent = `${shotShape} shot with ${results.spinRate.toFixed(0)} rpm of spin.`;
  }

  function updateComparisonDisplay(bladeResults, cavityResults, giResults) {
    // Update comparison display
    compBallSpeedBlade.textContent = `${bladeResults.ballSpeed.toFixed(1)} mph`;
    compBallSpeedCavity.textContent = `${cavityResults.ballSpeed.toFixed(1)} mph`;
    compBallSpeedGI.textContent = `${giResults.ballSpeed.toFixed(1)} mph`;
    
    compLaunchBlade.textContent = `${bladeResults.launchAngle.toFixed(1)}°`;
    compLaunchCavity.textContent = `${cavityResults.launchAngle.toFixed(1)}°`;
    compLaunchGI.textContent = `${giResults.launchAngle.toFixed(1)}°`;
    
    compSpinBlade.textContent = `${bladeResults.spinRate.toFixed(0)} rpm`;
    compSpinCavity.textContent = `${cavityResults.spinRate.toFixed(0)} rpm`;
    compSpinGI.textContent = `${giResults.spinRate.toFixed(0)} rpm`;
    
    compCarryBlade.textContent = `${bladeResults.carryDistance.toFixed(1)} yds`;
    compCarryCavity.textContent = `${cavityResults.carryDistance.toFixed(1)} yds`;
    compCarryGI.textContent = `${giResults.carryDistance.toFixed(1)} yds`;
    
    compHeightBlade.textContent = `${bladeResults.apexHeight.toFixed(1)} yds`;
    compHeightCavity.textContent = `${cavityResults.apexHeight.toFixed(1)} yds`;
    compHeightGI.textContent = `${giResults.apexHeight.toFixed(1)} yds`;
    
    // Show comparison results
    comparisonResults.style.display = 'block';
  }

  // Draw trajectories on canvas
  function drawTrajectories(trajectories, viewType) {
    console.log(`Drawing ${trajectories.length} trajectories with view type: ${viewType}`);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!trajectories || trajectories.length === 0) return;
    
    // Calculate bounds for all trajectories
    let xMax = -Infinity, yMax = -Infinity, zMax = -Infinity;
    let xMin = Infinity, yMin = Infinity, zMin = Infinity;
    
    trajectories.forEach(trajectory => {
      trajectory.forEach(point => {
        const { x, y, z } = point.position;
        xMax = Math.max(xMax, x);
        yMax = Math.max(yMax, y);
        zMax = Math.max(zMax, z);
        xMin = Math.min(xMin, x);
        yMin = Math.min(yMin, y);
        zMin = Math.min(zMin, z);
      });
    });
    
    // Add padding
    const padding = 30;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // Function to map coordinates based on view type
    function mapCoordinates(point, viewType) {
      const { x, y, z } = point.position;
      
      switch (viewType) {
        case 'top': // Bird's eye view (x-z plane)
          return {
            x: padding + (x - xMin) * width / (xMax - xMin || 1),
            y: height + padding - (z - zMin) * height / (zMax - zMin || 1)
          };
        case 'side': // Side view (x-y plane)
          return {
            x: padding + (x - xMin) * width / (xMax - xMin || 1),
            y: height + padding - (y - yMin) * height / (yMax - yMin || 1)
          };
        case 'front': // Front view (y-z plane)
          return {
            x: padding + (z - zMin) * width / (zMax - zMin || 1),
            y: height + padding - (y - yMin) * height / (yMax - yMin || 1)
          };
        default:
          return { x: 0, y: 0 };
      }
    }
    
    // Draw each trajectory
    trajectories.forEach((trajectory, index) => {
      if (trajectory.length < 2) return;
      
      ctx.beginPath();
      
      // Set line style
      ctx.strokeStyle = trajectoryColors[index % trajectoryColors.length];
      ctx.lineWidth = 2;
      
      // Draw trajectory path
      const startPoint = mapCoordinates(trajectory[0], viewType);
      ctx.moveTo(startPoint.x, startPoint.y);
      
      for (let i = 1; i < trajectory.length; i++) {
        const point = mapCoordinates(trajectory[i], viewType);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
      
      // Draw ball at the end of trajectory
      const endPoint = mapCoordinates(trajectory[trajectory.length - 1], viewType);
      if (trajectory[trajectory.length - 1].position.y <= 0) {
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(endPoint.x, endPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw ground plane for side and front views
    if (viewType === 'side' || viewType === 'front') {
      const groundY = height + padding - (0 - yMin) * height / (yMax - yMin || 1);
      
      ctx.beginPath();
      ctx.strokeStyle = '#888';
      ctx.setLineDash([5, 5]);
      ctx.moveTo(padding, groundY);
      ctx.lineTo(width + padding, groundY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    
    switch (viewType) {
      case 'top':
        ctx.fillText('Distance (yards)', width / 2 + padding, height + padding + 20);
        ctx.fillText('Lateral (yards)', padding - 20, height / 2 + padding);
        break;
      case 'side':
        ctx.fillText('Distance (yards)', width / 2 + padding, height + padding + 20);
        ctx.fillText('Height (yards)', padding - 20, height / 2 + padding);
        break;
      case 'front':
        ctx.fillText('Lateral (yards)', width / 2 + padding, height + padding + 20);
        ctx.fillText('Height (yards)', padding - 20, height / 2 + padding);
        break;
    }
  }
  
  // Initialize with default club type
  const event = new Event('change');
  clubTypeSelect.dispatchEvent(event);
  
  console.log('Golf Swing Simulator initialization complete');
});
