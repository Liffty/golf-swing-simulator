# golf-swing-simulator
A physics-based golf simulator with club model differentiation

# Denne readme er mest til at claude kan forstå konteskten.
# Golf Swing Simulator

A physics-based golf simulator that accurately models ball flight based on club type, club design, and swing mechanics.

## Project Overview

This golf simulator focuses on accurately modeling the differences between various club designs (blades, cavity backs, game improvement irons) and their impact on ball flight. The project uses realistic physics models including aerodynamics, clubhead dynamics, and the D-Plane theory of ball flight.

### Key Features

- **Accurate Ball Flight Physics**: Models gravity, drag, and the Magnus effect
- **Club Design Differentiation**: Simulates how different club designs (blade, cavity back, game improvement) affect ball flight
- **Impact Physics**: Models off-center hits and the gear effect
- **Interactive UI**: Visualize trajectories from multiple angles
- **Club Comparison**: Direct comparison of multiple club types with the same swing

## Project Structure

```
golf-swing-simulator/
├── src/
│   ├── physics/
│   │   ├── constants.js     # Physical constants and configuration
│   │   ├── ballFlight.js    # Ball flight calculations
│   │   ├── integration.js   # Numerical integration methods
│   │   └── clubModel.js     # Club simulation model
│   └── ui/                  # (Future improvement: separate UI components)
├── index.html               # Main HTML file with UI
└── README.md                # This file
```

## Development Phases

The project follows a phased development approach:

### Phase 1 (Current)
- Basic flight model with gravity and drag
- Core clubhead impact model
- Simple club design differentiation
- Basic trajectory visualization

### Phase 2 (Planned)
- Advanced ball physics with Magnus effect
- Detailed spin calculations
- Enhanced club design parameters

### Phase 3 (Future)
- Environmental factors (wind, air density, humidity)
- Ground interaction physics (bounce and roll)
- Specific manufacturer club models

### Phase 4 (Future)
- 3D visualization
- Advanced club customization
- Validation against launch monitor data

## Physics Model

### Ball Flight

The simulator uses a system of differential equations to model ball flight:

1. **Gravity**: Constant downward force
2. **Drag**: Air resistance based on ball speed and aerodynamic properties
3. **Magnus Force**: Lift and directional forces created by ball spin (Phase 2)

These are solved using a 4th-order Runge-Kutta numerical integration method.

### Club Impact

The club impact model calculates:

1. **Energy Transfer**: How efficiently the club transfers energy to the ball
2. **Launch Conditions**: Ball speed, launch angle, and direction
3. **Spin Generation**: How much spin (back and side) is created
4. **Gear Effect**: How off-center hits affect spin and direction

### Club Design Differences

The key club design differences modeled:

- **Blades**: 
  - Smaller sweet spot
  - More pronounced gear effect
  - Higher spin generation
  - Lower launch angles

- **Cavity Backs**:
  - Medium-sized sweet spot
  - More forgiving on off-center hits
  - Moderate spin generation
  - Slightly higher launch angles

- **Game Improvement**:
  - Large sweet spot
  - Most forgiving on off-center hits
  - Lower spin generation
  - Highest launch angles
  - Stronger lofts for more distance

## Usage

### Running the Simulator

1. Clone this repository
2. Open `index.html` in a modern web browser
3. Adjust club and swing settings
4. Click "Simulate Shot" to see the ball flight

### Club Settings

- **Club Type**: Choose from preset club types
- **Custom Club Settings**: Fine-tune loft, design, and sweet spot size

### Swing Settings

- **Club Speed**: How fast the club is moving at impact
- **Attack Angle**: Whether the club is moving up or down at impact
- **Club Path**: In-to-out or out-to-in swing path
- **Face Angle**: Whether the face is open, closed, or square

### Impact Settings

- **Impact Location**: Where on the clubface the ball is struck

## Future Enhancements

- Add specific manufacturer club models
- Implement more advanced physics calculations
- Create a 3D visualization using Three.js
- Add player swing profiles
- Expand club database with real-world specifications
- Validate against TrackMan data

## Technical Implementation

The simulator uses modern JavaScript with modular design principles. The physics engine is separated from the UI, making it easy to extend or modify specific components.

- **Physics**: Custom-built differential equation solver with aerodynamic models
- **Club Model**: Parameter-based club modeling system
- **UI**: Vanilla JavaScript with HTML5 Canvas for visualization

## References

- TrackMan data and D-Plane theory for ball flight laws
- Golf physics research papers
- Club design specifications from major manufacturers
