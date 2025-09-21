// Jest setup file for global test configuration

// Extend Jest matchers (uncomment if using @testing-library/jest-dom)
// import '@testing-library/jest-dom';

// Global test utilities
global.console = {
  ...console,
  // Silence console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.API_BASE_URL = 'http://localhost:3000';

// Global test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
});

// Global setup for async tests
beforeAll(async () => {
  // Setup code that runs once before all tests
});

afterAll(async () => {
  // Cleanup code that runs once after all tests
});

beforeEach(() => {
  // Setup code that runs before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup code that runs after each test
  jest.restoreAllMocks();
});

// Mock common modules
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Timeout for long-running tests
jest.setTimeout(30000);