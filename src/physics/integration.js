// integration.js - Numerical integration methods
export function rungeKutta4(state, timeStep, derivativeFn) {
  // Clone state to avoid modifying the original
  const originalState = {
    position: { ...state.position },
    velocity: { ...state.velocity }
  };
  
  // Step 1: Calculate k1 (derivatives at the beginning of the interval)
  const k1 = derivativeFn(originalState);
  
  // Step 2: Calculate k2 (derivatives at the midpoint using k1)
  const halfStepState1 = {
    position: {
      x: originalState.position.x + k1.position.x * timeStep / 2,
      y: originalState.position.y + k1.position.y * timeStep / 2,
      z: originalState.position.z + k1.position.z * timeStep / 2
    },
    velocity: {
      x: originalState.velocity.x + k1.velocity.x * timeStep / 2,
      y: originalState.velocity.y + k1.velocity.y * timeStep / 2,
      z: originalState.velocity.z + k1.velocity.z * timeStep / 2
    }
  };
  const k2 = derivativeFn(halfStepState1);
  
  // Step 3: Calculate k3 (derivatives at the midpoint using k2)
  const halfStepState2 = {
    position: {
      x: originalState.position.x + k2.position.x * timeStep / 2,
      y: originalState.position.y + k2.position.y * timeStep / 2,
      z: originalState.position.z + k2.position.z * timeStep / 2
    },
    velocity: {
      x: originalState.velocity.x + k2.velocity.x * timeStep / 2,
      y: originalState.velocity.y + k2.velocity.y * timeStep / 2,
      z: originalState.velocity.z + k2.velocity.z * timeStep / 2
    }
  };
  const k3 = derivativeFn(halfStepState2);
  
  // Step 4: Calculate k4 (derivatives at the end of the interval using k3)
  const fullStepState = {
    position: {
      x: originalState.position.x + k3.position.x * timeStep,
      y: originalState.position.y + k3.position.y * timeStep,
      z: originalState.position.z + k3.position.z * timeStep
    },
    velocity: {
      x: originalState.velocity.x + k3.velocity.x * timeStep,
      y: originalState.velocity.y + k3.velocity.y * timeStep,
      z: originalState.velocity.z + k3.velocity.z * timeStep
    }
  };
  const k4 = derivativeFn(fullStepState);
  
  // Step 5: Compute the weighted average of the derivatives
  const newState = {
    position: {
      x: originalState.position.x + (timeStep / 6) * (
        k1.position.x + 2 * k2.position.x + 2 * k3.position.x + k4.position.x
      ),
      y: originalState.position.y + (timeStep / 6) * (
        k1.position.y + 2 * k2.position.y + 2 * k3.position.y + k4.position.y
      ),
      z: originalState.position.z + (timeStep / 6) * (
        k1.position.z + 2 * k2.position.z + 2 * k3.position.z + k4.position.z
      )
    },
    velocity: {
      x: originalState.velocity.x + (timeStep / 6) * (
        k1.velocity.x + 2 * k2.velocity.x + 2 * k3.velocity.x + k4.velocity.x
      ),
      y: originalState.velocity.y + (timeStep / 6) * (
        k1.velocity.y + 2 * k2.velocity.y + 2 * k3.velocity.y + k4.velocity.y
      ),
      z: originalState.velocity.z + (timeStep / 6) * (
        k1.velocity.z + 2 * k2.velocity.z + 2 * k3.velocity.z + k4.velocity.z
      )
    }
  };
  
  return newState;
}
